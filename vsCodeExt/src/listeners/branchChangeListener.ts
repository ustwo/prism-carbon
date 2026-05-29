/****************************************************************
 *                   BRANCHCHANGELISTENER.TS                    *
 *  DETECTS WORKSPACE FOLDER CHANGES AND REFRESHES THE DASHBOARD*
 *             WHEN THE ACTIVE GIT BRANCH CHANGES               *
 ****************************************************************/

import * as childProcess from 'child_process';
import * as vscode from 'vscode';
import { CarbonDashboardPanel } from '../ui/dashboard';
import { extensionState } from '../extensionState';
import { logger } from '../utils/logger';

export function registerBranchChangeListener(): vscode.Disposable {
    let lastKnownBranch = '';

    return vscode.workspace.onDidChangeWorkspaceFolders(() => {
        try {
            const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!cwd) { return; }
            const currentBranch = childProcess.execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf8' }).trim();
            if (currentBranch !== lastKnownBranch) {
                logger.info(`Branch changed: ${lastKnownBranch} → ${currentBranch}`);
                lastKnownBranch = currentBranch;
                CarbonDashboardPanel.sendData(extensionState.budg!);
            }
        } catch { logger.debug('Branch detection failed — workspace may not be a git repo'); }
    });
}
