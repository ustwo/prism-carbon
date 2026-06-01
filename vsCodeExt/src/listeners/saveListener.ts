/****************************************************************
 *                       SAVELISTENER.TS                        *
 *   TRIGGERS A COPILOT LOG READ WHENEVER A FILE IS SAVED.      *
 ****************************************************************/

import * as vscode from 'vscode';
import { captureFromLogs } from '../core/capture/adapters/log/logAdapter';
import { logger } from '../utils/logger';

export function registerSaveListener(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.workspace.onDidSaveTextDocument((doc) => {
        logger.debug(`File saved — refreshing Copilot logs (${doc.fileName.split('/').pop()})`);
        captureFromLogs(context);
    });
}
