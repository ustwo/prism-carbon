"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.bar = exports.tree = void 0;
exports.setDisplay = setDisplay;
exports.activate = activate;
exports.deactivate = deactivate;
exports.updateTree = updateTree;
const devTok = __importStar(require("./devTokens"));
const vscode = __importStar(require("vscode"));
const budget = __importStar(require("./budget"));
const dashboard_1 = require("./dashboard");
const state_1 = require("./state");
const proxyServer_1 = require("./proxyServer");
function setDisplay(t, b) {
    exports.tree = t;
    exports.bar = b;
}
let proxyServer;
const PROXY_PORT = 3024;
function activate(context) {
    var barManager = new statusBarManager();
    const treeDataProvider = new MyTreeDataProvider();
    vscode.window.registerTreeDataProvider('myPrimaryView', treeDataProvider);
    function convert(x) {
        //treeDataProvider.addMessage(String(x));
        return x;
    }
    devTok.getTextAroundCursor();
    //let lastInlineState = false;
    const disposables = [];
    setDisplay(treeDataProvider, barManager);
    vscode.window.registerTreeDataProvider('myPrimaryView', treeDataProvider);
    budget.initStorage(context.workspaceState);
    restoreCallHistory(treeDataProvider);
    barManager.updateLimit(budget.updateLimit());
    const BarManager = vscode.window.createStatusBarItem();
    disposables.push(vscode.workspace.onDidChangeTextDocument(async (evt) => {
        const tokens = Number(await devTok.change(evt));
        if (tokens !== -1) {
            var emissions = convert(tokens);
            treeDataProvider.addMessage("Call ID: xxxx - Emissions: " + emissions + ' g CO₂e');
            let date = new Date();
            var newCall = { Emissions: emissions, Model: "TEST", DateTime: date.toLocaleString() };
            updateTree(newCall);
        }
    }));
    const reset = vscode.commands.registerCommand('ecode.clearStore', () => {
        budget.resetBudget();
        treeDataProvider.clearTree();
        barManager.updateLimit(0);
        vscode.window.showInformationMessage('Past calls cleared.');
    });
    // Dashboard command 
    const dashboardCommand = vscode.commands.registerCommand('ecode.openDashboard', () => {
        dashboard_1.CarbonDashboardPanel.createOrShow(context.extensionUri);
        console.log('Carbon Dashboard command registered.');
    });
    const input = vscode.commands.registerCommand('ecode.inputdisplay', async () => {
        //vscode.window.showInformationMessage('Hello World from EstimatingCarbon!');
        const limit = await vscode.window.showInputBox({
            prompt: 'Enter test call: ',
            placeHolder: 'eg. 5',
            ignoreFocusOut: true // keep input box open even if focus moves away from window
        });
        var num = Number(limit);
        if (!Number.isNaN(num)) {
            let date = new Date();
            var newCall = { Emissions: num, Model: "TEST", DateTime: date.toLocaleString() };
            updateTree(newCall);
        }
        else {
            vscode.window.showInformationMessage('Error: NaN inputted.');
        }
    });
    context.subscriptions.push(input);
    context.subscriptions.push(devTok.inline);
    context.subscriptions.push(dashboardCommand);
    console.log('Interceptor Proxy Server is active');
    let startDisposable = vscode.commands.registerCommand('HIDDENecode.interceptorStart', async () => {
        try {
            // start local server
            proxyServer = new proxyServer_1.InterceptorProxy(PROXY_PORT);
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
            state_1.state.runningInterceptor = true;
            vscode.window.showInformationMessage('Interceptor Proxy started on port ' + PROXY_PORT);
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to start Interceptor Proxy: ' + error);
        }
    });
    let stopDisposable = vscode.commands.registerCommand('HIDDENecode.interceptorStop', async () => {
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
    let terminalDisposable = vscode.commands.registerCommand('HIDDENecode.interceptorOpenTerminal', async () => {
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
}
async function deactivate() {
    // make sure that the vscode isn't always vulnerable, disable configurations
    if (proxyServer) {
        await proxyServer.stop();
    }
    const config = vscode.workspace.getConfiguration('http');
    await config.update('proxy', undefined, vscode.ConfigurationTarget.Global);
    await config.update('proxyStrictSSL', undefined, vscode.ConfigurationTarget.Global);
}
class MyTreeDataProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    items = []; //creates a list of tree items starts empty obviously
    constructor() {
        this.items.push(new vscode.TreeItem("Latest calls:", vscode.TreeItemCollapsibleState.None)); //initialises the messages with one title message     
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        //If an element is passed it means we are getting children of a sub-item --> no nested items here so empty array returned
        if (element) {
            return Promise.resolve([]);
        }
        else {
            //Here a top-level item will be created which will be where the message will be displayed           
            return Promise.resolve(this.items);
        }
    }
    addMessage(message) {
        this.items.push(new vscode.TreeItem(//adds a new item to the side bar
        message, vscode.TreeItemCollapsibleState.None));
        this._onDidChangeTreeData.fire(); //refreshes the sidebar
    }
    clearTree() {
        this.items = [];
        this._onDidChangeTreeData.fire();
    }
}
class statusBarManager {
    mainItem = vscode.window.createStatusBarItem(); //creates a status bar item for limit word
    loading = []; //creates a list of statusbar items for the loading bar items
    defaultColour = "statusBarItem.activeBackground";
    newColour;
    constructor() {
        this.newColour = this.defaultColour;
        this.mainItem.text = 'Average carbon cost: g CO₂e';
        this.mainItem.show(); //displays the limit item
        // for (var i:number = 0;i<10;i++){
        //  this.loading.push(vscode.window.createStatusBarItem());
        //  this.loading[i].text = "-"; //fills the loading array with some items
        //  this.loading[i].show(); //displays them
        // }
    }
    updateLimit(input) {
        this.mainItem.text = 'Average carbon cost: ' + input + ' g CO₂e';
        this.newColour = "statusBarItem.activeBackground";
    }
    updateBar(input, limit) {
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
            var i = 0;
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
function restoreCallHistory(tree) {
    var pCalls = budget.getCalls();
    console.log("CALLS:", pCalls);
    for (let i = 0; i < pCalls.length; i++) {
        tree.addMessage("Emissions: " + pCalls[i].Emissions + " - Model: " + pCalls[i].Model + " - Date: " + pCalls[i].DateTime);
    }
}
function updateTree(call) {
    budget.storeCall(call);
    var cLimit = budget.updateLimit();
    console.log("limit: " + cLimit);
    exports.bar.updateBar(call.Emissions, cLimit);
    exports.tree.addMessage("Emissions: " + call.Emissions + " - Model: " + call.Model + " - Date: " + call.DateTime);
}
//# sourceMappingURL=extension.js.map