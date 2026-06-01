/****************************************************************
 *                    COPILOTLOGCAPTURE.TS                      *
 *  READS GITHUB COPILOT CHAT LOG FILES AND EXTRACTS COMPLETED  *
 *  LLM CALLS. WORKS ALONGSIDE THE PROXY — COVERS VSCODE-SIDE  *
 *  INTERACTIONS THAT THE NETWORK PROXY CANNOT INTERCEPT.       *
 *                                                              *
 *  SUPPORTED: Claude models (exact tokens via SSE usage data)  *
 *  PARTIAL:   GPT models (captured when usage is in log)       *
 ****************************************************************/

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { calculateEmission } from '../convert';
import { updateTree } from '../callManager';
import { logger } from '../../utils/logger';
import { Call } from '../budget';

// Looks back this many characters before a ccreq line to find token data.
// One Copilot response is typically well under 20 KB of SSE lines.
const LOOKBACK_CHARS = 20_000;

let lastAccessTimestamp = 0;

export function resetLogAccess(): void {
    lastAccessTimestamp = 0;
}

export async function captureCopilotLogs(context: vscode.ExtensionContext): Promise<void> {
    const logPath = getLogFilePath(context);
    if (!logPath) { return; }

    try {
        const content = fs.readFileSync(logPath, 'utf-8');
        const calls = parseCopilotLog(content, lastAccessTimestamp);

        for (const call of calls) {
            updateTree(call);
        }

        if (calls.length > 0) {
            lastAccessTimestamp = Math.max(...calls.map(c => c.DateTime));
            logger.debug(`Copilot log: ${calls.length} new call(s) captured`);
        }
    } catch {
        // Log file not available — Copilot may not be installed or not yet used
    }
}

function getLogFilePath(context: vscode.ExtensionContext): string | null {
    try {
        return path.join(
            path.dirname(context.logPath),
            'GitHub.copilot-chat',
            'GitHub Copilot Chat.log',
        );
    } catch {
        return null;
    }
}

// Exported for unit tests
export function parseCopilotLog(content: string, afterTimestamp: number): Call[] {
    const calls: Call[] = [];

    // Each completed request has a ccreq success line:
    // "2026-04-29 00:55:36.156 [info] ccreq:xxx.copilotmd | success | claude-haiku-4.5 -> ..."
    const ccreqRegex =
        /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}) \[info\] ccreq:\S+\.copilotmd \| success \| (\S+)/g;

    let match: RegExpExecArray | null;
    while ((match = ccreqRegex.exec(content)) !== null) {
        const [, dateStr, rawModel] = match;
        const timestamp = new Date(dateStr + 'Z').getTime();

        if (timestamp <= afterTimestamp) { continue; }

        // Model name may include "-> actual-deployment-id" — keep only the public name
        const model = rawModel.split('->')[0].trim();

        const lookbackStart = Math.max(0, match.index - LOOKBACK_CHARS);
        const block = content.substring(lookbackStart, match.index);

        const tokens = extractTokens(block, model);
        if (tokens === null) { continue; }

        const emissions = Number(calculateEmission(model, tokens).toFixed(4));
        calls.push({ Model: model, Emissions: emissions, DateTime: timestamp });
    }

    return calls;
}

function extractTokens(block: string, model: string): number | null {
    if (model.startsWith('claude')) {
        return extractClaudeTokens(block);
    }
    return extractGptTokens(block);
}

// Claude SSE: the message_delta event carries stop_reason + usage with all token types
function extractClaudeTokens(block: string): number | null {
    // Match the last stop_reason:end_turn line that contains a usage object
    const endTurnIdx = block.lastIndexOf('"stop_reason":"end_turn"');
    if (endTurnIdx === -1) { return null; }

    const usageStart = block.indexOf('"usage":{', endTurnIdx);
    if (usageStart === -1) { return null; }

    const usageEnd = block.indexOf('}', usageStart);
    if (usageEnd === -1) { return null; }

    const usageStr = block.substring(usageStart, usageEnd + 1);
    return sumTokenFields(usageStr, [
        'input_tokens',
        'output_tokens',
        'cache_creation_input_tokens',
        'cache_read_input_tokens',
    ]);
}

// GPT: usage JSON appears in the response stream when present
function extractGptTokens(block: string): number | null {
    // Look for OpenAI usage format: "usage":{"prompt_tokens":N,"completion_tokens":N,...}
    const usageIdx = block.lastIndexOf('"usage":{"prompt_tokens"');
    if (usageIdx === -1) { return null; }

    const usageEnd = block.indexOf('}', usageIdx);
    if (usageEnd === -1) { return null; }

    const usageStr = block.substring(usageIdx, usageEnd + 1);
    return sumTokenFields(usageStr, ['prompt_tokens', 'completion_tokens']);
}

function sumTokenFields(usageStr: string, fields: string[]): number | null {
    let total = 0;
    for (const field of fields) {
        const m = usageStr.match(new RegExp(`"${field}":(\\d+)`));
        if (m) { total += parseInt(m[1], 10); }
    }
    return total > 0 ? total : null;
}
