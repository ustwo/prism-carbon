/****************************************************************
 *                       PURGESTORE.TS                          *
 *  COMMAND: ecode.purgeStore — PERMANENTLY DELETES ALL STORED  *
 *  CALL HISTORY FROM THE MEMENTO. ALSO RESETS THE BUDGET       *
 *  WINDOW SO THE DASHBOARD STARTS CLEAN.                       *
 ****************************************************************/

import * as vscode from 'vscode';
import { CarbonDashboardPanel } from '../dashboard/dashboard';
import { BudgetMiniViewProvider } from '../ui/budgetMiniView';
import { extensionState } from '../extensionState';
import { setLogAccessAfterReset } from '../core/capture/adapters/log/logAdapter';
import { logger } from '../utils/logger';

export function registerPurgeStore(): vscode.Disposable {
    return vscode.commands.registerCommand('ecode.purgeStore', async () => {
        const selection = await vscode.window.showWarningMessage(
            'This will permanently delete all stored log history. This cannot be undone.',
            { modal: true },
            'Yes, Purge All'
        );
        if (selection !== 'Yes, Purge All') { return; }

        logger.info('User triggered full log purge');
        await extensionState.budg!.purgeCalls();
        await extensionState.budg!.resetBudget();
        setLogAccessAfterReset(extensionState.budg!.getBudgetWindowStart());
        extensionState.tree!.clearTree();
        extensionState.bar!.updateBar(0);
        CarbonDashboardPanel.sendData();
        BudgetMiniViewProvider.update(extensionState.budg!);
    });
}
