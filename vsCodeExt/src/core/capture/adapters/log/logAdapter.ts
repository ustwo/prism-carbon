/****************************************************************
 *                       LOGADAPTER.TS                          *
 *  GENERIC LOG-BASED CAPTURE MECHANISM. ITERATES ALL           *
 *  REGISTERED LOG PROVIDERS, READS THEIR LOG FILES AND         *
 *  RECORDS NEW CALLS. ADDING A NEW LOG-BASED TOOL = ADDING A   *
 *  PROVIDER TO providers/index.ts. THIS FILE NEVER CHANGES.    *
 ****************************************************************/

import * as fs from 'fs';
import * as vscode from 'vscode';
import { ALL_LOG_PROVIDERS } from './providers/index';
import { updateTree } from '../../../callManager';
import { logger } from '../../../../utils/logger';

// Per-provider last-access timestamps to avoid re-processing old entries
const lastAccess = new Map<string, number>();

export async function captureFromLogs(context: vscode.ExtensionContext): Promise<void> {
    for (const provider of ALL_LOG_PROVIDERS) {
        const logPath = provider.getLogPath(context);
        if (!logPath) { continue; }

        try {
            const content = fs.readFileSync(logPath, 'utf-8');
            const after = lastAccess.get(provider.id) ?? 0;
            const calls = provider.parseLogs(content, after);

            for (const call of calls) {
                updateTree({ ...call, Source: `Log · ${provider.displayName}` });
            }

            if (calls.length > 0) {
                lastAccess.set(provider.id, Math.max(...calls.map(c => c.DateTime)));
                logger.debug(`[${provider.displayName}] ${calls.length} new call(s) captured from log`);
            }
        } catch {
            // Log file not available for this provider — skip silently
        }
    }
}

export function resetLogAccess(): void {
    lastAccess.clear();
}
