/****************************************************************
 *                       SAVELISTENER.TS                        *
 *   TRIGGERS A COPILOT LOG REFRESH WHENEVER A FILE IS SAVED,  *
 *          KEEPING THE SIDEBAR CALL HISTORY UP TO DATE         *
 ****************************************************************/

import * as vscode from 'vscode';
import { getLogs } from '../core/callManager';
import { logger } from '../utils/logger';

export function registerSaveListener(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.workspace.onDidSaveTextDocument((doc) => {
        logger.debug(`File saved — refreshing logs (${doc.fileName.split('/').pop()})`);
        getLogs(context);
    });
}
