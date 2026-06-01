/***********************************************************************
 *                            DASHBOARD.TS                             *
 *     ACTS AS INTERFACE BETWEEN WEBVIEW FOLDER AND EXTENSION.TS,      *
 * HANDLES DATA PROCESSING AND COMMUNICATION TO THE DASHBOARD WEBVIEW, *
 *          ALSO GENERATES THE HTML CONTENT FOR THE WEBVIEW.           *
 ***********************************************************************/

import * as vscode from 'vscode';
import * as path from 'path';
import * as budget from '../core/budget';

// created interface for comparison data to be used in the comparisons 
// widget of the dashboard when implemented - 
// this will hold equivalent carbon data for different activities 
// to help users contextualize their emissions
interface comparisonData {
        milesDriven: number;
        hoursOfStreaming: number;
        flightDistance: number;
        phoneCharges: number;
        treeYearlyAbsorption: number;
    }

export class CarbonDashboardPanel {
    public static currentPanel: CarbonDashboardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private readonly _extensionUri: vscode.Uri;
    private _budget: budget.budget;
    private _selectedBranches: string[] | null = null;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, budg: budget.budget) {
        this._budget = budg;
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent();

        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'frontEndReady':
                        this._sendData(); // Send initial data to populate the dashboard when the frontend signals it's ready
                        return;
                   
                    case 'triggerReset':
                        vscode.window.showWarningMessage(
                            'Are you sure you want to reset? The budget will track calls from now onwards, all historical data is preserved',
                            {modal: true},
                            'Yes, Reset'
                        ).then(selection => {
                            if (selection === 'Yes, Reset') {
                                vscode.commands.executeCommand('ecode.clearStore');
                            }
                        });
                        return;

                    case 'triggerPurge':
                        vscode.commands.executeCommand('ecode.purgeStore');
                        return;
                
                    case 'setBudget':
                        vscode.window.showInputBox({
                            prompt: "Enter new session budget in grams of CO2 (gCO2e)",
                            placeHolder: "e.g. 15",
                        }).then(value => {
                            if (value && !isNaN(Number(value))) {
                                this._budget.setBudget(Number(value)); // Update the budget instance with the new value
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

    public static createOrShow(extensionUri: vscode.Uri ,budg: budget.budget) {
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

        CarbonDashboardPanel.currentPanel = new CarbonDashboardPanel(panel, extensionUri, budg);
    }

    // Call this from extension whenever a new call is recorded to keep the chart live
    public static sendData(_budg?: any) {
        if (CarbonDashboardPanel.currentPanel) {
            CarbonDashboardPanel.currentPanel._sendData();
        }
    }


    public static createComparisons(totalEmissions: number) : comparisonData {
        return {
            milesDriven: totalEmissions/205, // average grams of C02e per mile in EU/UK
            hoursOfStreaming: 0,
            flightDistance: 0,
            phoneCharges: totalEmissions/8.187864, // average grams of CO2e per full iphone 17 charge (using 3692mah battery, 2 hour charge time and 40w charger accounting for 15% heat loss)
            treeYearlyAbsorption: totalEmissions/22000 // average grams of CO2 absorbed by a mature oak tree per year (taken as an average across its life)
        };
    }

    private _sendData() {
        const sessionBudget     = this._budget.getBudget();
        const budgetWindowStart = this._budget.getBudgetWindowStart();

        // All calls in the current budget window (post-reset)
        const windowedCalls = this._budget.getCalls().filter(
            (c: any) => c.DateTime >= budgetWindowStart
        );

        // Branch-filtered view (pie chart, average, heatmap, radar)
        const calls = this._selectedBranches === null
            ? windowedCalls
            : windowedCalls.filter((c: any) =>
                this._selectedBranches!.includes(c.Branch || 'Unknown Branch')
              );

        // Budget bar: total over the full window regardless of branch filter
        const totalRepoEmissions = windowedCalls.reduce(
            (sum: number, c: any) => sum + c.Emissions, 0
        );

        // Charts
        const totalEmissions = calls.reduce((sum: number, c: any) => sum + c.Emissions, 0);
        const averageEmission = calls.length > 0 ? totalEmissions / calls.length : 0;

        const modelMap: Record<string, number> = {};
        for (const call of calls) {
            const model = call.Model || 'Unknown';
            modelMap[model] = (modelMap[model] || 0) + call.Emissions;
        }
        const modelLabels    = Object.keys(modelMap);
        const modelEmissions = modelLabels.map(k => modelMap[k]);

        // Heatmap: daily totals from the branch-filtered window
        const dailyEmissions: Record<string, number> = {};
        for (const call of calls) {
            const subDate = new Date(call.DateTime).toISOString().substring(0, 10);
            dailyEmissions[subDate] = (dailyEmissions[subDate] || 0) + call.Emissions;
        }

        const conversionData = CarbonDashboardPanel.createComparisons(totalEmissions);

        const now    = new Date();
        const endUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        let myDateTime = new Date(endUTC.getTime() - 365 * 24 * 60 * 60 * 1000);
        const heatMapData = [];

        while (myDateTime <= endUTC) {
            const subDate = myDateTime.toISOString().substring(0, 10);
            let weekday = myDateTime.getUTCDay();
            weekday = (weekday + 6) % 7 + 1;
            heatMapData.push({ x: subDate, y: weekday.toString(), d: subDate, v: dailyEmissions[subDate] || 0 });
            myDateTime = new Date(myDateTime.getTime() + 24 * 60 * 60 * 1000);
        }

        // Radar: model × branch breakdown within window
        const modelList  = Array.from(new Set(windowedCalls.map((c: any) => c.Model  || 'Unknown Model')));
        const branchList = Array.from(new Set(windowedCalls.map((c: any) => c.Branch || 'Unknown Branch')));

        const radarDataSets = branchList.map(branch => {
            const branchCalls = windowedCalls.filter((c: any) => (c.Branch || 'Unknown Branch') === branch);
            return {
                label: branch,
                data: modelList.map(model =>
                    branchCalls
                        .filter((c: any) => (c.Model || 'Unknown Model') === model)
                        .reduce((sum: number, c: any) => sum + c.Emissions, 0)
                ),
            };
        });

        this._panel.webview.postMessage({
            command: 'updateData',
            modelLabels,
            modelEmissions,
            heatMapData,
            sessionBudget,
            averageEmission,
            totalRepoEmissions,
            conversionData,
            radarData: { labels: modelList, datasets: radarDataSets },
        });

        // Branch timeline graph — windowed
        const branchMap: Record<string, any[]> = {};
        for (const call of windowedCalls) {
            const branch = call.Branch || 'Unknown Branch';
            if (!branchMap[branch]) { branchMap[branch] = []; }
            branchMap[branch].push({
                xAxis: call.DateTime,
                carbon: call.Emissions,
                timeStamp: call.DateTime,
            });
        }

        const workspaceBranches = Object.keys(branchMap);
        this._panel.webview.postMessage({
            command: 'workspaceBranches',
            data: workspaceBranches.length > 0 ? workspaceBranches : ['Unknown Branch'],
        });
        this._panel.webview.postMessage({
            command: 'commitDots',
            data: Object.keys(branchMap).length > 0 ? branchMap : { 'Unknown Branch': [] },
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
    <script
        src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@3.0.0/dist/chartjs-chart-matrix.min.js"></script>
    <link href="${styleUri}" rel="stylesheet">



</head>

<body>
    <!-- icon picture link -->

    <button id="theme-switch">
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
            <path
                d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Z" />
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
            <path
                d="M480-280q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Z" />
        </svg>
    </button>
    <header id="header">
        <h1>Carbon Analysis Dashboard</h1>
        <p> Carbon impact based on each file will be depicted below: </p>
        <div id="dashboard-preferences-selector">
            <h3> Preferences: </h3>
            <div id="branch-selector-tool"></div>
        </div>
    </header>

    <div id="branchGraph" style="width:100%; height:350px;"></div>

    <div class="dashboard-double-grid">



        <div class="budget-tracker-container scrollable-container">
            <h2>Emissions by model</h2>
            <div class="grid-item">
                <canvas id="modelEmissionsChart"></canvas>
            </div>
            <p id="model-empty-msg" style="text-align:center; margin-top:12px;">No calls recorded yet.</p>
        </div>

        <div class = "budget-tracker-container scrollable-container" id="radar-container"> 
            <h2>Branch Emissions</h2>
            <div class="grid-item">
                <button id="radar-fullscreen-btn" style="position: absolute; top: 10px; right: 10px; z-index: 10;">⛶ Fullscreen</button>
                <canvas id="radarChart"></canvas>
            </div>
            <p id="radar-empty-msg" style="text-align:center; margin-top:12px;">No calls recorded yet.</p>
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
                <div class="budget-header"
                    style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; margin-top: 15px;">
                    <button id="set-budget-btn"
                        style="padding: 5px 10px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-right: 10px;">Set
                        Budget</button>
                    <button id="reset-btn"
                        style="padding: 5px 10px; background-color: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-right: 10px;">Reset</button>
                    <button id="purge-btn"
                        style="padding: 5px 10px; background-color: #6c3483; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;" title="Permanently delete all stored logs">🗑 Purge Logs</button>
                </div>
            </div>

            <div class="budget-tracker-container">
                <div class="budget-header">
                    <h2>Average Request Cost</h2>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <span id="average-cost-display"
                        style="font-size: 2.2rem; font-weight: bold; color: var(--text-color);">0.0000 g</span>
                    <span style="color: var(--secondary-text); font-size: 1.2rem;"> CO₂e</span>
                </div>
            </div>

        </div>

        <div class="heatmap-section">

         <h2 style="text-align:center; margin-top:60px; margin-bottom:15px;">
    Heat Map
</h2>
    
    <div style="max-width:900px; margin:40px auto 0 auto; display:block;">

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


    

    <div class="dashboard-triple-grid">
      <div class="grid-item">
        <div class="phone-element">
        <!-- From Uiverse.io by santhoshsj-dev --> 
          <div class="loader"></div>
        </div>
        <p id="phone-empty-msg" style="text-align:center; margin-top:12px;">Equivalent to charging 0 iphone 17s.</p>
      </div>

    <div class="grid-item">
        <div class="car-element"> 
        <!-- From Uiverse.io by yeisonordonez -->

        <div class="container">
            <div class="car-container">
                <div class="car"></div>
                <div class="front-part"></div>
                <div class="front-part2"></div>
                <div class="front-part3"></div>
                <div class="bottom-part"></div>
                <div class="wheel-container wheel-container1"></div>
                <div class="wheel-container wheel-container2"></div>
                <div class="wheel-back"></div>
                <div class="window"></div>
                <div class="window2"></div>
                <div class="window3"></div>
                <div class="details"></div>
                <div class="details2"></div>
                <div class="details3"></div>
                <div class="details4"></div>
                <div class="details5"></div>
                <div class="bumper"></div>
                <div class="bumper2"></div>
                <div class="head-lights"></div>
                <div class="tail-lights"></div>
                <div class="extra-lighting-details"></div>
                <div class="extra-lighting-details2"></div>
                <div class="extra-lighting-details3"></div>
            </div>

            <div class="container-wheel1">
                <div class="wheel-break"></div>
                <div class="wheel-ring wheel-ring1">
                    <div class="wheel-center"></div>
                    <div class="wheel-center2"></div>
                    <div class="wheel-ring-stick"></div>
                    <div class="wheel-ring-stick wheel-ring-stick2"></div>
                    <div class="wheel-ring-stick wheel-ring-stick3"></div>
                    <div class="wheel-ring-stick wheel-ring-stick4"></div>
                    <div class="wheel-ring-stick wheel-ring-stick5"></div>
                    <div class="wheel-logo"></div>
                </div>
            </div>

            <div class="container-wheel2">
                <div class="wheel-break2"></div>
                <div class="wheel-ring2 wheel-ring">
                    <div class="wheel-center"></div>
                    <div class="wheel-center2"></div>
                    <div class="wheel-ring-stick"></div>
                    <div class="wheel-ring-stick wheel-ring-stick2"></div>
                    <div class="wheel-ring-stick wheel-ring-stick3"></div>
                    <div class="wheel-ring-stick wheel-ring-stick4"></div>
                    <div class="wheel-ring-stick wheel-ring-stick5"></div>
                    <div class="wheel-logo"></div>
                </div>
            </div>

            <div class="street">
                <div class="line"></div>
                <div class="obstacles"></div>
            </div>
        </div></div>
        <p id="car-empty-msg" style="text-align:center; margin-top:12px;">Equivalent to 0 miles driven.</p>
    </div>

    <div class="grid-item">
        <div class="tree-element">
        <!-- From Uiverse.io by NlghtM4re --> 

        <div class="container">
        <div class="tree">
            <div class="branch" style="--x:0">
            <span style="--i:0;"></span>
            <span style="--i:1;"></span>
            <span style="--i:2;"></span>
            <span style="--i:3;"></span>
            </div>
            <div class="branch" style="--x:1">
            <span style="--i:0;"></span>
            <span style="--i:1;"></span>
            <span style="--i:2;"></span>
            <span style="--i:3;"></span>
            </div>
            <div class="branch" style="--x:2">
            <span style="--i:0;"></span>
            <span style="--i:1;"></span>
            <span style="--i:2;"></span>
            <span style="--i:3;"></span>
            </div>
            <div class="branch" style="--x:3">
            <span style="--i:0;"></span>
            <span style="--i:1;"></span>
            <span style="--i:2;"></span>
            <span style="--i:3;"></span>
            </div>
            <div class="stem">
            <span style="--i:0;"></span>
            <span style="--i:1;"></span>
            <span style="--i:2;"></span>
            <span style="--i:3;"></span>
            </div>
            <span class="shadow"></span>
        </div>
        </div>
        </div>
        <p id="tree-empty-msg" style="text-align:center; margin-top:12px;">Equivalent to the carbon absorption of 0 trees.</p>

    </div>
    </div>
    <script src="${scriptUri}"></script>
    <script src="${graphUri}"></script>
    <script src="${darkModeUri}"></script>
</body>

</html>`;
    }
}
