/****************************************************************
 *                         TREEVIEW.TS                          *
 *    TREE DATA PROVIDER FOR THE ACTIVITY BAR SIDEBAR PANEL.   *
 *          DISPLAYS THE HISTORY OF RECORDED AI CALLS           *
 ****************************************************************/

import * as vscode from 'vscode';

export class MyTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    private items: vscode.TreeItem[] = [];

    constructor() {
        this.items.push(new vscode.TreeItem('Latest calls:', vscode.TreeItemCollapsibleState.None));
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (element) {
            return Promise.resolve([]);
        }
        return Promise.resolve(this.items);
    }

    addMessage(message: string) {
        this.items.push(new vscode.TreeItem(message, vscode.TreeItemCollapsibleState.None));
        this._onDidChangeTreeData.fire(undefined);
    }

    clearTree() {
        this.items = [];
        this._onDidChangeTreeData.fire(undefined);
    }
}
