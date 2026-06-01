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

// Per-provider last-access timestamp to avoid re-processing old entries
const lastAccess = new Map<string, number>();

// Call this on activation with the latest timestamp already stored in the budget.
// Prevents re-processing historical log entries after a VSCode restart.
export function initializeLastAccess(latestStoredTimestamp: number): void {
    for (const provider of ALL_LOG_PROVIDERS) {
        const current = lastAccess.get(provider.id) ?? 0;
        if (latestStoredTimestamp > current) {
            lastAccess.set(provider.id, latestStoredTimestamp);
        }
    }
}

export async function captureFromLogs(context: vscode.ExtensionContext): Promise<void> {
    for (const provider of ALL_LOG_PROVIDERS) {
        const logPaths = provider.getLogPaths(context);
        const after = lastAccess.get(provider.id) ?? 0;
        let newCalls = 0;
        let latestTimestamp = after;

        for (const logPath of logPaths) {
            try {
                const content = fs.readFileSync(logPath, 'utf-8');
                const calls = provider.parseLogs(content, after);

                for (const call of calls) {
                    updateTree({ ...call, Source: `Log · ${provider.displayName}` });
                    if (call.DateTime > latestTimestamp) {
                        latestTimestamp = call.DateTime;
                    }
                }

                newCalls += calls.length;
            } catch {
                // Log file not available — skip silently
            }
        }

        if (newCalls > 0) {
            lastAccess.set(provider.id, latestTimestamp);
            logger.debug(`[${provider.displayName}] ${newCalls} new call(s) captured from logs`);
        }
    }
}

export function setLogAccessAfterReset(windowStart: number): void {
    for (const provider of ALL_LOG_PROVIDERS) {
        lastAccess.set(provider.id, windowStart);
    }
}
