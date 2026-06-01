/****************************************************************
 *                      LISTENERS/INDEX.TS                      *
 *  ENTRY POINT FOR ALL EVENT LISTENERS. REGISTERS              *
 *  BRANCH-CHANGE LISTENER AND THE LAUNCH BUTTON.               *
 ****************************************************************/

import * as vscode from 'vscode';
import { registerBranchChangeListener } from './branchChangeListener';
import { createLaunchButton } from './launchButton';

export function registerAllListeners(context: vscode.ExtensionContext): vscode.Disposable[] {
    return [
        registerBranchChangeListener(),
        createLaunchButton(),
    ];
}
