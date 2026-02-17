import * as vscode from 'vscode';
import * as path from 'path';



export class CarbonDashboardPanel {
    public static currentPanel: CarbonDashboardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private readonly _extensionUri: vscode.Uri;


    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent(this._panel.webview);
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // already have a panel
        if (CarbonDashboardPanel.currentPanel) {
            CarbonDashboardPanel.currentPanel._panel.reveal(column);
            return;
        }

        // create a new panel
        const panel = vscode.window.createWebviewPanel(
            'carbonDashboard',
            'Carbon Dashboard',
            column || vscode.ViewColumn.One,
            { enableScripts: true }
        );

        CarbonDashboardPanel.currentPanel = new CarbonDashboardPanel(panel, extensionUri);
    }

    public dispose() {
        CarbonDashboardPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) { x.dispose(); }
        }
    }
// generates the HTML content for the webview
// importing chart.js for that charts can be drawn and its libraries will handle the math and drawing
    private _getWebviewContent(webview: vscode.Webview = this._panel.webview): string {
        const stylePath = path.join(this._extensionUri.fsPath, 'src', 'webview', 'style.css');
        const scriptPath = path.join(this._extensionUri.fsPath, 'src', 'webview', 'dashboard.js');
        
        
        const styleUri = webview.asWebviewUri(vscode.Uri.file(stylePath));
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(scriptPath));  
        return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Carbon Dashboard</title>
    
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="${styleUri}" rel="stylesheet">

        
    
        </head>
    <body>
    <!-- icon picture link -->

  <button id="theme-switch">
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Z"/></svg>
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-280q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Z"/></svg>
  </button>
  <header id="header">
            <h1>Carbon Analysis</h1>
            <p>Click a section in 'Carbon Cost' to see budget details.</p>
        </header>

        <section id="main-view" class="dashboard-grid"> 
            <div class="chart-wrapper">
                <h2>File by Size in Repo</h2>
                <div class="chart-container">
                    <canvas id="emissionChart"></canvas>
                </div>
            </div>
            <div class="chart-wrapper">
                <h2>Carbon Cost in Repo by File</h2>
                <div class="chart-container">
                    <canvas id="carbonCostChart"></canvas>
                </div>
            </div>
        </section>

        <section id="drilldown-view">
            <button class="back-btn" id="back-btn">← Back to Overview</button>
            <h2 id="drilldown-title">File vs Budget</h2>
            <div class="chart-container" style="max-width: 500px; margin: 0 auto;">
                <canvas id="budgetChart"></canvas>
            </div>
        </section>

        <script src="${scriptUri}"></script>
    
       
    </body>
    </html>`;
    }
}

