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
import { normalizeModel } from '../utils/callId';

// Fallback window when callId is absent (e.g. interceptor captures).
// Covers response streaming time: JSONL records stream-start, Copilot log
// records stream-end — gap equals response generation time (up to ~60 s).
const DEDUPE_WINDOW_MS = 60_000;

function isDuplicateCall(call: budget.Call, recentCalls: budget.Call[]): boolean {
    // Primary: exact content fingerprint — zero false positives
    if (call.callId) {
        if (recentCalls.some(c => c.callId && c.callId === call.callId)) {
            return true;
        }
    }

    // Fallback: normalised model + identical emissions + time window
    // (covers interceptor captures that lack a callId)
    const norm = normalizeModel(call.Model);
    return recentCalls.some(
        c => normalizeModel(c.Model) === norm
          && c.Emissions === call.Emissions
          && Math.abs(c.DateTime - call.DateTime) <= DEDUPE_WINDOW_MS
    );
}

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

    // Deduplicate cross-provider captures of the same underlying API call.
    // Check only the last 50 calls to stay O(1) in practice.
    const recentCalls = extensionState.budg!.getCalls().slice(-50);
    if (isDuplicateCall(call, recentCalls)) {
        logger.debug(`Duplicate skipped: ${call.Model} @ ${new Date(call.DateTime).toISOString()} [${call.Source}]`);
        return;
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
