import * as vscode from 'vscode';
import { getLogs } from '../callManager';

export function registerRefreshLogs(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('ecode.refreshLogs', async () => {
        getLogs(context);
    });
}
