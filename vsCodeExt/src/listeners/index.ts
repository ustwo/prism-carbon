/****************************************************************
 *                      LISTENERS/INDEX.TS                      *
 *   ENTRY POINT FOR ALL EVENT LISTENERS. REGISTERS SAVE,       *
 *         BRANCH-CHANGE LISTENERS AND THE LAUNCH BUTTON         *
 ****************************************************************/

import * as vscode from 'vscode';
import { registerSaveListener } from './saveListener';
import { registerBranchChangeListener } from './branchChangeListener';
import { createLaunchButton } from './launchButton';

export function registerAllListeners(context: vscode.ExtensionContext): vscode.Disposable[] {
    return [
        registerSaveListener(context),
        registerBranchChangeListener(),
        createLaunchButton(),
    ];
}
