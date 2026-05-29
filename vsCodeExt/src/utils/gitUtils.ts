/****************************************************************
 *                         GITUTILS.TS                          *
 *     UTILITY FOR READING THE CURRENT GIT BRANCH FROM THE     *
 *                    ACTIVE WORKSPACE FOLDER                   *
 ****************************************************************/

import * as childProcess from 'child_process';
import * as vscode from 'vscode';

export function getCurrentBranch(): string {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return 'Unknown Branch';
        }
        const cwd = workspaceFolders[0].uri.fsPath;
        const branch = childProcess.execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf8' }).trim();
        return branch || 'Unknown Branch';
    } catch (error) {
        console.error('Error getting git branch:', error);
        return 'Unknown Branch';
    }
}
