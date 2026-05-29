/****************************************************************
 *                       CLEARSTORE.TS                          *
 *  COMMAND: ecode.clearStore — RESETS ALL STORED CARBON DATA,  *
 *           CLEARS THE TREE VIEW AND REFRESHES THE DASHBOARD   *
 ****************************************************************/

import * as vscode from 'vscode';
import { CarbonDashboardPanel } from '../dashboard';
import { extensionState } from '../extensionState';

export function registerClearStore(): vscode.Disposable {
    return vscode.commands.registerCommand('ecode.clearStore', async () => {
        await extensionState.budg!.resetBudget();
        extensionState.tree!.clearTree();
        extensionState.bar!.updateBar(0);
        CarbonDashboardPanel.sendData(extensionState.budg!);
    });
}
