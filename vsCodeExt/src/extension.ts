// The module 'vscode' contains the VS Code extensibility API

// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';



// This method is called when your extension is activated

// Your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {
	//This creates the view
	vscode.window.registerTreeDataProvider(
			'myPrimaryView',
			new MyTreeDataProvider()
		);

}



// This method is called when your extension is deactivated

export function deactivate() {}
//
class MyTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>{
	getTreeItem(element: vscode.TreeItem): vscode.TreeItem{
		return element;
	}
	getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]>{
		//If an element is passed it means we are getting children of a sub-item --> no nested items here so empty array returned
		if(element){
			return Promise.resolve([]);
		}

		
	}
}