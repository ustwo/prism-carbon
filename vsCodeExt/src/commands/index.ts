/****************************************************************
 *                      COMMANDS/INDEX.TS                       *
 *   ENTRY POINT FOR ALL COMMANDS. COLLECTS AND RETURNS EVERY   *
 *            DISPOSABLE FOR REGISTRATION IN EXTENSION.TS        *
 ****************************************************************/

import * as vscode from 'vscode';
import { registerClearStore } from './clearStore';
import { registerOpenDashboard } from './openDashboard';
import { registerInputDisplay } from './inputDisplay';
import { registerMenu } from './menu';
import { registerPurgeStore } from './purgeStore';
import { registerDeleteCall } from './deleteCall';
import { registerCopyCall } from './copyCall';

export function registerAllCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
    return [
        registerClearStore(),
        registerOpenDashboard(context.extensionUri),
        registerInputDisplay(),
        registerMenu(),
        registerPurgeStore(),
        registerDeleteCall(),
        registerCopyCall(),
    ];
}
