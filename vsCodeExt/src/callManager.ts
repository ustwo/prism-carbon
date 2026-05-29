/****************************************************************
 *                       CALLMANAGER.TS                         *
 *  HANDLES STORING NEW CALLS, READING COPILOT LOGS, UPDATING  *
 *        THE TREE VIEW AND STATUS BAR, AND BUDGET HELPERS      *
 ****************************************************************/

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as budget from './budget';
import * as logCap from './logCapture';
import { CarbonDashboardPanel } from './dashboard';
import { extensionState } from './extensionState';
import { getCurrentBranch } from './utils/gitUtils';

export function restoreCallHistory(budg: budget.budget) {
    const pCalls = budg.getCalls();
    console.log('CALLS:', pCalls);
    for (const call of pCalls) {
        extensionState.tree!.addMessage(
            `Emissions: ${call.Emissions}g CO₂e - Model: ${call.Model} - Date: ${new Date(call.DateTime).toLocaleString()}`
        );
    }
}

export function updateTree(call: budget.Call) {
    if (!call.Branch) {
        call.Branch = getCurrentBranch();
    }
    extensionState.budg!.storeCall(call);

    console.log('BACKEND CHECK: Stored call value:', call.Emissions, 'for date:', new Date(call.DateTime).toISOString());
    extensionState.tree!.addMessage(
        `Emissions: ${call.Emissions}g CO₂e - Model: ${call.Model} - Date: ${new Date(call.DateTime).toLocaleString()}`
    );

    extensionState.bar!.updateBar(call.Emissions);
    CarbonDashboardPanel.sendData(extensionState.budg!);
}

export async function getLogs(context: vscode.ExtensionContext) {
    try {
        const filePath = logCap.getLogFilePath(context);
        console.log(filePath);
        const logUri = path.join(path.dirname(filePath), 'GitHub.copilot-chat', 'GitHub Copilot Chat.log');

        const content = fs.readFileSync(logUri, 'utf-8');
        const models: budget.Call[] = await logCap.identifyModel(content);
        const sortedModels = models.sort((a, b) => a.DateTime - b.DateTime);
        console.log('CALLS: ', sortedModels);

        for (const call of sortedModels) {
            if (call.DateTime > extensionState.lastAccess) {
                console.log('updating tree');
                updateTree(call);
            }
        }

        if (sortedModels.length !== 0) {
            extensionState.lastAccess = sortedModels[sortedModels.length - 1].DateTime;
        }
    } catch (error) {
        console.log(error);
        vscode.window.showErrorMessage('Error: Copilot log files not found.');
    }
}

export function wrappedGetCall() {
    return extensionState.budg!.getCalls();
}

export function wrappedGetBudget(): number {
    return extensionState.budg!.getBudget();
}

export function wrappedGetBudgetWindowStart(): number {
    return extensionState.budg!.getBudgetWindowStart();
}

export function wrappedSetBudget(newBudget: number): void {
    extensionState.budg!.setBudget(newBudget);
}
