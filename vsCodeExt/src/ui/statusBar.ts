/****************************************************************
 *                        STATUSBAR.TS                          *
 *  MANAGES THE STATUS BAR ITEM SHOWING THE LATEST CALL COST.  *
 *  COLOUR DRIVEN BY PERCENTILE CATEGORY (green/amber/red)     *
 ****************************************************************/

import * as vscode from 'vscode';

export class statusBarManager {
    mainItem = vscode.window.createStatusBarItem();

    constructor() {
        this.mainItem.text = 'Last Request: 0 g CO₂e';
        this.mainItem.show();
    }

    updateBar(input: number, category: 'neutral' | 'green' | 'amber' | 'red' = 'neutral') {
        this.mainItem.text = input > 0
            ? 'Last Request: ' + input.toFixed(4) + ' g CO₂e'
            : 'Last Request: 0 g CO₂e';

        // VSCode status bar has no built-in green background:
        // green/neutral = default (no highlight), amber = warning, red = error
        switch (category) {
            case 'red':
                this.mainItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
            case 'amber':
                this.mainItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                break;
            default:
                this.mainItem.backgroundColor = undefined;
                break;
        }
    }
}
