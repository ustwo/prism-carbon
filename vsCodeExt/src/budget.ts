import { Memento } from "vscode";

export interface Call {
    //File: string;
    Model: string;
    DateTime: string;
    //InputTokens: number;
    //OutputTokens: number;
    //TotalTokens: number;
    Emissions: number;
}

var calls: Call[] = [];
var storeKey: string = "storeKey";
var callStore: Memento;
let dateTime = new Date();


export async function resetBudget(): Promise<void> {
    await callStore.update(storeKey, undefined);
}

export function initStorage(memento: Memento) {
    callStore = memento;
}

export function updateLimit(): number { // returns the median average of emissions from calls made thus far
    calls = callStore.get<Call[]>(storeKey, []) || [];
    var emissions: number[] = getEmissionsFromCalls(calls);
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

export function storeCall(newCall: Call): void {
    calls = callStore.get<Call[]>(storeKey, []) || [];
    calls.push(newCall);
    callStore.update(storeKey, calls);
}

export function getCalls(): Call[] {
    calls = callStore.get<Call[]>(storeKey, []) || [];
    return calls;
}

function getEmissionsFromCalls(pCalls: Call[]): number[] {
    var ems: number[] = [];
    for (let i = 0; i < pCalls.length; i++) {
        ems.push(pCalls[i].Emissions);
    }
    return ems;
}







