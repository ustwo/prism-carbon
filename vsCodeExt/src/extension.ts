// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as devTok from './devTokens';
import * as vscode from 'vscode';
import * as https from 'https';
import * as budget from './budget';
import * as logCap from './logCapture';
import * as fs from 'fs';
import * as path from 'path';
import { Memento } from 'vscode';
import { stringify } from 'querystring';
import * as childProcess from 'child_process';

import { CarbonDashboardPanel } from './dashboard';
import { state } from './state';

import { InterceptorProxy } from './proxyServer';
import { privateEncrypt } from 'crypto';
import { getSystemErrorMap } from 'util';

export let tree: MyTreeDataProvider;
export let bar: statusBarManager;
export let lastAccess: number;

export function setDisplay(t: MyTreeDataProvider, b: statusBarManager) {
    tree = t;
    bar = b;
}

let proxyServer: InterceptorProxy;
const PROXY_PORT = 3024;
var budg: budget.budget;

export async function activate(context: vscode.ExtensionContext) {


    const copilotChat = vscode.extensions.getExtension('github.copilot-chat');
    if (!copilotChat) {
        vscode.window.showWarningMessage('GitHub Copilot Chat is not installed. Carbon emissions will not be tracked during development time!');
    }
    else {
        if (!copilotChat.isActive) {
            await copilotChat.activate();
        }
        vscode.commands.executeCommand('workbench.action.setLogLevel');
        // get current log level settings
        vscode.window.showInformationMessage('Please Select "Github Copilot Chat" then "Trace" in the above command window');

    }


    budg = new budget.budget(context.workspaceState);


    // state.runningInterceptor = true;

    var barManager = new statusBarManager();
    const treeDataProvider = new MyTreeDataProvider();
    lastAccess = 0;

    vscode.window.registerTreeDataProvider(
        'myPrimaryView',
        treeDataProvider
    );




    //let lastInlineState = false;
    const disposables: vscode.Disposable[] = [];



    setDisplay(treeDataProvider, barManager);


    vscode.window.registerTreeDataProvider(
        'myPrimaryView',
        treeDataProvider
    );



    // budget.initStorage(context.workspaceState);
    restoreCallHistory(treeDataProvider, budg);
    barManager.updateLimit(budg.updateLimit());
    const pastCalls = budg.getCalls();
    if (pastCalls.length > 0) {
        barManager.updateBar(pastCalls[pastCalls.length - 1].Emissions);
    } else {
        barManager.updateBar(0);
    }




    disposables.push(vscode.workspace.onDidSaveTextDocument(async evt => {
        console.log("Updating logs..........");
        getLogs(context);
    }));

    const reset = vscode.commands.registerCommand('ecode.clearStore', () => {
        budg.resetBudget();
        treeDataProvider.clearTree();
        barManager.updateLimit(0);
        //vscode.window.showInformationMessage('Past calls cleared.');
        // state.runningInterceptor = true;

        CarbonDashboardPanel.sendData();

    });

    // }));

    // Dashboard command 
    const dashboardCommand = vscode.commands.registerCommand('ecode.openDashboard', () => {
        CarbonDashboardPanel.createOrShow(context.extensionUri);
        console.log('Carbon Dashboard command registered.');
    });


    const refresh = vscode.commands.registerCommand('ecode.refreshLogs', async () => {
        getLogs(context);
    });


    // keep track of the last known branch 
    let lastKnownBranch = getCurrentBranch();

    const branchChangeListener = vscode.workspace.onDidChangeWorkspaceFolders(() => {
        const currentBranch = getCurrentBranch();
        // only send new data if the branch has changed                   
        if (currentBranch !== lastKnownBranch) {
            lastKnownBranch = currentBranch;
            //Trigger the data recalculation and update the dashboard with the new branch information
            CarbonDashboardPanel.sendData();
        }
    });
    context.subscriptions.push(branchChangeListener);

    const input = vscode.commands.registerCommand('ecode.inputdisplay', async () => {
        //vscode.window.showInformationMessage('Hello World from EstimatingCarbon!');
        const limit = await vscode.window.showInputBox({ //opens an input box currently representing the carbon footprint
            prompt: 'Enter test call: ',
            placeHolder: 'eg. 5',
            ignoreFocusOut: true // keep input box open even if focus moves away from window
        });

        var num = Number(limit);
        if (!Number.isNaN(num)) {
            let now = new Date();
            var newCall: budget.Call = { Emissions: num, Model: "TEST", DateTime: Number(now.getTime()) };
            updateTree(newCall);
        vscode.window.showInformationMessage(`Added ${num}g CO2e for today.`);
        }
        
        else {
            vscode.window.showInformationMessage('Error: NaN inputted.');
        }

    });
    context.subscriptions.push(input);
    context.subscriptions.push(dashboardCommand);

    console.log('Interceptor Proxy Server is activating');

    let startDisposable = vscode.commands.registerCommand('ecode.interceptorStart', async () => {

        if (state.runningInterceptor) {
            console.log("Interceptor is already running!");
            return;
        }
        try {
            // start local server
            proxyServer = new InterceptorProxy(PROXY_PORT);
            await proxyServer.start(context.globalStorageUri.fsPath);

            // set VSCode to use local proxy
            // const config = vscode.workspace.getConfiguration('http');
            // await config.update('proxy', `http://localhost:${PROXY_PORT}`, vscode.ConfigurationTarget.Global);

            // //QUICK FIX TO NOT NEED SSL CERTS FOR NOW
            // // NEED TO CHANGE FOR BETA
            // await config.update('proxyStrictSSL', false, vscode.ConfigurationTarget.Global);


            // const disposableAPIKEY = vscode.commands.registerCommand('ecode.setApiKey', async () => {
            //  const apiKey = await vscode.window.showInputBox({
            //      prompt: 'Enter your API Key',
            //      placeHolder: 'e.g.   sk - xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            //      ignoreFocusOut: true // keep input box open even if focus moves away from window

            //  });
            //  if (apiKey) {
            //      await context.secrets.store('myApiKey', apiKey); // securely stores apikey using key 'myApiKey'

            //      // to retrieve key from secret store, use:   const apiKey = await context.secrets.get('myApiKey');
            state.runningInterceptor = true;
            // vscode.window.showInformationMessage('Interceptor Proxy started on port ' + "->" + PROXY_PORT + state.runningInterceptor + "DONE");
            // vscode.window.showInformationMessage("Status: " + state.runningInterceptor);
        } catch (error) {
            console.error("Error starting Interceptor Proxy:", error);
            vscode.window.showErrorMessage('Failed to start Interceptor Proxy: ' + error);
        }
    });

    let terminal: vscode.Terminal;

    let terminalDisposable = vscode.commands.registerCommand('ecode.interceptorOpenTerminal', async () => {
        if (!proxyServer) {
            vscode.window.showErrorMessage("There is no Interceptor Proxy Running. Please initiate `ecode.InterceptorStart`");
            return;
        }

        const proxyUrl = `http://127.0.0.1:${PROXY_PORT}`;

        //create a new terminal with specific Environment Vars

        terminal = vscode.window.createTerminal({
            name: "Ecode RunTime Analysis Terminal",
            env: {
                // proxy environment variables
                "HTTP_PROXY": proxyUrl,
                "HTTPS_PROXY": proxyUrl,
                "http_proxy": proxyUrl,
                "https_proxy": proxyUrl,

                // supports Python, Ruby, Go, Rust
                "REQUESTS_CA_BUNDLE": proxyServer.certPath,
                "SSL_CERT_FILE": proxyServer.certPath,

                // cURL, PHP, and many C/C++ based tools
                "CURL_CA_BUNDLE": proxyServer.certPath,

                "AWS_CA_BUNDLE": proxyServer.certPath,

                // nodejs specific
                "NODE_EXTRA_CA_CERTS": proxyServer.certPath,
                "NODE_OPTIONS": "--use-env-proxy",

                // java specific
                "JAVA_TOOL_OPTIONS": `-Dhttp.proxyHost=127.0.0.1 -Dhttp.proxyPort=${PROXY_PORT} -Dhttps.proxyHost=127.0.0.1 -Dhttps.proxyPort=${PROXY_PORT}`

            }
        });

        terminal.show();
        // vscode.window.showInformationMessage("Opened Terminal with Proxy Environment Vars");
    });


    let stopDisposable = vscode.commands.registerCommand('ecode.interceptorStop', async () => {
        // stop local server
        if (proxyServer) {
            proxyServer.stop();
            state.runningInterceptor = false;
            vscode.window.showInformationMessage('Runtime Analysis stopped. ');
        }

        if (terminal) {
            terminal.dispose();
        }

        // clear VSCode proxy settings
        // const config = vscode.workspace.getConfiguration('http');
        // await config.update('proxy', undefined, vscode.ConfigurationTarget.Global);
        // await config.update('proxyStrictSSL', undefined, vscode.ConfigurationTarget.Global);

        // vscode.window.showInformationMessage('Interceptor Proxy stopped. ');//Proxy settings cleared.');
    });

    let runtimeDisposable = vscode.commands.registerCommand("ecode.runtimeAnalysis", async () => {
        try {
            await vscode.commands.executeCommand("ecode.interceptorStart");
            await vscode.commands.executeCommand("ecode.interceptorOpenTerminal");
        } catch (error) {
            vscode.window.showErrorMessage("Failed to launch runtime analysis service");
        }
    });

    let ecodeMenu = vscode.commands.registerCommand("ecode.menu", async () => {
        const ecodeCommands = [
            {
                label: `$(play) Start Runtime Analysis`,
                description: "Opens Ecode Terminal where files to be analysed are run",
                command: "ecode.runtimeAnalysis"
            },
            {
                label: `$(play) Stop Runtime Proxy`,
                description: "Stops the recording of carbon emissions",
                command: "ecode.interceptorStop"
                // TODO need to have a way to keep the environment variables (gemini api key) so that it doesn't need to be input every time
            },
            {
                label: `$(play) Reset Stored Session`,
                description: "Resets the current record of carbon emissions",
                command: "ecode.clearStore"
            },
            {
                label: `$(play) Open Dashboard`,
                description: "Displays information on Carbon emissions and usage",
                command: "ecode.openDashboard"
            }
        ];

        const selection = await vscode.window.showQuickPick(ecodeCommands, {
            placeHolder: "Select an Ecode function",
        });

        if (selection) {
            vscode.commands.executeCommand(selection.command);
        }
    });

    const runtimeLaunchButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    // runtimeLaunchButton.text = `$(play) Start Ecode Runtime Analysis`;
    // runtimeLaunchButton.tooltip = "Click to open terminal to run file to be analysed";
    // runtimeLaunchButton.command = "ecode.runtimeAnalysis";
    // runtimeLaunchButton.show();
    runtimeLaunchButton.text = `$(list-unordered) Ecode`;
    runtimeLaunchButton.tooltip = "Click to see AI Analysis Options";
    runtimeLaunchButton.command = "ecode.menu";
    runtimeLaunchButton.show();

    // TODO need to make sure that multiple interceptors can't be started at once. 
    // This isn't handled very gracefully at the moment.


    context.subscriptions.push(terminalDisposable);
    context.subscriptions.push(startDisposable);
    context.subscriptions.push(stopDisposable);
    context.subscriptions.push(runtimeDisposable);
    context.subscriptions.push(runtimeLaunchButton);
    context.subscriptions.push(ecodeMenu);

    return {
        budg,
        isInterceptorRunning: () => state.runningInterceptor
    };

}
export async function deactivate() {
    // make sure that the vscode isn't always vulnerable, disable configurations
    if (proxyServer) {
        await proxyServer.stop();
    }
    // const config = vscode.workspace.getConfiguration('http');
    // await config.update('proxy', undefined, vscode.ConfigurationTarget.Global);
    // await config.update('proxyStrictSSL', undefined, vscode.ConfigurationTarget.Global);

}



class MyTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null> = new vscode.EventEmitter<vscode.TreeItem | undefined | null>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null> = this._onDidChangeTreeData.event;
    private items: vscode.TreeItem[] = []; //creates a list of tree items starts empty obviously

    constructor() {
        this.items.push(new vscode.TreeItem(
            "Latest calls:",
            vscode.TreeItemCollapsibleState.None)); //initialises the messages with one title message     
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }
    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        //If an element is passed it means we are getting children of a sub-item --> no nested items here so empty array returned
        if (element) {
            return Promise.resolve([]);
        } else {
            //Here a top-level item will be created which will be where the message will be displayed           
            return Promise.resolve(this.items);
        }
    }
    addMessage(message: string) { //method which allows messaged to be added
        this.items.push(new vscode.TreeItem( //adds a new item to the side bar
            message,
            vscode.TreeItemCollapsibleState.None
        ));
        this._onDidChangeTreeData.fire(undefined); //refreshes the sidebar

    }
    clearTree() {
        this.items = [];
        this._onDidChangeTreeData.fire(undefined);
    }

    // UstwoBristolEstimatingCarbon

}
class statusBarManager {
    mainItem = vscode.window.createStatusBarItem(); // creates a new item in the VS Code status bar
    defaultColour: string = "statusBarItem.activeBackground"; // defines default colour for the status bar item
    newColour: string; // stores the new colour calculated based on the carbon emissions of the latest request

    constructor() {
        this.newColour = this.defaultColour;
        this.mainItem.text = 'Last Request: 0 g CO₂e';
        this.mainItem.show();
    }

    updateLimit(input: number) {
        this.mainItem.text = 'Last Request: 0 g CO₂e';
        this.newColour = "statusBarItem.activeBackground";
    }
    //this method updates the status bar item with the carbon emissions of the latest request and changes its colour based on predefined thresholds to provide real-time feedback on the environmental impact of development activities
    updateBar(input: number) { 
        if (input !== undefined) {
            this.mainItem.text = 'Last Request: ' + input.toFixed(4) + ' g CO₂e';
            
            // Utilising static thresholds for real-time feedback
            if (input >= 40) {
                this.newColour = "statusBarItem.errorBackground"; // High Emission
            }
            else if (input >= 15) {
                this.newColour = "statusBarItem.warningBackground"; // Average Emission
            }

            else if (input > 0) {
                this.newColour = "statusBarItem.background"; // Low Emission (keeping for now if there is a way to make it green)
            }
            else {
                this.newColour = "statusBarItem.activeBackground"; // Low Emission
            }
        }
        else {
            this.newColour = "statusBarItem.activeBackground";
            this.mainItem.text = 'Last Request: 0 g CO₂e';
        }

        this.mainItem.backgroundColor = new vscode.ThemeColor(this.newColour);  // Update the background color of the status bar item based on the new colour
    }
}

function restoreCallHistory(tree: MyTreeDataProvider, budg: budget.budget) { //restores past calls to sidebar
    var pCalls = budg.getCalls();
    console.log("CALLS:", pCalls);
    for (let i = 0; i < pCalls.length; i++) {
        tree.addMessage("Emissions: " + pCalls[i].Emissions + "g CO₂e - Model: " + pCalls[i].Model + " - Date: " + new Date(pCalls[i].DateTime).toLocaleString());
    }
}

export function getCurrentBranch(): string {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return "Unknown Branch";
        }
        const cwd = workspaceFolders[0].uri.fsPath;
        const branch = childProcess.execSync("git rev-parse --abbrev-ref HEAD", { cwd, encoding: 'utf8' }).trim();
        return branch || "Unknown Branch"; // defaults to unknown branch
    } catch (error) {
        console.error("Error getting git branch:", error);
        return "Unknown Branch";
    }
}

export function updateTree(call: budget.Call) {
    if (!call.Branch) {
        call.Branch = getCurrentBranch();
    }
    budg.storeCall(call);
   
    bar.updateBar(call.Emissions);
    tree.addMessage("Emissions: " + call.Emissions + "g CO₂e - Model: " + call.Model + " - Date: " + new Date(call.DateTime).toLocaleString());

    CarbonDashboardPanel.sendData();

}

export async function getLogs(context: vscode.ExtensionContext) {
    try {
        // concactenates correct file name to access Copilot logs
        const filePath = logCap.getLogFilePath(context);
        console.log(filePath);
        const logUri = path.join(path.dirname(filePath), "GitHub.copilot-chat", "GitHub Copilot Chat.log");

        // reads file and outputs lines to console one at a time
        const content = fs.readFileSync(logUri, 'utf-8');
        const lDate = new Date(lastAccess);

        const regex: RegExp = new RegExp(lDate.toLocaleString());
        const splitting = content.split(regex);
        var input: string = content;

        const models: budget.Call[] = await logCap.identifyModel(input);
        console.log("CALLS: ", models);
        for (let index = 0; index < models.length; index++) {

            if (models[index].DateTime > lastAccess) {
                updateTree(models[index]);
            }
        }
        lastAccess = new Date().getTime();

        //vscode.window.showInformationMessage("Copilot log files refreshed.");
    }
    catch (error) {
        console.log(error);
        vscode.window.showErrorMessage("Error: Copilot log files not found.");
    }
}

export function wrappedGetCall() {
    return budg.getCalls();
}

export function wrappedGetBudget(): number {
    return budg.getBudget();
}

export function wrappedSetBudget(newBudget: number): void {
    budg.setBudget(newBudget);
}
