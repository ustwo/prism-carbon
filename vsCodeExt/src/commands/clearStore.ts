/****************************************************************
 *                       CLEARSTORE.TS                          *
 *  COMMAND: ecode.clearStore — RESETS THE BUDGET WINDOW.       *
 *  HISTORY IS PRESERVED BUT MOVED TO THE "ARCHIVED" SECTION    *
 *  IN THE SIDEBAR. THE DASHBOARD BUDGET BAR RESTARTS FROM 0.   *
 ****************************************************************/

import * as vscode from 'vscode';
import { CarbonDashboardPanel } from '../dashboard/dashboard';
import { extensionState } from '../extensionState';
import { restoreCallHistory } from '../core/callManager';
import { setLogAccessAfterReset } from '../core/capture/adapters/log/logAdapter';
import { logger } from '../utils/logger';

export function registerClearStore(): vscode.Disposable {
    return vscode.commands.registerCommand('ecode.clearStore', async () => {
        logger.info('User triggered store reset');
        await extensionState.budg!.resetBudget();
        setLogAccessAfterReset(extensionState.budg!.getBudgetWindowStart());
        // Rebuild tree: current calls = empty, archived = everything before the reset
        restoreCallHistory(extensionState.budg!);
        extensionState.bar!.updateBar(0);
        CarbonDashboardPanel.sendData();
    });
}
