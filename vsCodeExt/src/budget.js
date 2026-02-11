"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetBudget = resetBudget;
exports.initStorage = initStorage;
exports.updateLimit = updateLimit;
exports.storeCall = storeCall;
exports.getCalls = getCalls;
var calls = [];
var storeKey = "storeKey";
var callStore;
let dateTime = new Date();
async function resetBudget() {
    await callStore.update(storeKey, undefined);
}
function initStorage(memento) {
    callStore = memento;
}
function updateLimit() {
    calls = callStore.get(storeKey, []) || [];
    var emissions = getEmissionsFromCalls(calls);
    emissions.sort((a, b) => a - b);
    console.log(emissions);
    var mid = emissions.length / 2;
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
function storeCall(newCall) {
    calls = callStore.get(storeKey, []) || [];
    calls.push(newCall);
    callStore.update(storeKey, calls);
}
function getCalls() {
    calls = callStore.get(storeKey, []) || [];
    return calls;
}
function getEmissionsFromCalls(pCalls) {
    var ems = [];
    for (let i = 0; i < pCalls.length; i++) {
        ems.push(pCalls[i].Emissions);
    }
    return ems;
}
//# sourceMappingURL=budget.js.map