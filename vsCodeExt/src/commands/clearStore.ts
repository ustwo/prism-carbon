/****************************************************************
 *                       CLEARSTORE.TS                          *
 *  COMMAND: ecode.clearStore — RESETS ALL STORED CARBON DATA,  *
 *           CLEARS THE TREE VIEW AND REFRESHES THE DASHBOARD   *
 ****************************************************************/

import * as vscode from 'vscode';
import { CarbonDashboardPanel } from '../ui/dashboard';
import { extensionState } from '../extensionState';
import { logger } from '../utils/logger';

export function registerClearStore(): vscode.Disposable {
    return vscode.commands.registerCommand('ecode.clearStore', async () => {
        logger.info('User triggered store reset');
        await extensionState.budg!.resetBudget();
        extensionState.tree!.clearTree();
        extensionState.bar!.updateBar(0);
        CarbonDashboardPanel.sendData(extensionState.budg!);
    });
}
