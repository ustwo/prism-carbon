import * as vscode from 'vscode';


export class CarbonDashboardPanel {
    public static currentPanel: CarbonDashboardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private readonly _extensionUri: vscode.Uri;


    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
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
    private _getWebviewContent() {

        return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Carbon Dashboard</title>
    
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
       /* day mode color setting */

:root{
   --base-color: white;
  --base-variant: #e8e9ed;
  --text-color: #111528;
  --secondary-text: #232738;
  --primary-color: #3a435d;
}

/* night mode color setting */

body.darkmode{
    --base-color:#070b1d;
    --base-variant:#03050e;
    --text-color:#ffffff;
    --secondary-text: #a4a5b8;
    --primary-color: #3a435d;
}

/* basic browser setting, and font */

* { margin:0; padding:0; box-sizing:border-box; }
html{ font-family: sans-serif; }

/* main page style, paddings  */

body{ min-height:100vh; background-color:var(--base-color); color:var(--text-color); transition: all 0.3s ease; }
header, section{ padding:70px min(50px,7%); }
section{ background-color: var(--base-variant); }
p{ margin:10px 0 20px 0; color:var(--secondary-text); }

/* the circle outside icon */

#theme-switch{
    height: 50px;
    width: 50px;
    padding: 0;
    border-radius: 50%;
    background-color: var(--base-variant);
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 20px;
    right: 20px;
    cursor: pointer;
}

/* hide icon at relevent mode */

#theme-switch svg{ fill: var(--primary-color); }
#theme-switch svg:last-child{ display: none; }
body.darkmode #theme-switch svg:first-child{ display: none; }
body.darkmode #theme-switch svg:last-child{ display: block; }
            .chart-container {
                position: relative;
                height: 300px;
                width: 100%;
                max-width: 800px;
                margin: 0 auto;
            }
            .chart-wrapper{
            flex: 1;
            min-width: 300px;
            max-width: 500px;
            }
            .dashboard-grid{
            display: flex;
            flex-wrap:wrap;
            justify-content: space-around;
            gap: 20px;
            padding: 20px;
            }
                h2 { text-align: center; font-weight: normal; margin-bottom: 10px;}
        </style>

        
    
        </head>
    <body>
    <!-- icon picture link -->

  <button id="theme-switch">
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Z"/></svg>
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-280q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Z"/></svg>
  </button>
  <header>


  <h1>Carbon Analysis</h1>
  <p> Carbon impact based on each file will be depicted below via pie charts</p>
</header>
       <section class = "dashboard-grid"> 
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

    <script src="https://code.jscharting.com/latest/jscharting.js"></script>

    <script>

// listens for clicking and change color for it

  const btn = document.getElementById('theme-switch');
  btn.addEventListener('click', () => {
    document.body.classList.toggle('darkmode');
  });

  /* ---------- heatmap ---------- */
var palette = [
  '#3c506b',
  '#577399',
  '#BDD5EA',
  '#F7F7FF'
].reverse();

var data = [
  { x: 'Jan', y: 'file 1', z: 90 },
  { x: 'Feb', y: 'file 1', z: 177 },
  { x: 'Mar', y: 'file 1', z: 147 },
  { x: 'Apr', y: 'file 1', z: 193 },
  { x: 'May', y: 'file 1', z: 120 },
  { x: 'Jun', y: 'file 1', z: 116 },
  { x: 'Jul', y: 'file 1', z: 176 },
  { x: 'Aug', y: 'file 1', z: 198 },
  { x: 'Sep', y: 'file 1', z: 98 },
  { x: 'Oct', y: 'file 1', z: 124 },
  { x: 'Nov', y: 'file 1', z: 109 },
  { x: 'Dec', y: 'file 1', z: 136 },

  { x: 'Jan', y: 'file 2', z: 185 },
  { x: 'Feb', y: 'file 2', z: 103 },
  { x: 'Mar', y: 'file 2', z: 199 },
  { x: 'Apr', y: 'file 2', z: 190 },
  { x: 'May', y: 'file 2', z: 174 },
  { x: 'Jun', y: 'file 2', z: 189 },
  { x: 'Jul', y: 'file 2', z: 132 },
  { x: 'Aug', y: 'file 2', z: 200 },
  { x: 'Sep', y: 'file 2', z: 176 },
  { x: 'Oct', y: 'file 2', z: 97 },
  { x: 'Nov', y: 'file 2', z: 171 },
  { x: 'Dec', y: 'file 2', z: 120 }
];

// wait until DOM exists
window.addEventListener('load', () => {
  JSC.chart('chartDiv1', {
    type: 'heatmap solid',
    margin: [-4, -4],
    box_fill: 'none',
    palette: {
      pointValue: p => p.options('z'),
      colors: palette
    },
    legend_visible: false,
    defaultPoint: {
      outline_width: 0,
      tooltip: '%yValue - %xValue<br><b>%zValue kg CO2</b>'
    },
    series: [{ points: data }]
  });
});

       
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
                carbonChart.data.datasets[0].data = message.carbonData;
                carbonChart.update();
                myChart.data.datasets[0].data = message.fileSizes;
                myChart.data.datasets[0].backgroundColor = generateColors(message.fileSizes.length);
                myChart.update();
            }
        });

       const carbonData = [400, 200, 50, 30, 100]; // dummy data
       
       const ctxCarbon = document.getElementById('carbonCostChart');
       const carbonChart = new Chart(ctxCarbon, {
              type: 'pie',
                data: {
                    labels: ['Main.js', 'test.js', 'worker1.js', 'Helperfunction.js', 'Other Files'],
                    datasets: [{
                        data: carbonData,
                        backgroundColor: generateColors(carbonData.length),
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
        
         
    </script>
    </body>
    </html>`;
    }
}


