/****************************************************************
 *                       LOGPROVIDER.TS                         *
 *  INTERFACE FOR LOG-BASED LLM CAPTURE PROVIDERS.             *
 *  EACH PROVIDER KNOWS WHERE ITS LOG FILES LIVE AND HOW TO    *
 *  PARSE THEM. THE LOGADAPTER IS THE GENERIC MECHANISM —      *
 *  PROVIDERS ARE PLUGGED IN TO SUPPORT NEW TOOLS.             *
 ****************************************************************/

import * as vscode from 'vscode';
import { Call } from '../../../budget';

export interface LogProvider {
    readonly id: string;
    readonly displayName: string;
    // Returns one or more log file paths. Multiple files are needed when a
    // tool creates one file per session (e.g. Claude Code JSONL files).
    getLogPaths(context: vscode.ExtensionContext): string[];
    parseLogs(content: string, afterTimestamp: number): Call[];
    // Returns a human-readable source label for a specific log file path.
    // Lets providers differentiate sub-types (e.g. main session vs subagent).
    // Providers with a single file type can just return their displayName.
    getSourceForPath(logPath: string): string;
}
