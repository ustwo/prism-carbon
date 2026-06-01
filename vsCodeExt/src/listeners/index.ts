/****************************************************************
 *                      LISTENERS/INDEX.TS                      *
 *  ENTRY POINT FOR ALL EVENT LISTENERS.                        *
 *  - Branch change → refreshes dashboard                       *
 *  - Save / interval → reads Copilot Chat logs                 *
 *  - Launch button → status bar shortcut                       *
 ****************************************************************/

import * as vscode from 'vscode';
import { registerBranchChangeListener } from './branchChangeListener';
import { createLaunchButton } from './launchButton';
import { registerSaveListener } from './saveListener';
import { registerLogRefreshListener } from './logRefreshListener';

export function registerAllListeners(context: vscode.ExtensionContext): vscode.Disposable[] {
    return [
        registerBranchChangeListener(),
        createLaunchButton(),
        registerSaveListener(context),
        ...registerLogRefreshListener(context),
    ];
}
