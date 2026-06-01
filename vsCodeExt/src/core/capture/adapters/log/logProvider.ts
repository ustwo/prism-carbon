/****************************************************************
 *                       LOGPROVIDER.TS                         *
 *  INTERFACE FOR LOG-BASED LLM CAPTURE PROVIDERS.             *
 *  EACH PROVIDER KNOWS WHERE ITS LOG FILE LIVES AND HOW TO    *
 *  PARSE IT. THE LOGADAPTER IS THE GENERIC MECHANISM —        *
 *  PROVIDERS ARE PLUGGED IN TO SUPPORT NEW TOOLS.             *
 ****************************************************************/

import * as vscode from 'vscode';
import { Call } from '../../../budget';

export interface LogProvider {
    readonly id: string;
    readonly displayName: string;
    getLogPath(context: vscode.ExtensionContext): string | null;
    parseLogs(content: string, afterTimestamp: number): Call[];
}
