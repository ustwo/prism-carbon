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
    const windowStart = budg.getBudgetWindowStart();
    const allCalls = budg.getCalls();

    const toItem = (c: budget.Call) => ({
        label: `[${c.Source ?? 'Log'}] ${c.Model} — ${c.Emissions}g CO₂e — ${new Date(c.DateTime).toLocaleString()}`,
        dateTime: c.DateTime,
    });

    const current  = allCalls.filter(c => c.DateTime >= windowStart).map(toItem);
    const archived = allCalls.filter(c => c.DateTime <  windowStart).map(toItem);

    logger.info(`Restoring ${current.length} current, ${archived.length} archived call(s)`);
    extensionState.tree!.restore(current, archived);
}

export function updateTree(call: budget.Call) {
    if (!call.Branch) {
        call.Branch = getCurrentBranch();
    }
    extensionState.budg!.storeCall(call);

    const source = call.Source ?? 'Log';
    logger.debug(`[${source}] model: ${call.Model}, emissions: ${call.Emissions}g CO₂e, branch: ${call.Branch}`);

    const windowStart = extensionState.budg!.getBudgetWindowStart();
    if (call.DateTime >= windowStart) {
        extensionState.tree!.addMessage(
            `[${source}] ${call.Model} — ${call.Emissions}g CO₂e — ${new Date(call.DateTime).toLocaleString()}`,
            call.DateTime
        );
        extensionState.bar!.updateBar(call.Emissions);
    }
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
