import { Memento } from "vscode";

export interface Call {
    //File: string;
    Model: string;
    DateTime: number;
    //InputTokens: number;
    //OutputTokens: number;
    //TotalTokens: number;
    Emissions: number;
    Branch?: string;
}

var callStore: Memento;
let dateTime = new Date();

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
        console.log(emissions);
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
    }
    getCalls(): Call[] {
        this.calls = this.callStore.get<Call[]>(this.storeKey, []) || [];
        return this.calls;
    }

    getEmissionsFromCalls(pCalls: Call[]): number[] {
        var ems: number[] = [];
        for (let i = 0; i < pCalls.length; i++) {
            ems.push(pCalls[i].Emissions);
        }
        return ems;
    }

}






