/****************************************************************
 *                      COMMANDS/INDEX.TS                       *
 *   ENTRY POINT FOR ALL COMMANDS. COLLECTS AND RETURNS EVERY   *
 *            DISPOSABLE FOR REGISTRATION IN EXTENSION.TS        *
 ****************************************************************/

import * as vscode from 'vscode';
import { registerClearStore } from './clearStore';
import { registerOpenDashboard } from './openDashboard';
import { registerRefreshLogs } from './refreshLogs';
import { registerInputDisplay } from './inputDisplay';
import { registerInterceptorCommands } from './interceptor';
import { registerMenu } from './menu';

export function registerAllCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
    const interceptorDisposables = registerInterceptorCommands(context.globalStorageUri.fsPath);

    return [
        registerClearStore(),
        registerOpenDashboard(context.extensionUri),
        registerRefreshLogs(context),
        registerInputDisplay(),
        ...interceptorDisposables,
        registerMenu(),
    ];
}
