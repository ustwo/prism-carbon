/****************************************************************
 *                       CLEARSTORE.TS                          *
 *  COMMAND: ecode.clearStore — RESETS ALL STORED CARBON DATA,  *
 *           CLEARS THE TREE VIEW AND REFRESHES THE DASHBOARD   *
 ****************************************************************/

import * as vscode from 'vscode';
import { CarbonDashboardPanel } from '../dashboard';
import { shared } from '../extensionState';

export function registerClearStore(): vscode.Disposable {
    return vscode.commands.registerCommand('ecode.clearStore', async () => {
        await shared.budg!.resetBudget();
        shared.tree!.clearTree();
        shared.bar!.updateBar(0);
        CarbonDashboardPanel.sendData(shared.budg!);
    });
}
