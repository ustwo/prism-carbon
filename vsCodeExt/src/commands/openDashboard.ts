import * as vscode from 'vscode';
import { CarbonDashboardPanel } from '../dashboard';
import { extensionState } from '../extensionState';

export function registerOpenDashboard(extensionUri: vscode.Uri): vscode.Disposable {
    return vscode.commands.registerCommand('ecode.openDashboard', () => {
        CarbonDashboardPanel.createOrShow(extensionUri, extensionState.budg!);
        console.log('Carbon Dashboard command registered.');
    });
}
