/****************************************************************
 *                       CALLMANAGER.TS                         *
 *  HANDLES STORING NEW CALLS, UPDATING THE TREE VIEW AND       *
 *  STATUS BAR, AND BUDGET HELPERS                              *
 ****************************************************************/

import * as budget from './budget';
import { CarbonDashboardPanel } from '../dashboard/dashboard';
import { extensionState } from '../extensionState';
import { getCurrentBranch } from '../utils/gitUtils';
import { logger } from '../utils/logger';

export function restoreCallHistory(budg: budget.budget) {
    const pCalls = budg.getCalls();
    logger.info(`Restoring ${pCalls.length} call(s) from history`);
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

    const source = call.Source ?? 'Unknown';
    logger.debug(`[${source}] model: ${call.Model}, emissions: ${call.Emissions}g CO₂e, branch: ${call.Branch}`);
    extensionState.tree!.addMessage(
        `[${source}] ${call.Model} — ${call.Emissions}g CO₂e — ${new Date(call.DateTime).toLocaleString()}`
    );

    extensionState.bar!.updateBar(call.Emissions);
    CarbonDashboardPanel.sendData(extensionState.budg!);
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
