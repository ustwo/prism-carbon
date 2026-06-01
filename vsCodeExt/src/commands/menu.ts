/****************************************************************
 *                           MENU.TS                            *
 *  COMMAND: ecode.menu — SHOWS A QUICK-PICK WITH ALL AVAILABLE *
 *                 ESTIMATING CARBON ACTIONS                     *
 ****************************************************************/

import * as vscode from 'vscode';

const MENU_ITEMS = [
    {
        label: '$(play) Reset Stored Session',
        description: 'Resets the budget window — history is preserved',
        command: 'ecode.clearStore',
    },
    {
        label: '$(trash) Purge All Logs',
        description: 'Permanently deletes all stored log history',
        command: 'ecode.purgeStore',
    },
    {
        label: '$(play) Open Dashboard',
        description: 'Displays information on Carbon emissions and usage',
        command: 'ecode.openDashboard',
    },
];

export function registerMenu(): vscode.Disposable {
    return vscode.commands.registerCommand('ecode.menu', async () => {
        const selection = await vscode.window.showQuickPick(MENU_ITEMS, {
            placeHolder: 'Select an Estimating Carbon function',
        });

        if (selection) {
            vscode.commands.executeCommand(selection.command);
        }
    });
}
