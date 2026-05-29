/****************************************************************
 *                           MENU.TS                            *
 *  COMMAND: ecode.menu — SHOWS A QUICK-PICK WITH ALL AVAILABLE *
 *                 ESTIMATING CARBON ACTIONS                     *
 ****************************************************************/

import * as vscode from 'vscode';

const MENU_ITEMS = [
    {
        label: '$(play) Start Runtime Analysis',
        description: 'Opens Estimating Carbon Terminal where files to be analysed are run',
        command: 'ecode.runtimeAnalysis',
    },
    {
        label: '$(play) Stop Runtime Proxy',
        description: 'Stops the recording of carbon emissions',
        command: 'ecode.interceptorStop',
    },
    {
        label: '$(play) Reset Stored Session',
        description: 'Resets the current record of carbon emissions',
        command: 'ecode.clearStore',
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
