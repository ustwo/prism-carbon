/****************************************************************
 *                       SAVELISTENER.TS                        *
 *   TRIGGERS A COPILOT LOG REFRESH WHENEVER A FILE IS SAVED,  *
 *          KEEPING THE SIDEBAR CALL HISTORY UP TO DATE         *
 ****************************************************************/

import * as vscode from 'vscode';
import { getLogs } from '../callManager';

export function registerSaveListener(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.workspace.onDidSaveTextDocument(() => {
        console.log('Updating logs..........');
        getLogs(context);
    });
}
