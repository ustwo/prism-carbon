/****************************************************************
 *                       SAVELISTENER.TS                        *
 *   TRIGGERS A COPILOT LOG READ WHENEVER A FILE IS SAVED.      *
 ****************************************************************/

import * as vscode from 'vscode';
import { captureCopilotLogs } from '../core/capture/copilotLogCapture';
import { logger } from '../utils/logger';

export function registerSaveListener(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.workspace.onDidSaveTextDocument((doc) => {
        logger.debug(`File saved — refreshing Copilot logs (${doc.fileName.split('/').pop()})`);
        captureCopilotLogs(context);
    });
}
