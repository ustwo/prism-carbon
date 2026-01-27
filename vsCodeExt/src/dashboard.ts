import * as vscode from 'vscode';

export class CarbonDashboardPanel {
    public static currentPanel: CarbonDashboardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent();
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

        CarbonDashboardPanel.currentPanel = new CarbonDashboardPanel(panel);
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
    private _getWebviewContent() {
            return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Carbon Dashboard</title>
    
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
        body { background-color: #1e1e1e; color: #cfcfcf; font-family: Arial, sans-serif; padding: 20px;}
            .chart-container {
                position: relative;
                height: 400px;
                width: 100%;
                max-width: 800px;
                margin: 0 auto;
            }
                h2 { text-align: center; font-weight: normal; margin-bottom; 10px;}
        </style>

        <div class="chart-container">
            <h2>File by size in Repo</h2>
            <canvas id="emissionChart"></canvas>
        </div>
    
        </head>
    <body>
        <div class="container">
            < canvas id="emissionChart"></canvas>
        </div>
        <script>
        const ctx = document.getElementById('emissionChart');
        const myCHART = NEW chart(ctx, {
        type: "pie",
        data; {
            labels;[],
            datasets;[{
                label:'File Size',
                data:[],
                borderWidth:2}
                ]
                },
                options: {
                    responsive:true,
                    maintain
                    AspectRatio: false,}
                    });
        </script>
    </body>
    </html>`;
        }
}