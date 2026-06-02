/****************************************************************
 *                   COPILOTLOGPROVIDER.TS                      *
 *  LOG PROVIDER FOR GITHUB COPILOT CHAT.                       *
 *  SUPPORTED: Claude models (exact tokens via SSE usage data)  *
 *  PARTIAL:   GPT models (captured when usage is in log)       *
 ****************************************************************/

import * as path from 'path';
import * as vscode from 'vscode';
import { calculateEmission } from '../../../../convert';
import { Call } from '../../../../budget';
import { makeCallId } from '../../../../../utils/callId';
import { LogProvider } from '../logProvider';

const LOOKBACK_CHARS = 20_000;

interface TokenCounts {
    input: number;
    output: number;
    cacheCreation: number;
    cacheRead: number;
}

export const copilotLogProvider: LogProvider = {
    id: 'copilot',
    displayName: 'GitHub Copilot Chat',

    getLogPaths(context: vscode.ExtensionContext): string[] {
        try {
            return [path.join(
                path.dirname(context.logPath),
                'GitHub.copilot-chat',
                'GitHub Copilot Chat.log',
            )];
        } catch {
            return [];
        }
    },

    parseLogs(content: string, afterTimestamp: number): Call[] {
        const calls: Call[] = [];

        const ccreqRegex =
            /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}) \[info\] ccreq:\S+\.copilotmd \| success \| (\S+)/g;

        let match: RegExpExecArray | null;
        while ((match = ccreqRegex.exec(content)) !== null) {
            const [, dateStr, rawModel] = match;
            // Copilot logs use local time without timezone — parse as local, not UTC
            const timestamp = parseLocalTimestamp(dateStr);

            if (timestamp <= afterTimestamp) { continue; }

            const model = rawModel.split('->')[0].trim();

            const lookbackStart = Math.max(0, match.index - LOOKBACK_CHARS);
            const block = content.substring(lookbackStart, match.index);

            const tokens = extractTokens(block, model);
            if (tokens === null) { continue; }

            const totalTokens = tokens.input + tokens.output + tokens.cacheCreation + tokens.cacheRead;
            const emissions = Number(calculateEmission(model, totalTokens).toFixed(4));
            const callId    = makeCallId(model, tokens.input, tokens.output, tokens.cacheCreation, tokens.cacheRead);
            calls.push({ Model: model, Emissions: emissions, DateTime: timestamp, callId });
        }

        return calls;
    },
};

function extractTokens(block: string, model: string): TokenCounts | null {
    return model.startsWith('claude')
        ? extractClaudeTokens(block)
        : extractGptTokens(block);
}

function extractClaudeTokens(block: string): TokenCounts | null {
    const endTurnIdx = block.lastIndexOf('"stop_reason":"end_turn"');
    if (endTurnIdx === -1) { return null; }

    const usageStart = block.indexOf('"usage":{', endTurnIdx);
    if (usageStart === -1) { return null; }

    const usageEnd = block.indexOf('}', usageStart);
    if (usageEnd === -1) { return null; }

    const usageStr = block.substring(usageStart, usageEnd + 1);
    const get = (field: string) => {
        const m = usageStr.match(new RegExp(`"${field}":(\\d+)`));
        return m ? parseInt(m[1], 10) : 0;
    };

    const input         = get('input_tokens');
    const output        = get('output_tokens');
    const cacheCreation = get('cache_creation_input_tokens');
    const cacheRead     = get('cache_read_input_tokens');
    return (input + output + cacheCreation + cacheRead) > 0
        ? { input, output, cacheCreation, cacheRead }
        : null;
}

function extractGptTokens(block: string): TokenCounts | null {
    const usageIdx = block.lastIndexOf('"usage":{"prompt_tokens"');
    if (usageIdx === -1) { return null; }

    const usageEnd = block.indexOf('}', usageIdx);
    if (usageEnd === -1) { return null; }

    const usageStr = block.substring(usageIdx, usageEnd + 1);
    const get = (field: string) => {
        const m = usageStr.match(new RegExp(`"${field}":(\\d+)`));
        return m ? parseInt(m[1], 10) : 0;
    };

    const input  = get('prompt_tokens');
    const output = get('completion_tokens');
    return (input + output) > 0
        ? { input, output, cacheCreation: 0, cacheRead: 0 }
        : null;
}

// Copilot logs write timestamps in local time without timezone info.
// Parsing with 'Z' would treat them as UTC, shifting them by the user's UTC offset.
// Instead, use the Date constructor with local time components → correct UTC ms.
function parseLocalTimestamp(dateStr: string): number {
    const [date, time] = dateStr.split(' ');
    const [y, mo, d] = date.split('-').map(Number);
    const [hh, mm, ssms] = time.split(':');
    const [ss, ms = '0'] = ssms.split('.');
    return new Date(y, mo - 1, d, +hh, +mm, +ss, +ms).getTime();
}
