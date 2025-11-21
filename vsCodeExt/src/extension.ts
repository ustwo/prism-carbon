// The module 'vscode' contains the VS Code extensibility API

// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';
import * as https from 'https';
import * as budget from './budget';
import { Memento } from "vscode";
import { stringify } from 'querystring';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {
	var barManager = new statusBarManager();
	const treeDataProvider = new MyTreeDataProvider();
	
	vscode.window.registerTreeDataProvider(
			'myPrimaryView',
			treeDataProvider
		);

	budget.initStorage(context.workspaceState);
	restoreCallHistory(treeDataProvider);
	barManager.updateLimit(budget.updateLimit());
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vsCodeExt" is now active!');
	const BarManager = vscode.window.createStatusBarItem();

	const disposableAPIKEY = vscode.commands.registerCommand('vsCodeExt.setApiKey', async () => {
		const apiKey = await vscode.window.showInputBox({
			prompt: 'Enter your API Key',
			placeHolder: 'e.g.   sk - xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
			ignoreFocusOut: true // keep input box open even if focus moves away from window

		});
		if (apiKey){
			await context.secrets.store('myApiKey', apiKey); // securely stores apikey using key 'myApiKey'
			
			// to retrieve key from secret store, use:   const apiKey = await context.secrets.get('myApiKey');

			vscode.window.showInformationMessage('API Key successfully set!');
		}
		else {
            vscode.window.showWarningMessage('API Key setting cancelled.');
		}
	});

	context.subscriptions.push(disposableAPIKEY);


	//1. Wait and listen for an API call to be made to gemini / openAI

	//2. Determine model used by looking at API call

	//3. Send usage request to correct API usage endpoint using correct API key

	//4. Find Tokens and calculate costs




	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('vsCodeExt.helloWorld', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		vscode.window.showInformationMessage('Hello World from EstimatingCarbon!');
		
	});

	const reset = vscode.commands.registerCommand('vsCodeExt.clearStore', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		budget.resetBudget();
		treeDataProvider.clearTree();
		barManager.updateLimit(0);
		vscode.window.showInformationMessage('Past calls cleared.');
	});
	const input = vscode.commands.registerCommand('vsCodeExt.inputdisplay', async ()=> {
		//vscode.window.showInformationMessage('Hello World from EstimatingCarbon!');
		const limit  = await vscode.window.showInputBox({ //opens an input box currently representing the carbon footprint
			prompt: 'Enter test call: ',
			placeHolder:'eg. 5',
			ignoreFocusOut: true // keep input box open even if focus moves away from window
		});

		
		var num = Number(limit);
		if (!Number.isNaN(num)) {
			var newCall: budget.Call = {Emissions: num};
			budget.storeCall(newCall); 
			var cLimit = budget.updateLimit();
			console.log("limit: " + cLimit);
		
			barManager.updateBar(num,cLimit);
			treeDataProvider.addMessage("Call ID: xxxx - Emissions: " + num + ' g CO₂e');
		}
		else {
			vscode.window.showInformationMessage('Error: NaN inputted.');
		}


		//defines the default background
	});	
	context.subscriptions.push(input);

	context.subscriptions.push(disposable);
	//This creates the view
}

// This method is called when your extension is deactivated

export function deactivate() {}
//
class MyTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>{
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
	private items:vscode.TreeItem[] = []; //creates a list of tree items starts empty obviously

	constructor(){
		this.items.push(new vscode.TreeItem(
				"Latest calls:", 
				vscode.TreeItemCollapsibleState.None)); //initialises the messages with one title message		
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem{
		return element;
	}
	getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]>{
		//If an element is passed it means we are getting children of a sub-item --> no nested items here so empty array returned
		if(element){
			return Promise.resolve([]);
		}else{
			//Here a top-level item will be created which will be where the message will be displayed			
			return Promise.resolve(this.items);
		}
	}
	addMessage(message:string){ //method which allows messaged to be added
		this.items.push( new vscode.TreeItem( //adds a new item to the side bar
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
class statusBarManager{
	mainItem = vscode.window.createStatusBarItem(); //creates a status bar item for limit word
	loading: vscode.StatusBarItem[] = []; //creates a list of statusbar items for the loading bar items
	defaultColour:string = "statusBarItem.activeBackground";
	newColour:string;

	constructor(){
		this.newColour = this.defaultColour;
		this.mainItem.text = 'Average carbon cost: g CO₂e';
		this.mainItem.show();//displays the limit item

		// for (var i:number = 0;i<10;i++){
		// 	this.loading.push(vscode.window.createStatusBarItem());
		// 	this.loading[i].text = "-"; //fills the loading array with some items
		// 	this.loading[i].show(); //displays them
		// }

	}

	updateLimit(input:number) {
		this.mainItem.text = 'Average carbon cost: ' + input + ' g CO₂e';
		this.newColour = "statusBarItem.activeBackground";
	}

	updateBar(input:number,limit:number){

		if (input){
			this.mainItem.text = 'Average carbon cost: ' + limit + ' g CO₂e';
			if (input >= 3 * limit){ //currently 8 represents the limit 
				this.newColour = "statusBarItem.errorBackground"; //if well beyond the limit the loading bar goes red
				vscode.window.showInformationMessage('VERY high carbon AI call made (check pane for details)');
			}
			else if (input >= 1.5 * limit) {
				this.newColour = "statusBarItem.warningBackground"; //if beyond the limit the loading bar goes yellow
				vscode.window.showInformationMessage('High carbon AI call made (check pane for details)');
			}
			else{
				this.newColour = "statusBarItem.activeBackground"; //if not beyond the limit loading bar is clear
				//vscode.window.showInformationMessage('below limit');	
			}
			var i:number = 0;
		}
		else{
			this.newColour = "statusBarItem.activeBackground";
			input = 0;
			vscode.window.showInformationMessage('not satisfied!');
		}
		// for(i = 0;i<Math.max(input);i++){ //populates the loading bar
		// 	this.loading[i].backgroundColor = new vscode.ThemeColor(this.newColour);
		// 	}
		// for(i;i<this.loading.length;i++){
		// 	this.loading[i].backgroundColor = new vscode.ThemeColor("statusBarItem.activeBackground");
		// 	}

		this.mainItem.backgroundColor = new vscode.ThemeColor(this.newColour); //colours the word "loading"
	}
}

function restoreCallHistory(tree: MyTreeDataProvider) { //restores past calls to sidebar
	var pCalls = budget.getCalls();
	console.log("CALLS:", pCalls);
	for (let i = 0; i < pCalls.length; i++) {
		tree.addMessage("Call ID: xxxx - Emissions: " + pCalls[i].Emissions + ' g CO₂e');
	}
}

