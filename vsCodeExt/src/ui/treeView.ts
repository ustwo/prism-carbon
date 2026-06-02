/****************************************************************
 *                         TREEVIEW.TS                          *
 *    TREE DATA PROVIDER FOR THE ACTIVITY BAR SIDEBAR PANEL.   *
 *          DISPLAYS THE HISTORY OF RECORDED AI CALLS           *
 ****************************************************************/

import * as vscode from 'vscode';

// Max archived entries shown in the tree (remainder indicated by count item)
const MAX_ARCHIVED_SHOWN = 200;

export class CallTreeItem extends vscode.TreeItem {
    constructor(
        label: string,
        public readonly callDateTime: number,
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'callEntry';
        this.tooltip = label;
    }
}

class ArchivedGroupItem extends vscode.TreeItem {
    constructor(count: number) {
        super(`Archived (${count} calls)`, vscode.TreeItemCollapsibleState.Collapsed);
        this.contextValue = 'archivedGroup';
    }
}

export class MyTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private currentItems: CallTreeItem[] = [];
    private archivedItems: CallTreeItem[] = [];
    private totalArchived = 0;

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!element) {
            const n = this.currentItems.length;
            const header = n > 0 ? `Last ${n} call${n !== 1 ? 's' : ''}:` : 'Latest calls:';
            const roots: vscode.TreeItem[] = [
                new vscode.TreeItem(header, vscode.TreeItemCollapsibleState.None),
                ...this.currentItems,
            ];
            if (this.totalArchived > 0) {
                roots.push(new ArchivedGroupItem(this.totalArchived));
            }
            return Promise.resolve(roots);
        }

        if (element instanceof ArchivedGroupItem) {
            const children: vscode.TreeItem[] = [...this.archivedItems];
            if (this.totalArchived > MAX_ARCHIVED_SHOWN) {
                children.push(new vscode.TreeItem(
                    `$(ellipsis) … and ${this.totalArchived - MAX_ARCHIVED_SHOWN} more — see Dashboard for full history`,
                    vscode.TreeItemCollapsibleState.None
                ));
            }
            return Promise.resolve(children);
        }

        return Promise.resolve([]);
    }

    // Real-time: add a single current-session call
    addMessage(message: string, dateTime: number) {
        this.currentItems.push(new CallTreeItem(message, dateTime));
        this._onDidChangeTreeData.fire(undefined);
    }

    // Batch restore: sets both sections at once (one render)
    restore(
        currentCalls: Array<{ label: string; dateTime: number }>,
        archivedCalls: Array<{ label: string; dateTime: number }>
    ) {
        this.currentItems = currentCalls.map(c => new CallTreeItem(c.label, c.dateTime));
        this.totalArchived = archivedCalls.length;
        // Show most recent archived calls (last N in chronological order)
        this.archivedItems = archivedCalls
            .slice(-MAX_ARCHIVED_SHOWN)
            .map(c => new CallTreeItem(c.label, c.dateTime));
        this._onDidChangeTreeData.fire(undefined);
    }

    removeItem(dateTime: number) {
        const beforeCurrent = this.currentItems.length;
        const beforeArchived = this.archivedItems.length;
        this.currentItems = this.currentItems.filter(i => i.callDateTime !== dateTime);
        this.archivedItems = this.archivedItems.filter(i => i.callDateTime !== dateTime);
        if (this.archivedItems.length < beforeArchived) {
            this.totalArchived = Math.max(0, this.totalArchived - 1);
        }
        if (this.currentItems.length !== beforeCurrent || this.archivedItems.length !== beforeArchived) {
            this._onDidChangeTreeData.fire(undefined);
        }
    }

    clearTree() {
        this.currentItems = [];
        this.archivedItems = [];
        this.totalArchived = 0;
        this._onDidChangeTreeData.fire(undefined);
    }
}
