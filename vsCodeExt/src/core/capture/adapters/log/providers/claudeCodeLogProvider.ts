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
            const paths: string[] = [];

            for (const entry of fs.readdirSync(projectDir)) {
                const fullPath = path.join(projectDir, entry);
                const stat = fs.statSync(fullPath);

                if (!stat.isDirectory() && entry.endsWith('.jsonl')) {
                    // Root-level session JSONL (main conversation)
                    paths.push(fullPath);
                } else if (stat.isDirectory()) {
                    // Session subdirectory — also read subagent JSONLs.
                    // Claude Code spawns sub-agents (e.g. via the Agent tool) using
                    // lighter models (Haiku) even when the main model is Sonnet.
                    // Those calls have real emissions and should be tracked.
                    const subagentsDir = path.join(fullPath, 'subagents');
                    if (fs.existsSync(subagentsDir)) {
                        for (const sub of fs.readdirSync(subagentsDir)) {
                            if (sub.endsWith('.jsonl')) {
                                paths.push(path.join(subagentsDir, sub));
                            }
                        }
                    }
                }
            }

            return paths;
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
