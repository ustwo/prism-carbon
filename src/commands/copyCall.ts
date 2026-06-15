import * as vscode from 'vscode';
import { CallTreeItem } from '../ui/treeView';

export function registerCopyCall(): vscode.Disposable {
    return vscode.commands.registerCommand('ecode.copyCall', async (item: CallTreeItem) => {
        if (!(item instanceof CallTreeItem)) { return; }
        const lbl = item.label;
        const text = typeof lbl === 'string' ? lbl : (lbl as { label: string } | undefined)?.label ?? '';
        await vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage('Log entry copied to clipboard.');
    });
}
