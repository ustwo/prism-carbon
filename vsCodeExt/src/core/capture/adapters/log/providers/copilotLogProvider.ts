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
import { LogProvider } from '../logProvider';

const LOOKBACK_CHARS = 20_000;

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
            const timestamp = new Date(dateStr + 'Z').getTime();

            if (timestamp <= afterTimestamp) { continue; }

            const model = rawModel.split('->')[0].trim();

            const lookbackStart = Math.max(0, match.index - LOOKBACK_CHARS);
            const block = content.substring(lookbackStart, match.index);

            const tokens = extractTokens(block, model);
            if (tokens === null) { continue; }

            const emissions = Number(calculateEmission(model, tokens).toFixed(4));
            calls.push({ Model: model, Emissions: emissions, DateTime: timestamp });
        }

        return calls;
    },
};

function extractTokens(block: string, model: string): number | null {
    return model.startsWith('claude')
        ? extractClaudeTokens(block)
        : extractGptTokens(block);
}

function extractClaudeTokens(block: string): number | null {
    const endTurnIdx = block.lastIndexOf('"stop_reason":"end_turn"');
    if (endTurnIdx === -1) { return null; }

    const usageStart = block.indexOf('"usage":{', endTurnIdx);
    if (usageStart === -1) { return null; }

    const usageEnd = block.indexOf('}', usageStart);
    if (usageEnd === -1) { return null; }

    return sumTokenFields(block.substring(usageStart, usageEnd + 1), [
        'input_tokens',
        'output_tokens',
        'cache_creation_input_tokens',
        'cache_read_input_tokens',
    ]);
}

function extractGptTokens(block: string): number | null {
    const usageIdx = block.lastIndexOf('"usage":{"prompt_tokens"');
    if (usageIdx === -1) { return null; }

    const usageEnd = block.indexOf('}', usageIdx);
    if (usageEnd === -1) { return null; }

    return sumTokenFields(block.substring(usageIdx, usageEnd + 1), [
        'prompt_tokens',
        'completion_tokens',
    ]);
}

function sumTokenFields(usageStr: string, fields: string[]): number | null {
    let total = 0;
    for (const field of fields) {
        const m = usageStr.match(new RegExp(`"${field}":(\\d+)`));
        if (m) { total += parseInt(m[1], 10); }
    }
    return total > 0 ? total : null;
}
