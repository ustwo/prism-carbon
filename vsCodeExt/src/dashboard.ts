import * as vscode from 'vscode';
import * as path from 'path';
import * as budget from './budget';
import * as extension from './extension';
import { domainToASCII } from 'url';
import { all } from 'axios';



export class CarbonDashboardPanel {
    public static currentPanel: CarbonDashboardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private readonly _extensionUri: vscode.Uri;
    
    private _selectedBranches: string[] | null = null;
    


    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent();

        // setTimeout(() => {
        //   this._panel.webview.postMessage({
        //     command: "workspaceBranches",
        //     data: [
        //       "main",
        //       "customer/sign-up",
        //       "customer/favourites",
        //       "component/footer"
        //     ]
        //   });
        // }, 300);

        // setTimeout(() => {
        //   this._panel.webview.postMessage({
        //     command: "commitDots",
        //     data: {
        //       main: [{ xAxis: 30, carbon: 35 }, { xAxis: 55, carbon: 10 }, { xAxis: 95, carbon: 110 }],
        //       "customer/sign-up": [{ xAxis: 110, carbon: 229 }, { xAxis: 175, carbon: 23 }],
        //       "customer/favourites": [{ xAxis: 210, carbon: 57 }, { xAxis: 245, carbon: 3 }],
        //       "component/footer": [{ xAxis: 270, carbon: 313 }]
        //     }
        //   });
        // }, 500);

        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'frontEndReady':
                        this._sendData();
                        return;
                   
                    case 'triggerReset':
                        vscode.window.showWarningMessage(

                            'Are you sure you want to reset? The budget will track call from now onwards, all historical data is preserved',
                            {modal: true},
                            'Yes, Reset'
                        ).then( selection =>{
                            if (selection === 'Yes, Reset') {
                                vscode.commands.executeCommand('ecode.clearStore');

                            }
                        });
                        return
                
                    case 'setBudget':
                        vscode.window.showInputBox({
                            prompt: "Enter new session budget in grams of CO2 (gCO2e)",
                            placeHolder: "e.g. 15",
                        }).then(value => {
                            if (value && !isNaN(Number(value))) {
                                require('./extension').wrappedSetBudget(Number(value));
                                this._sendData(); // Update the dashboard with the new budget
                            }
                        });
                        return;

                        case 'filterByBranch':
                            this._selectedBranches = message.branches;
                            this._sendData(); // Update the dashboard with the new branch filter
                            return;
                }
            },
            null,
            this._disposables
        );
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
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(extensionUri.fsPath, 'webview'))]
            }
        );

        CarbonDashboardPanel.currentPanel = new CarbonDashboardPanel(panel, extensionUri);
        // CarbonDashboardPanel.currentPanel._sendData();
    }

    // Call this from extension whenever a new call is recorded to keep the chart live
    public static sendData() {
        if (CarbonDashboardPanel.currentPanel) {
            CarbonDashboardPanel.currentPanel._sendData();
        }
    }

    private _sendData() {

        
        // Aggregate emissions by model from stored calls
        const sessionBudget = require('./extension').wrappedGetBudget();
        const allCalls = require('./extension').wrappedGetCall();
        

        const budgetWindowStart = require('./extension').wrappedGetBudgetWindowStart();

        // Branch-filtered calls for pie chart, average
        const calls = this._selectedBranches === null
            ? allCalls
            : allCalls.filter((c: any) => this._selectedBranches!.includes(c.Branch || "Unknown Branch"));

        // Windowed calls  only those after the budget reset point --> for budget bar only
        const windowedCalls = allCalls.filter((c: any) => {
            const callTime = new Date(c.DateTime).getTime();
            return callTime >= budgetWindowStart;
        });
        const totalRepoEmissions = windowedCalls.reduce(
            (sum: number, call: any) => sum + call.Emissions, 0
        );

        
        
        
            // calculate mean average of all calls
        const totalEmissions = calls.reduce((sum: number, call: any) => sum + call.Emissions, 0);
        const averageEmission = calls.length > 0 ? totalEmissions / calls.length : 0;

        const modelMap: Record<string, number> = {};
        for (const call of calls) {
            const model = call.Model || 'Unknown';
            modelMap[model] = (modelMap[model] || 0) + call.Emissions;
        }
        const modelLabels = Object.keys(modelMap);
        const modelEmissions = modelLabels.map(k => modelMap[k]);

        const dailyEmissions: Record<string, number> = {};
        for (const call of allCalls) {
            let subDate = "";

            let callDate = new Date(call.DateTime);
            if (isNaN(callDate.getTime()) && typeof call.DateTime === 'string') {
                const parts = call.DateTime.split(/[,\s/:]+/);
                if (parts.length >= 3) {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
                    const year = parseInt(parts[2], 10);
                    callDate = new Date(year, month, day);
                }
            }

            if (!isNaN(callDate.getTime())) {
                subDate = callDate.toISOString().substring(0, 10);
            } else {
                subDate = new Date().toISOString().substring(0, 10);
            }
            dailyEmissions[subDate] = (dailyEmissions[subDate] || 0) + call.Emissions;
        }


        const heatMapData = [];
        const endToday = new Date();
        let myDateTime = new Date(new Date().setDate(endToday.getDate() - 365));

        while (myDateTime <= endToday) {
            const subDate = myDateTime.toISOString().substring(0, 10);
            let weekday = myDateTime.getDay();
            weekday = (weekday + 6) % 7 + 1; // start the week from monday (why does anyone ever start it on a sunday????)

            heatMapData.push({
                x: subDate,
                y: weekday.toString(),
                d: subDate,
                v: dailyEmissions[subDate] || 0 // default to 0 if no emission calls
            });
            myDateTime = new Date(myDateTime.setDate(myDateTime.getDate() + 1));
        }

        console.log("BACKEND: Sending updateData command.");
        console.log("BACKEND: HeatMap payload length:", heatMapData.length, "Sample:", heatMapData[heatMapData.length - 1]);

        this._panel.webview.postMessage({
            command: 'updateData',
            modelLabels,
            modelEmissions,
            heatMapData,
            sessionBudget,
            averageEmission, // this is the average emission value calculated from all calls, sent to the frontend to be displayed on the dashboard
            totalRepoEmissions // this is the total emissions from all calls, sent to the frontend to be displayed on the dashboard
        
        });

        const branchMap: Record<string, any[]> = {};
        const branchCounts: Record<string, number> = {};

        for (const call of allCalls) {
            const branch = call.Branch || "Unknown Branch";
            if (!branchMap[branch]) {
                branchMap[branch] = [];
                branchCounts[branch] = 0;
            }
            const time = new Date(call.DateTime).getTime();
            branchMap[branch].push(
                {
                    xAxis: time,
                    carbon: call.Emissions,
                    timeStamp: call.DateTime
                });

            branchCounts[branch]++;
        }

        const workspaceBranches = Object.keys(branchMap);

        this._panel.webview.postMessage({
            command: "workspaceBranches",
            data: workspaceBranches.length > 0 ? workspaceBranches : ["Unknown Branch"]
        });

        this._panel.webview.postMessage({
            command: "commitDots",
            data: Object.keys(branchMap).length > 0 ? branchMap : { "Unknown Branch": [] }
        });
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
        // const stylePath = path.join(this._extensionUri.fsPath, 'src', 'webview', 'style.css');
        // const scriptPath = path.join(this._extensionUri.fsPath, 'src', 'webview', 'dashboard.js');
        // const graphPath = vscode.Uri.file(this._extensionUri.fsPath + '/src/webview/graph.js');
        // const graphUri = this._panel.webview.asWebviewUri(graphPath);
        // const darkModePath = path.join(this._extensionUri.fsPath, 'src', 'webview', 'darkmode.js');
        // const darkModeUri = webview.asWebviewUri(vscode.Uri.file(darkModePath));


        // const styleUri = webview.asWebviewUri(vscode.Uri.file(stylePath));
        // const scriptUri = webview.asWebviewUri(vscode.Uri.file(scriptPath));

        const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'webview', 'style.css')));
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'webview', 'dashboard.js')));
        const graphUri = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'webview', 'graph.js')));
        const darkModeUri = webview.asWebviewUri(vscode.Uri.file(path.join(this._extensionUri.fsPath, 'webview', 'darkmode.js')));
        return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Carbon Dashboard</title>
    
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@3.0.0/dist/chartjs-chart-matrix.min.js"></script>
        <link href="${styleUri}" rel="stylesheet">

        
    
        </head>
    <body>
    <!-- icon picture link -->

  <button id="theme-switch">
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Z"/></svg>
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-280q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Z"/></svg>
  </button>
  <header id="header">
  <h1>Carbon Analysis Dashboard</h1>
  <p> Carbon impact based on each file will be depicted below: </p>
  <div id="dashboard-preferences-selector">
  <h3> Preferences: </h3>
  <div id = "branch-selector-tool"></div>
  </div>
  </header>

        <div id="branchGraph" style="width:100%; height:350px;"></div>

        <div class="dashboard-grid">
    
            

            <div class="chart-wrapper">
                <h2>Emissions by model</h2>
                <div class="chart-container">
                    <canvas id="modelEmissionsChart"></canvas>
                </div>
                <p id="model-empty-msg" style="text-align:center; margin-top:12px;">No calls recorded yet.</p>
            </div>
            
            </div>
    

        <section id="main-view"> 
            <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
                
                <div class="budget-tracker-container">
                    <div class="budget-header">
                        <h2>Session Budget</h2>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" id="session-progress-fill"></div>
                    </div>
                    <div class="budget-footer">
                        <span id="session-percent-used" class="budget-percent">0% used</span>
                        <span id="session-text-right" class="budget-detail">0g / 0g</span>
                    </div>
                    <div class="budget-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; margin-top: 15px; flex-wrap: wrap; gap: 10px;">
                        <button id="set-budget-btn" style="padding: 5px 10px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Set Budget</button>
                        
                     <button id="reset-btn" style="padding: 5px 10px; background-color: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Reset</button>   
                    </div>

                <div class="budget-tracker-container">
                    <div class="budget-header">
                        <h2>Average Request Cost</h2>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <span id="average-cost-display" style="font-size: 2.2rem; font-weight: bold; color: var(--text-color);">0.0000 g</span>
                        <span style="color: var(--secondary-text); font-size: 1.2rem;"> CO₂e</span>
                    </div>
                </div>

            </div>

            <div style="margin-top:60px;">
    <h2 style="text-align:center;">Heat Map</h2>
    
    <div style="max-width:900px; margin:0 auto;">
        <div class="chart-container" style="height:220px;">
            <canvas id="myChart"></canvas>
        </div>

        <!-- Legend INSIDE same container -->
        <div class="heatmap-legend">
            <span class="legend-label">Low</span>
            
            <div class="legend-bar">
                <div class="legend-gradient"></div>
            </div>
            
            <span class="legend-label">High</span>
        </div>
    </div>
</div>
        </section>
    

        <script src="${scriptUri}"></script>
        <script src="${graphUri}"></script>
        <script src="${darkModeUri}"></script>
    
    
    </body>
    </html>`;
    }
}
