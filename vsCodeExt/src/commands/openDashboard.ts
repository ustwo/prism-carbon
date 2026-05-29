import * as vscode from 'vscode';
import { CarbonDashboardPanel } from '../dashboard';
import { shared } from '../shared';

export function registerOpenDashboard(extensionUri: vscode.Uri): vscode.Disposable {
    return vscode.commands.registerCommand('ecode.openDashboard', () => {
        CarbonDashboardPanel.createOrShow(extensionUri, shared.budg!);
        console.log('Carbon Dashboard command registered.');
    });
}
