/****************************************************************
 *                  CLAUDECODELOGPROVIDER.TS                    *
 *  LOG PROVIDER FOR CLAUDE CODE VSCODE EXTENSION.             *
 *  READS ~/.claude/projects/<workspace>/*.jsonl FILES —        *
 *  ONE FILE PER SESSION — EXTRACTS ASSISTANT MESSAGES WITH     *
 *  EXACT TOKEN COUNTS FROM THE USAGE FIELD.                    *
 ****************************************************************/

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { calculateEmission } from '../../../../convert';
import { Call } from '../../../../budget';
import { makeCallId } from '../../../../../utils/callId';
import { LogProvider } from '../logProvider';

export const claudeCodeLogProvider: LogProvider = {
    id: 'claude-code',
    displayName: 'Claude Code',

    getLogPaths(context: vscode.ExtensionContext): string[] {
        const projectDir = getClaudeProjectDir();
        if (!projectDir || !fs.existsSync(projectDir)) { return []; }

        try {
            return fs.readdirSync(projectDir)
                .filter(f => f.endsWith('.jsonl') && !fs.statSync(path.join(projectDir, f)).isDirectory())
                .map(f => path.join(projectDir, f));
        } catch {
            return [];
        }
    },

    parseLogs(content: string, afterTimestamp: number): Call[] {
        const calls: Call[] = [];

        for (const line of content.split('\n')) {
            if (!line.trim()) { continue; }

            try {
                const entry = JSON.parse(line);

                if (entry.type !== 'assistant') { continue; }

                const timestamp = new Date(entry.timestamp).getTime();
                if (timestamp <= afterTimestamp) { continue; }

                const msg = entry.message;
                if (!msg?.model || !msg?.usage) { continue; }

                const input         = msg.usage.input_tokens                  ?? 0;
                const output        = msg.usage.output_tokens                 ?? 0;
                const cacheCreation = msg.usage.cache_creation_input_tokens   ?? 0;
                const cacheRead     = msg.usage.cache_read_input_tokens       ?? 0;
                const totalTokens   = input + output + cacheCreation + cacheRead;

                if (totalTokens === 0) { continue; }

                const emissions = Number(calculateEmission(msg.model, totalTokens).toFixed(4));
                const callId    = makeCallId(msg.model, input, output, cacheCreation, cacheRead);
                calls.push({ Model: msg.model, Emissions: emissions, DateTime: timestamp, callId });
            } catch {
                // Malformed line — skip
            }
        }

        return calls;
    },
};

function getClaudeProjectDir(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) { return null; }

    // ~/.claude/projects/ uses the workspace path with / replaced by -
    const workspacePath = workspaceFolders[0].uri.fsPath;
    const projectFolder = workspacePath.replace(/\//g, '-');
    return path.join(os.homedir(), '.claude', 'projects', projectFolder);
}
