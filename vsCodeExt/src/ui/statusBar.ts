/****************************************************************
 *                        STATUSBAR.TS                          *
 *  MANAGES THE STATUS BAR ITEM SHOWING THE LATEST CALL COST.  *
 *    COLOUR-CODES THE INDICATOR BASED ON EMISSION THRESHOLDS   *
 ****************************************************************/

import * as vscode from 'vscode';

export class statusBarManager {
    mainItem = vscode.window.createStatusBarItem();
    private newColour: string;

    constructor() {
        this.newColour = 'statusBarItem.activeBackground';
        this.mainItem.text = 'Last Request: 0 g CO₂e';
        this.mainItem.show();
    }

    updateLimit(_input: number) {
        this.mainItem.text = 'Last Request: 0 g CO₂e';
        this.newColour = 'statusBarItem.background';
    }

    updateBar(input: number) {
        if (input !== undefined) {
            this.mainItem.text = 'Last Request: ' + input.toFixed(4) + ' g CO₂e';

            if (input >= 40) {
                this.newColour = 'statusBarItem.errorBackground';
            } else if (input >= 15) {
                this.newColour = 'statusBarItem.warningBackground';
            } else if (input > 0) {
                this.newColour = 'statusBarItem.background';
            } else {
                this.newColour = 'statusBarItem.activeBackground';
            }
        } else {
            this.newColour = 'statusBarItem.activeBackground';
            this.mainItem.text = 'Last Request: 0 g CO₂e';
        }

        this.mainItem.backgroundColor = new vscode.ThemeColor(this.newColour);
    }
}
