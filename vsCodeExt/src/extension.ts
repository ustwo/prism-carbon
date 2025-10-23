// The module 'vscode' contains the VS Code extensibility API

// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';
import * as https from 'https';

// This method is called when your extension is activated

// Your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {
	const barManager = vscode.window.createStatusBarItem(); //creates a status bar item for limit word
	const loading: vscode.StatusBarItem[] = []; //creates a list of statusbar items for the loading bar items
	barManager.text = 'Limit:';
	barManager.show();//displays the limit item

	for (var i:number = 0;i<10;i++){
		loading.push(vscode.window.createStatusBarItem());
		loading[i].text = "-"; //fills the loading array with some items
		loading[i].show(); //displays them
	}
	context.subscriptions.push(barManager);
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vsCodeExt" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('vsCodeExt.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from EstimatingCarbon!');
		
	});

	const input = vscode.commands.registerCommand('vsCodeExt.inputdisplay', async ()=> {
		//vscode.window.showInformationMessage('Hello World from EstimatingCarbon!');
		const limit  = await vscode.window.showInputBox({ //opens an input box currently representing the carbon footprint
			prompt: 'enter your carbon limit',
			placeHolder:'eg. 5',
			ignoreFocusOut: true // keep input box open even if focus moves away from window
		});

		var num = Number(limit); 
		var colour = "statusBarItem.activeBackground"; 
		//defines the default background
		
		if (num){
			if (num >= 8){ //currently 8 represents the limit 
				colour = "statusBarItem.errorBackground"; //if beyond the limit the loading bar goes red
				vscode.window.showInformationMessage('passed limit');
			}
			else{
				colour = "statusBarItem.warningBackground"; //if not beyond the limit loading bar is yellow
				vscode.window.showInformationMessage('below limit');	
			}
			var i:number = 0;
			vscode.window.showInformationMessage(colour);
		}
		else{
			colour = "statusBarItem.activeBackground";
			num = 0;
			vscode.window.showInformationMessage('not satisfied!');
		}
		for(i = 0;i<num;i++){ //populates the loading bar
			loading[i].backgroundColor = new vscode.ThemeColor(colour);
			}
		for(i;i<loading.length;i++){
			loading[i].backgroundColor = new vscode.ThemeColor("statusBarItem.activeBackground");
			}

		barManager.backgroundColor = new vscode.ThemeColor(colour); //colours the word "loading"

	});
	
	
	context.subscriptions.push(input);

	context.subscriptions.push(disposable);
}
	//This creates the view
	const treeDataProvider = new MyTreeDataProvider();
	vscode.window.registerTreeDataProvider(
			'myPrimaryView',
			
			new MyTreeDataProvider()
		);

}



// This method is called when your extension is deactivated

export function deactivate() {}
//
class MyTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>{
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem{
		return element;
	}
	getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]>{
		//If an element is passed it means we are getting children of a sub-item --> no nested items here so empty array returned
		if(element){
			return Promise.resolve([]);
		}else{
			//Here a top-level item will be created which will be where the message will be displayed
			const infoMessage = new vscode.TreeItem(
				"Here you will be able to track tokens and carbon emission", 
				vscode.TreeItemCollapsibleState.None
			);
			
			return Promise.resolve([infoMessage]);
		}

		
	}
}