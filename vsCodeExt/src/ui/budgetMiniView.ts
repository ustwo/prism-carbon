/****************************************************************
 *                     BUDGETMINIVIEW.TS                        *
 *  WEBVIEWVIEW EMBEDDED IN THE EXPLORER SIDEBAR.              *
 *  HTML template  →  public/miniview.html                     *
 *  Styles         →  public/miniview.css                      *
 *  Logic          →  public/miniview.js                       *
 ****************************************************************/

import * as vscode from 'vscode';
import * as path from 'path';
import type { budget } from '../core/budget';
import { getMiniviewContent } from '../dashboard/webviewContent';

interface MiniStats {
    totalEmissions:  number;
    budgetLimit:     number;
    percent:         number;
    average:         number;
    callCount:       number;
    recentEmissions: number[]; // last ≤20 calls for the sparkline
}

export class BudgetMiniViewProvider implements vscode.WebviewViewProvider {
    static readonly viewType = 'ecode.budgetMiniView';

    private static _instance: BudgetMiniViewProvider | undefined;
    private _view?: vscode.WebviewView;
    // Kept so we can respond immediately when the webview signals it's ready
    private _latestBudg: budget;

    constructor(budg: budget, private readonly _extensionUri: vscode.Uri) {
        this._latestBudg = budg;
        BudgetMiniViewProvider._instance = this;
    }

    /** Called from updateTree / clearStore / purgeStore to keep the view live. */
    static update(budg: budget): void {
        if (!BudgetMiniViewProvider._instance) { return; }
        BudgetMiniViewProvider._instance._latestBudg = budg;
        BudgetMiniViewProvider._instance._refresh(budg);
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        _ctx: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this._extensionUri.fsPath, 'public', 'miniview')),
            ],
        };

        webviewView.webview.html = getMiniviewContent(
            webviewView.webview,
            this._extensionUri,
        );

        // The webview posts 'ready' once its JS has loaded; respond with current data.
        webviewView.webview.onDidReceiveMessage(msg => {
            if (msg.command === 'ready') { this._refresh(this._latestBudg); }
        });
    }

    private _refresh(budg: budget): void {
        if (!this._view) { return; }

        const windowStart    = budg.getBudgetWindowStart();
        const windowedCalls  = budg.getCalls().filter(c => c.DateTime >= windowStart);
        const totalEmissions = windowedCalls.reduce((s, c) => s + c.Emissions, 0);
        const budgetLimit    = budg.getBudget();

        const stats: MiniStats = {
            totalEmissions,
            budgetLimit,
            percent:         budgetLimit > 0 ? (totalEmissions / budgetLimit) * 100 : 0,
            average:         windowedCalls.length > 0 ? totalEmissions / windowedCalls.length : 0,
            callCount:       windowedCalls.length,
            recentEmissions: windowedCalls.slice(-20).map(c => c.Emissions),
        };

        this._view.webview.postMessage({ command: 'update', data: stats });
    }
}
