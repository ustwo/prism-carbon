import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as budget from '../budget';
import { Memento } from "vscode";
import { wrappedGetCall } from '../extension';

import { state } from '../state';
import { appendFile } from 'fs';


suite('CommandTests', () => {
	// gets all registered commands
	let allCommands: string[];
	let dynamics: any;
	setup(async () => {
		// WHEN PUBLISHING, CHANGE PUBLISHER FIELD IN PACKAGE.JSON AND ALSO REPLACE 'development'
		// IN LINE BELOW WITH NEW PUBLISHER NAME.
		const ext = vscode.extensions.getExtension("development.ecode");
		dynamics = await ext?.activate();// Ensure the extension is actually running
		allCommands = await vscode.commands.getCommands(true);
	});
	test("All written commands execute without crashing", async () => {
		const stubInput = sinon.stub(vscode.window, 'showInputBox').resolves("50");
		const myExtensionCommands = allCommands.filter(cmd => cmd.startsWith('ecode.'));
		try {
			for (const command of myExtensionCommands) {
				console.log(`Running: ${command}`);
				if (command === "ecode.interceptorStart") {

					await vscode.commands.executeCommand(command);
					await new Promise(res => setTimeout(res, 500));
					const status = dynamics.isInterceptorRunning();
					assert.strictEqual(status, true, "Interceptor Not Running Correctly");
				} else {vscode.commands.executeCommand(command);}
				console.log(`Successfully Ran Test ${command}`);
			}
		} catch (error) {
			assert.fail("Command failed to execute: ${error}");
		}
		finally {
			stubInput.restore();
		}
		// ensures that there is a list of commands to check. Without this line then it would pass because checking nothing doesn't fail!
		assert.ok(myExtensionCommands.length > 0, "No extension commands found! Is the publisher name correct?");
	}).timeout(10000);
	// below test is for checking failed tests fail. They do!
	
});
suite('Dev Time', ()=>{
	let ext:any;
	var budge:budget.budget;
	setup(async () => {
		ext = vscode.extensions.getExtension('development.ecode');
		assert.ok(ext);
		
		const exports = await ext.activate();// Ensure the extension is actually running
		budge = exports.budg;
		assert.ok(budge);
	});

	test ('Copy and Paste tests', async () =>{

		var pCalls = budge.getCalls();
		const doc = await vscode.workspace.openTextDocument({content:" "});			
		await vscode.window.showTextDocument(doc);
		await vscode.commands.executeCommand('type', { text: "HELLO" });
		var pCalls2 = budge.getCalls();

		assert.strictEqual(pCalls.length,pCalls2.length);
	
	});	
});

suite("UI Tests", () => {

});

suite("RunTime Tests", () => {

});

suite("Conversion Tests", () => {

});

