/****************************************************************
 *                       LAUNCHBUTTON.TS                        *
 *  CREATES THE "ESTIMATING CARBON" STATUS BAR BUTTON THAT      *
 *          OPENS THE QUICK-PICK COMMAND MENU (ecode.menu)       *
 ****************************************************************/

import * as vscode from 'vscode';

export function createLaunchButton(): vscode.StatusBarItem {
    const button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    button.text = '$(list-unordered) PRISM';
    button.tooltip = 'Click to see AI Analysis Options';
    button.command = 'ecode.menu';
    button.show();
    return button;
}
