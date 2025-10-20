// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { stringify } from 'querystring';
import * as vscode from 'vscode';
import * as https from 'https';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const barManager = vscode.window.createStatusBarItem();
	barManager.text = 'Limit';
	barManager.show();
	
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

		const limit  = await vscode.window.showInputBox({
			prompt: 'enter your carbon limit',
			placeHolder:'eg. 5',
			ignoreFocusOut: true // keep input box open even if focus moves away from window
		});
		
		if (limit){
			barManager.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");
			barManager.text = '$(error) limit has been reached';
			vscode.window.showInformationMessage('satisfied ');
		}
		else{
			vscode.window.showInformationMessage('not satisfied!');

		}
		
	});
	
	context.subscriptions.push(input);

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
