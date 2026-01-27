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
        // 1. Define your data array here
        const fileSizes = [300, 150, 80, 60,25];  // dummy data representing file sizes 
        

        // function so that colours in the file are distinct 
        function generateColors(count) {
            const colors = [];
            for (let i = 0; i < count; i++) {
                // Rotates around the colour wheel based on how many files there are 
                const hue = Math.floor(i * (360 / count));
                colors.push('hsl(' + hue + ', 70%, 50%)');
            }
            return colors;
        }

        const ctx = document.getElementById('emissionChart');

        const myChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Main.js', 'test.js', 'worker1.js', 'Helperfunction.js', 'Other Files'],
                datasets: [{
                    label: 'File Size',
                    
                    
                    data: fileSizes, 
                    
                    // call the function to generate distinct colours
                    backgroundColor: generateColors(fileSizes.length),
                    
                    borderColor: '#1e1e1e',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#ccc' }
                    }
                }
            }
        });
        // Listener for the real data
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateData') {
                // This will be used when real data is available, the dummy data used above will be ignored
                myChart.data.datasets[0].data = message.data;
                myChart.data.datasets[0].backgroundColor = generateColors(message.data.length);
                myChart.update();
            }
        });

        
    </script>
    </body>
    </html>`;
        }
}

function hsl($: any, arg1: { hue: any; }, arg2: number, arg3: number) {
    throw new Error('Function not implemented.');
}
