/****************************************************************
 *                        STATUSBAR.TS                          *
 *  MANAGES THE STATUS BAR ITEM SHOWING THE LATEST CALL COST.  *
 *  COLOUR DRIVEN BY PERCENTILE CATEGORY (green/amber/red)     *
 ****************************************************************/

import * as vscode from 'vscode';

function getColorConfig() {
    const cfg = vscode.workspace.getConfiguration();
    return {
        neutral: cfg.get<string>('estimatingCarbon.colorNeutral', '#888888'),
        green:   cfg.get<string>('estimatingCarbon.colorGreen',   '#89d185'),
        amber:   cfg.get<string>('estimatingCarbon.colorAmber',   '#e2c08d'),
        red:     cfg.get<string>('estimatingCarbon.colorRed',     '#f14c4c'),
    };
}

export class statusBarManager {
    mainItem = vscode.window.createStatusBarItem();

    private _lastInput    = 0;
    private _lastCategory: 'neutral' | 'green' | 'amber' | 'red' = 'neutral';

    constructor() {
        this.mainItem.text = 'Last Request: 0 g CO₂e';
        this.mainItem.show();
    }

    updateBar(input: number, category: 'neutral' | 'green' | 'amber' | 'red' = 'neutral') {
        this._lastInput    = input;
        this._lastCategory = category;

        this.mainItem.text = input > 0
            ? 'Last Request: ' + input.toFixed(4) + ' g CO₂e'
            : 'Last Request: 0 g CO₂e';

        const colors = getColorConfig();
        this.mainItem.color           = category !== 'neutral' ? colors[category] : undefined;
        this.mainItem.backgroundColor = undefined;
    }

    refresh() {
        this.updateBar(this._lastInput, this._lastCategory);
    }
}
