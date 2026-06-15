/****************************************************************
 *                      DASHBOARDDATA.TS                        *
 *  PURE DATA-PROCESSING UTILITIES FOR THE CARBON DASHBOARD.   *
 *  NO VSCODE API, NO SIDE-EFFECTS — EASY TO UNIT-TEST.        *
 ****************************************************************/

export interface ComparisonData {
    milesDriven: number;
    hoursOfStreaming: number;
    flightDistance: number;
    phoneCharges: number;
    treeYearlyAbsorption: number;
}

export function createComparisons(totalEmissions: number): ComparisonData {
    return {
        milesDriven:           totalEmissions / 205,        // avg gCO₂e per mile (EU/UK)
        hoursOfStreaming:       0,
        flightDistance:         0,
        phoneCharges:           totalEmissions / 8.187864,  // gCO₂e per full iPhone 17 charge
        treeYearlyAbsorption:   totalEmissions / 22000,     // gCO₂ absorbed by a mature oak per year
    };
}
