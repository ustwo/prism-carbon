/****************************************************************
 *                       SELECTCALL.TS                          *
 *  COMMAND: ecode.selectCall — REVEALS AND SELECTS A SPECIFIC  *
 *  CALL IN THE SIDEBAR TREE VIEW BY ITS DATETIME VALUE.        *
 *  TRIGGERED FROM THE BUDGET MINI VIEW SPARKLINE CLICK.        *
 ****************************************************************/

import * as vscode from 'vscode';
import { extensionState } from '../extensionState';
import { logger } from '../utils/logger';

export function registerSelectCall(): vscode.Disposable {
    return vscode.commands.registerCommand('ecode.selectCall', async (dateTime: number) => {
        const item = extensionState.tree?.findByDateTime(dateTime);
        if (!item) {
            logger.debug(`selectCall: no tree item found for DateTime ${dateTime}`);
            return;
        }

        // Bring the Carbon Estimates panel into view
        await vscode.commands.executeCommand('workbench.view.extension.my-view-container');

        try {
            await extensionState.treeView?.reveal(item, { select: true, focus: false, expand: false });
        } catch (e) {
            logger.debug(`selectCall reveal failed: ${e}`);
        }
    });
}
