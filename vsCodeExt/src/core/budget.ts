/**********************************************
 *                 BUDGET.TS                  *
 * HANDLES CALL STORAGE AND BUDGET MANAGEMENT *
 * DEFINES A CALL INTERFACE AND BUDGET CLASS  *
 **********************************************/

import { Memento } from "vscode";
import { logger } from '../utils/logger';

export interface Call {
    Model: string;
    DateTime: number;
    Emissions: number;
    Branch?: string;
    Source?: string;  // e.g. "Copilot Log", "Proxy · Anthropic (Claude)"
}

export class budget {
    callStore: Memento;
    storeKey: string = "storeKey";
    calls: Call[] = [];


    constructor(memento: Memento) {
        this.callStore = memento;
    }
    async resetBudget(): Promise<void> {
        //Instead of wiping the entire store, we can just reset the budget and the start time for the current budget window. This way, we can maintain the call history while starting a new budget tracking period.
        await this.callStore.update("budgetWindowStart", Date.now());
        logger.info('Budget window reset');
    }

    getBudgetWindowStart(): number {
        // If no budget is set, default to 0
        return this.callStore.get<number>("budgetWindowStart",0);
    }
    getBudget(): number {
    return this.callStore.get<number>("budget", 5);
    }

    async setBudget(newBudget: number): Promise<void> {
        await this.callStore.update("budget", newBudget);
    }
    

    updateLimit(): number { // returns the median average of emissions from calls made thus far
        this.calls = this.callStore.get<Call[]>(this.storeKey, []) || [];
        var emissions: number[] = this.getEmissionsFromCalls(this.calls);
        emissions.sort((a, b) => a - b);
        logger.debug(`Emissions for median calculation: [${emissions.join(', ')}]`);
        var mid: number = emissions.length / 2;
        if (emissions.length === 0) {
            return 0;
        }
        else if (emissions.length % 2 === 0) {
            return (emissions[(mid)] + emissions[mid - 1]) / 2;
        }
        else {
            return emissions[Math.floor(mid)];
        }
    }

    storeCall(newCall: Call): void {
        this.calls = this.callStore.get<Call[]>(this.storeKey, []) || [];
        this.calls.push(newCall);
        this.callStore.update(this.storeKey, this.calls);
        logger.trace(`Call stored — total calls: ${this.calls.length}`);
    }

    getCalls(): Call[] {
        this.calls = this.callStore.get<Call[]>(this.storeKey, []) || [];
        return this.calls;
    }

    async purgeCalls(): Promise<void> {
        this.calls = [];
        await this.callStore.update(this.storeKey, []);
        logger.info('All stored calls purged');
    }

    async removeCallByDateTime(dateTime: number): Promise<void> {
        this.calls = this.callStore.get<Call[]>(this.storeKey, []) || [];
        const idx = this.calls.findIndex(c => c.DateTime === dateTime);
        if (idx !== -1) {
            this.calls.splice(idx, 1);
            await this.callStore.update(this.storeKey, this.calls);
            logger.debug(`Call at DateTime ${dateTime} removed`);
        }
    }

    getEmissionsFromCalls(pCalls: Call[]): number[] {
        var ems: number[] = [];
        for (let i = 0; i < pCalls.length; i++) {
            ems.push(pCalls[i].Emissions);
        }
        return ems;
    }

}






