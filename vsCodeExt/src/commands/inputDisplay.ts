import * as vscode from 'vscode';
import { Call } from '../core/budget';
import { updateTree } from '../core/callManager';
import { logger } from '../utils/logger';

export function registerInputDisplay(): vscode.Disposable {
    return vscode.commands.registerCommand('ecode.inputdisplay', async () => {
        const limit = await vscode.window.showInputBox({
            prompt: 'Enter test call: ',
            placeHolder: 'eg. 5',
            ignoreFocusOut: true,
        });

        const num = Number(limit);
        if (!Number.isNaN(num)) {
            const bumpedTime = new Date().getTime() + 5 * 60 * 60 * 1000;
            const newCall: Call = { Emissions: num, Model: 'TEST', DateTime: bumpedTime };
            logger.debug(`Test call injected — emissions: ${num}g CO₂e`);
            updateTree(newCall);
            vscode.window.showInformationMessage(`Added ${num}g CO2e for today.`);
        } else {
            logger.warn(`Invalid test input received: "${limit}"`);
            vscode.window.showInformationMessage('Error: NaN inputted.');
        }
    });
}
