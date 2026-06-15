/****************************************************************
 *                       DELETECALL.TS                          *
 *  COMMAND: ecode.deleteCall — REMOVES A SINGLE LOG ENTRY      *
 *  FROM THE BUDGET STORE AND THE SIDEBAR TREE VIEW.            *
 *  TRIGGERED VIA THE INLINE TRASH ICON ON EACH TREE ITEM.      *
 ****************************************************************/

import * as vscode from 'vscode';
import { CarbonDashboardPanel } from '../dashboard/dashboard';
import { extensionState } from '../extensionState';
import { CallTreeItem } from '../ui/treeView';
import { logger } from '../utils/logger';

export function registerDeleteCall(): vscode.Disposable {
    return vscode.commands.registerCommand('ecode.deleteCall', async (item: CallTreeItem) => {
        if (!(item instanceof CallTreeItem)) { return; }

        logger.debug(`Deleting call at DateTime ${item.callDateTime}`);
        await extensionState.budg!.removeCallByDateTime(item.callDateTime);
        extensionState.tree!.removeItem(item.callDateTime);
        CarbonDashboardPanel.sendData();
    });
}
