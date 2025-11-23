// The module 'vscode' contains the VS Code extensibility API

// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';
import * as https from 'https';

import { encoding_for_model } from "tiktoken";
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {
	var barManager = new statusBarManager();
	const treeDataProvider = new MyTreeDataProvider();
	//treeDataProvider.addMessage("AI happened");

	vscode.window.registerTreeDataProvider(
			'myPrimaryView',
			treeDataProvider
		);
	function convert(x:any){
		treeDataProvider.addMessage(String(x));
		return x;
	}

	function getTextAroundCursor(linesBefore: number = 150, linesAfter: number = 150): string{
		const editor = vscode.window.activeTextEditor;
		if (!editor){
			return "";//if document is empty
		} 
		const docu = editor.document;
		const cursorPos = editor.selection.active;
		const startLine = Math.max(0,cursorPos.line-linesBefore);
		const endLine = Math.min(docu.lineCount-1, cursorPos.line+linesAfter);

		const start = new vscode.Position(startLine, 0);
    	const end = new vscode.Position(endLine, docu.lineAt(endLine).text.length);
    	const range = new vscode.Range(start, end);
		return docu.getText(range);
	}

	//let lastInlineState = false;
	var accept = false;
	const disposables: vscode.Disposable[] = [];
	const aiCommands = [
		"editor.action.inlineSuggest.trigger",
		"github.copilot.generate",
		"cursor._executeCompletionItemProvider"
	];

	const inline = vscode.commands.registerCommand('vsCodeExt.wrappedInline', async () => {
		accept = true;
		vscode.window.showInformationMessage ("in wrapped inline"+String (accept)); //accept is never set to true
		await vscode.commands.executeCommand("editor.action.inlineSuggest.commit");
	});

	// const inlineChat = vscode.commands.registerCommand('vsCodeExt.wrappedInlineChat',async () =>{
	// 	accept = true;
	// 	await vscode.commands.executeCommand("inlineChat.start");
	// });
	//initial attempt at inline chat usage

	disposables.push(vscode.workspace.onDidChangeTextDocument(async evt => {
		const enc = await encoding_for_model("gpt-4o");

		if (accept){
			for (const change of evt.contentChanges){

				if (change.text.length>2){ //if its more than 2 character
					const tokens = enc.encode(change.text+getTextAroundCursor());
					convert(tokens.length);				
				}
			}
			accept = false;
		}
	}));
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
		barManager.updateBar(num,8);
		treeDataProvider.addMessage("Carbon Emissions level: "+num);

		//defines the default background
	});	
	context.subscriptions.push(input);
	context.subscriptions.push(inline);
	//context.subscriptions.push(inlineChat);

	//context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable);
	//This creates the view
}

// This method is called when your extension is deactivated

export function deactivate() {}
//
async function getCommand(commandName: string){
	vscode.window.showInformationMessage (`Command ${commandName} happend`);
}


class MyTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>{
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
	private items:vscode.TreeItem[] = []; //creates a list of tree items starts empty obviously

	constructor(){
		this.items.push(new vscode.TreeItem(
				"Emission Levels:", 
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

}
class statusBarManager{
	mainItem = vscode.window.createStatusBarItem(); //creates a status bar item for limit word
	loading: vscode.StatusBarItem[] = []; //creates a list of statusbar items for the loading bar items
	defaultColour:string = "statusBarItem.activeBackground";
	newColour:string;

	constructor(){
		this.newColour = this.defaultColour;
		this.mainItem.text = 'Limit:';
		this.mainItem.show();//displays the limit item

		// for (var i:number = 0;i<10;i++){
		// 	this.loading.push(vscode.window.createStatusBarItem());
		// 	this.loading[i].text = "-"; //fills the loading array with some items
		// 	this.loading[i].show(); //displays them
		// }

	}

	updateBar(input:number,limit:number){

		if (input){
			if (input >= limit){ //currently 8 represents the limit 
				this.newColour = "statusBarItem.errorBackground"; //if beyond the limit the loading bar goes red
				vscode.window.showInformationMessage('passed limit');
			}
			else{
				this.newColour = "statusBarItem.warningBackground"; //if not beyond the limit loading bar is yellow
				vscode.window.showInformationMessage('below limit');	
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