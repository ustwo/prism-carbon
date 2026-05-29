/****************************************************************
 *                   BRANCHCHANGELISTENER.TS                    *
 *  DETECTS WORKSPACE FOLDER CHANGES AND REFRESHES THE DASHBOARD*
 *             WHEN THE ACTIVE GIT BRANCH CHANGES               *
 ****************************************************************/

import * as childProcess from 'child_process';
import * as vscode from 'vscode';
import { CarbonDashboardPanel } from '../dashboard';
import { shared } from '../extensionState';

export function registerBranchChangeListener(): vscode.Disposable {
    let lastKnownBranch = '';

    return vscode.workspace.onDidChangeWorkspaceFolders(() => {
        try {
            const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!cwd) { return; }
            const currentBranch = childProcess.execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf8' }).trim();
            if (currentBranch !== lastKnownBranch) {
                lastKnownBranch = currentBranch;
                CarbonDashboardPanel.sendData(shared.budg!);
            }
        } catch { /* branch detection failed, skip */ }
    });
}
