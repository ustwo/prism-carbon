/***********************************************************************
 *                            DASHBOARD.TS                             *
 *  VSCODE WEBVIEW PANEL — PANEL LIFECYCLE AND MESSAGE HANDLING ONLY.  *
 *  Data computation  →  dashboardData.ts                              *
 *  HTML template     →  webview/dashboard.html  (via webviewContent)  *
 ***********************************************************************/

import * as vscode from 'vscode';
import * as path from 'path';
import * as budget from '../core/budget';
import { createComparisons } from './dashboardData';
import { getWebviewContent } from './webviewContent';

function getColorConfig() {
    const cfg = vscode.workspace.getConfiguration();
    return {
        neutral: cfg.get<string>('estimatingCarbon.colorNeutral',  '#888888'),
        green:   cfg.get<string>('estimatingCarbon.colorGreen',    '#89d185'),
        amber:   cfg.get<string>('estimatingCarbon.colorAmber',    '#e2c08d'),
        red:     cfg.get<string>('estimatingCarbon.colorRed',      '#f14c4c'),
        minLogs: cfg.get<number>('estimatingCarbon.colorMinLogs',  10),
    };
}

export class CarbonDashboardPanel {
    public static currentPanel: CarbonDashboardPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _budget: budget.budget;
    private _selectedBranches: string[] | null = null;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, budg: budget.budget) {
        this._budget = budg;
        this._panel  = panel;

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = getWebviewContent(panel.webview, extensionUri);

        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'frontEndReady':
                    this._sendData();
                    return;

                case 'triggerReset':
                    vscode.window.showWarningMessage(
                        'Are you sure you want to reset? Prior calls move to Archived; all history is preserved.',
                        { modal: true },
                        'Yes, Reset'
                    ).then(s => { if (s === 'Yes, Reset') { vscode.commands.executeCommand('ecode.clearStore'); } });
                    return;

                case 'triggerPurge':
                    vscode.commands.executeCommand('ecode.purgeStore');
                    return;

                case 'setBudget':
                    vscode.window.showInputBox({
                        prompt: 'New session budget in grams of CO₂ (gCO₂e)',
                        placeHolder: 'e.g. 15',
                    }).then(value => {
                        if (value && !isNaN(Number(value))) {
                            this._budget.setBudget(Number(value));
                            this._sendData();
                        }
                    });
                    return;

                case 'filterByBranch':
                    this._selectedBranches = message.branches;
                    this._sendData();
                    return;

                case 'setRefreshInterval': {
                    const seconds = Number(message.seconds);
                    if (!isNaN(seconds) && seconds >= 0) {
                        vscode.workspace.getConfiguration()
                            .update('estimatingCarbon.logRefreshIntervalSeconds', seconds, vscode.ConfigurationTarget.Global);
                    }
                    return;
                }

                case 'saveColors': {
                    const cfg = vscode.workspace.getConfiguration();
                    const keys: Array<[string, string]> = [
                        ['estimatingCarbon.colorNeutral', message.neutral],
                        ['estimatingCarbon.colorGreen',   message.green],
                        ['estimatingCarbon.colorAmber',   message.amber],
                        ['estimatingCarbon.colorRed',     message.red],
                    ];
                    for (const [key, val] of keys) {
                        if (val) { cfg.update(key, val, vscode.ConfigurationTarget.Global); }
                    }
                    if (message.minLogs !== undefined && !isNaN(Number(message.minLogs))) {
                        cfg.update('estimatingCarbon.colorMinLogs', Math.max(1, Number(message.minLogs)), vscode.ConfigurationTarget.Global);
                    }
                    return;
                }
            }
        }, null, this._disposables);
    }

    // ── Public API ────────────────────────────────────────────────

    public static createOrShow(extensionUri: vscode.Uri, budg: budget.budget) {
        const column = vscode.window.activeTextEditor?.viewColumn;

        if (CarbonDashboardPanel.currentPanel) {
            CarbonDashboardPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'carbonDashboard',
            'Carbon Dashboard',
            column ?? vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(extensionUri.fsPath, 'public', 'dashboard'))],
            }
        );

        CarbonDashboardPanel.currentPanel = new CarbonDashboardPanel(panel, extensionUri, budg);
    }

    public static sendData(_budg?: any) {
        CarbonDashboardPanel.currentPanel?._sendData();
    }

    public dispose() {
        CarbonDashboardPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) { this._disposables.pop()?.dispose(); }
    }

    // ── Data ─────────────────────────────────────────────────────

    private _sendData() {
        const sessionBudget      = this._budget.getBudget();
        const budgetWindowStart  = this._budget.getBudgetWindowStart();
        const refreshIntervalSec = vscode.workspace.getConfiguration()
            .get<number>('estimatingCarbon.logRefreshIntervalSeconds', 15);

        // Calls in the current budget window
        const windowedCalls = this._budget.getCalls().filter(
            (c: any) => c.DateTime >= budgetWindowStart
        );

        // Branch-filtered subset (pie chart, average, heatmap, radar)
        const calls = this._selectedBranches === null
            ? windowedCalls
            : windowedCalls.filter((c: any) =>
                this._selectedBranches!.includes(c.Branch || 'Unknown Branch')
              );

        // Totals
        const totalRepoEmissions = windowedCalls.reduce((s: number, c: any) => s + c.Emissions, 0);
        const totalEmissions     = calls.reduce((s: number, c: any) => s + c.Emissions, 0);
        const averageEmission    = calls.length > 0 ? totalEmissions / calls.length : 0;

        // Model pie chart
        const modelMap: Record<string, number> = {};
        for (const c of calls) {
            const m = c.Model || 'Unknown';
            modelMap[m] = (modelMap[m] || 0) + c.Emissions;
        }
        const modelLabels    = Object.keys(modelMap);
        const modelEmissions = modelLabels.map(k => modelMap[k]);

        // Heatmap (UTC dates)
        const dailyEmissions: Record<string, number> = {};
        for (const c of calls) {
            const d = new Date(c.DateTime).toISOString().substring(0, 10);
            dailyEmissions[d] = (dailyEmissions[d] || 0) + c.Emissions;
        }
        const now    = new Date();
        const endUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        let   dt     = new Date(endUTC.getTime() - 365 * 24 * 60 * 60 * 1000);
        const heatMapData: any[] = [];
        while (dt <= endUTC) {
            const subDate = dt.toISOString().substring(0, 10);
            let wd = dt.getUTCDay();
            wd = (wd + 6) % 7 + 1;
            heatMapData.push({ x: subDate, y: wd.toString(), d: subDate, v: dailyEmissions[subDate] || 0 });
            dt = new Date(dt.getTime() + 24 * 60 * 60 * 1000);
        }

        // Radar chart
        const modelList  = Array.from(new Set(windowedCalls.map((c: any) => c.Model  || 'Unknown Model')));
        const branchList = Array.from(new Set(windowedCalls.map((c: any) => c.Branch || 'Unknown Branch')));
        const radarDataSets = branchList.map(branch => ({
            label: branch,
            data: modelList.map(model =>
                windowedCalls
                    .filter((c: any) =>
                        (c.Branch || 'Unknown Branch') === branch &&
                        (c.Model  || 'Unknown Model')  === model
                    )
                    .reduce((s: number, c: any) => s + c.Emissions, 0)
            ),
        }));

        const colorConfig = getColorConfig();
        const allEmissionsSorted = calls.map((c: any) => c.Emissions).sort((a: number, b: number) => a - b);
        const n = allEmissionsSorted.length;
        const callThresholds = {
            count: n,
            p50: n >= 10 ? allEmissionsSorted[Math.floor(n * 0.5)] : null,
            p90: n >= 10 ? allEmissionsSorted[Math.floor(n * 0.9)] : null,
        };

        this._panel.webview.postMessage({
            command: 'updateData',
            modelLabels, modelEmissions, heatMapData, sessionBudget,
            averageEmission, totalRepoEmissions, refreshIntervalSec,
            conversionData: createComparisons(totalEmissions),
            radarData: { labels: modelList, datasets: radarDataSets },
            colorConfig,
            callThresholds,
        });

        // Branch timeline graph
        const branchMap: Record<string, any[]> = {};
        for (const c of windowedCalls) {
            const branch = c.Branch || 'Unknown Branch';
            if (!branchMap[branch]) { branchMap[branch] = []; }
            branchMap[branch].push({ xAxis: c.DateTime, carbon: c.Emissions, timeStamp: c.DateTime });
        }
        const workspaceBranches = Object.keys(branchMap);

        this._panel.webview.postMessage({
            command: 'workspaceBranches',
            data: workspaceBranches.length > 0 ? workspaceBranches : ['Unknown Branch'],
        });
        this._panel.webview.postMessage({
            command: 'commitDots',
            data: workspaceBranches.length > 0 ? branchMap : { 'Unknown Branch': [] },
        });
    }
}
