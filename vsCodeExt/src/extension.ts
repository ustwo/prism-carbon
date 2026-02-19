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

import { CarbonDashboardPanel } from './dashboard';
import { state } from './state';

import { InterceptorProxy } from './proxyServer';
import { privateEncrypt } from 'crypto';

export let tree: MyTreeDataProvider;
export let bar: statusBarManager;

export function setDisplay(t: MyTreeDataProvider, b: statusBarManager) {
    tree = t;
    bar = b;
}


let proxyServer: InterceptorProxy;
const PROXY_PORT = 3024;
var budg: budget.budget;

export function activate(context: vscode.ExtensionContext) {
    budg = new budget.budget(context.workspaceState);

    // state.runningInterceptor = true;

    var barManager = new statusBarManager();
    const treeDataProvider = new MyTreeDataProvider();
    vscode.window.registerTreeDataProvider(
        'myPrimaryView',
        treeDataProvider
    );

    function convert(x: any) {
        //treeDataProvider.addMessage(String(x));
        return x;
    }

    //let lastInlineState = false;
    const disposables: vscode.Disposable[] = [];


    setDisplay(treeDataProvider, barManager);

    vscode.window.registerTreeDataProvider(
        'myPrimaryView',
        treeDataProvider
    );


    // budget.initStorage(context.workspaceState);
    restoreCallHistory(treeDataProvider,budg);
    barManager.updateLimit(budg.updateLimit());
    const BarManager = vscode.window.createStatusBarItem();


    disposables.push(vscode.workspace.onDidChangeTextDocument(async evt => {
        const tokens = -1;
        //Number(await devTok.change(evt));

        if (tokens !== -1) {
            var emissions = convert(tokens);

            
            treeDataProvider.addMessage("Call ID: xxxx - Emissions: " + emissions + ' g CO₂e');


            let date = new Date();
            var newCall: budget.Call = { Emissions: emissions, Model: "TEST", DateTime: date.toLocaleString() };
            updateTree(newCall);

        }
    }));

    const newF = vscode.commands.registerCommand('ecode.newFile',async () =>{
        vscode.workspace.openTextDocument({content:" "}).then(async doc => {				
            await vscode.window.showTextDocument(doc);
            const position = new vscode.Position(10, 28);
            new vscode.Selection(position, position);
            await vscode.commands.executeCommand('type', { text: "HELLO" });

        });
    });

    const reset = vscode.commands.registerCommand('ecode.clearStore', () => {
        budg.resetBudget();
        treeDataProvider.clearTree();
        barManager.updateLimit(0);
        vscode.window.showInformationMessage('Past calls cleared.');
        // state.runningInterceptor = true;

    });

    // Dashboard command 
    const dashboardCommand = vscode.commands.registerCommand('ecode.openDashboard', () => {
        CarbonDashboardPanel.createOrShow(context.extensionUri);
        console.log('Carbon Dashboard command registered.');
    });

    const refresh = vscode.commands.registerCommand('ecode.refreshLogs', () => {
        try {

        // concactenates correct file name to access Copilot logs
        const filePath = logCap.getLogFilePath(context);
        console.log(filePath);
        const logUri = path.join(path.dirname(filePath), "GitHub.copilot-chat", "GitHub Copilot Chat.log");

        // reads file and outputs lines to console one at a time
        const content = fs.readFileSync(logUri, 'utf-8');
        const lines: string[] = content.split(/\r?\n/);
        for (const line of lines) {
            console.log(line.trim());
        }
        vscode.window.showInformationMessage("Copilot log files refreshed.");
        }
        catch (error) {
            vscode.window.showErrorMessage("Error: Copilot log files not found.");
        }
    });


    const input = vscode.commands.registerCommand('ecode.inputdisplay', async () => {
        //vscode.window.showInformationMessage('Hello World from EstimatingCarbon!');
        const limit = await vscode.window.showInputBox({ //opens an input box currently representing the carbon footprint
            prompt: 'Enter test call: ',
            placeHolder: 'eg. 5',
            ignoreFocusOut: true // keep input box open even if focus moves away from window
        });
        var num = Number(limit);
        if (!Number.isNaN(num)) {
            let date = new Date();
            var newCall: budget.Call = { Emissions: num, Model: "TEST", DateTime: date.toLocaleString() };
            updateTree(newCall);
        }
        else {
            vscode.window.showInformationMessage('Error: NaN inputted.');
        }

    });
    context.subscriptions.push(input);
    context.subscriptions.push(dashboardCommand);

    console.log('Interceptor Proxy Server is active');

    let startDisposable = vscode.commands.registerCommand('ecode.interceptorStart', async () => {
        try {
            // start local server
            proxyServer = new InterceptorProxy(PROXY_PORT);
            await proxyServer.start(context.globalStorageUri.fsPath);

            // set VSCode to use local proxy
            const config = vscode.workspace.getConfiguration('http');
            await config.update('proxy', `http://localhost:${PROXY_PORT}`, vscode.ConfigurationTarget.Global);

            //QUICK FIX TO NOT NEED SSL CERTS FOR NOW
            // NEED TO CHANGE FOR BETA
            await config.update('proxyStrictSSL', false, vscode.ConfigurationTarget.Global);


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
            vscode.window.showInformationMessage("Status: " + state.runningInterceptor);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to start Interceptor Proxy: ' + error);
        }
    });

    let stopDisposable = vscode.commands.registerCommand('ecode.interceptorStop', async () => {
        // stop local server
        if (proxyServer) {
            proxyServer.stop();
        }

        // clear VSCode proxy settings
        const config = vscode.workspace.getConfiguration('http');
        await config.update('proxy', undefined, vscode.ConfigurationTarget.Global);
        await config.update('proxyStrictSSL', undefined, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage('Interceptor Proxy stopped. Proxy settings cleared.');
    });

    let terminalDisposable = vscode.commands.registerCommand('ecode.interceptorOpenTerminal', async () => {
        if (!proxyServer) {
            vscode.window.showErrorMessage("There is no Interceptor Proxy Running. Please initiate `ecode.InterceptorStart`");
            return;
        }

        const proxyUrl = `http://127.0.0.1:${PROXY_PORT}`;

        //create a new terminal with specific Environment Vars

        const terminal = vscode.window.createTerminal({
            name: "Estimating Carbon Terminal",
            env: {
                // proxy environment variables
                "HTTP_PROXY": proxyUrl,
                "HTTPS_PROXY": proxyUrl,
                "http_proxy": proxyUrl,
                "https_proxy": proxyUrl,

                // python specific
                "REQUESTS_CA_BUNDLE": proxyServer.certPath,

                // nodejs specific
                "NODE_EXTRA_CA_CERTS": proxyServer.certPath
            }
        });

        terminal.show();
        vscode.window.showInformationMessage("Opened Terminal with Proxy Environment Vars");
    });

    context.subscriptions.push(terminalDisposable);
    context.subscriptions.push(startDisposable);
    context.subscriptions.push(stopDisposable);
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
    const config = vscode.workspace.getConfiguration('http');
    await config.update('proxy', undefined, vscode.ConfigurationTarget.Global);
    await config.update('proxyStrictSSL', undefined, vscode.ConfigurationTarget.Global);
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
        this._onDidChangeTreeData.fire(); //refreshes the sidebar

    }
    clearTree() {
        this.items = [];
        this._onDidChangeTreeData.fire();
    }

}
class statusBarManager {
    mainItem = vscode.window.createStatusBarItem(); //creates a status bar item for limit word
    loading: vscode.StatusBarItem[] = []; //creates a list of statusbar items for the loading bar items
    defaultColour: string = "statusBarItem.activeBackground";
    newColour: string;

    constructor() {
        this.newColour = this.defaultColour;
        this.mainItem.text = 'Average carbon cost: g CO₂e';
        this.mainItem.show();//displays the limit item


    }

    updateLimit(input: number) {
        this.mainItem.text = 'Average carbon cost: ' + input + ' g CO₂e';
        this.newColour = "statusBarItem.activeBackground";
    }

    updateBar(input: number, limit: number) {

        if (input) {
            this.mainItem.text = 'Average carbon cost: ' + limit + ' g CO₂e';
            if (input >= 3 * limit) { //currently 8 represents the limit 
                this.newColour = "statusBarItem.errorBackground"; //if well beyond the limit the loading bar goes red
                vscode.window.showInformationMessage('VERY high carbon AI call made (check pane for details)');
            }
            else if (input >= 1.5 * limit) {
                this.newColour = "statusBarItem.warningBackground"; //if beyond the limit the loading bar goes yellow
                vscode.window.showInformationMessage('High carbon AI call made (check pane for details)');
            }
            else {
                this.newColour = "statusBarItem.activeBackground"; //if not beyond the limit loading bar is clear
                //vscode.window.showInformationMessage('below limit');  
            }
            var i: number = 0;
        }
        else {
            this.newColour = "statusBarItem.activeBackground";
            input = 0;
            vscode.window.showInformationMessage('not satisfied!');
        }
        // for(i = 0;i<Math.max(input);i++){ //populates the loading bar
        //  this.loading[i].backgroundColor = new vscode.ThemeColor(this.newColour);
        //  }
        // for(i;i<this.loading.length;i++){
        //  this.loading[i].backgroundColor = new vscode.ThemeColor("statusBarItem.activeBackground");
        //  }

        this.mainItem.backgroundColor = new vscode.ThemeColor(this.newColour); //colours the word "loading"
    }
}

function restoreCallHistory(tree: MyTreeDataProvider,budg:budget.budget) { //restores past calls to sidebar
    var pCalls = budg.getCalls();
    console.log("CALLS:", pCalls);
    for (let i = 0; i < pCalls.length; i++) {
        tree.addMessage("Emissions: " + pCalls[i].Emissions + " - Model: " + pCalls[i].Model + " - Date: " + pCalls[i].DateTime);
    }
}

export function updateTree(call: budget.Call) {
    budg.storeCall(call);
    var cLimit = budg.updateLimit();
    console.log("limit: " + cLimit);
    bar.updateBar(call.Emissions, cLimit);
    tree.addMessage("Emissions: " + call.Emissions + " - Model: " + call.Model + " - Date: " + call.DateTime);

}
export function wrappedGetCall(){
    return budg.getCalls();
}