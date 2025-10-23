// The module 'vscode' contains the VS Code extensibility API

// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';



// This method is called when your extension is activated

// Your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {
	//This creates the view
	const treeDataProvider = new MyTreeDataProvider();
	vscode.window.registerTreeDataProvider(
			'myPrimaryView',
			
			treeDataProvider
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