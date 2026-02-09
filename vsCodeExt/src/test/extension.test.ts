import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as extension from '../extension';
import { isFunctionDeclaration } from 'typescript';
import * as sinon from 'sinon';
import * as budget from '../budget';
import { Memento } from "vscode";
import { wrappedGetCall } from '../extension';

import { state } from '../state';


// suite('Extension Test Suite', () => {
// 	vscode.window.showInformationMessage('Start all tests.');

// 	test('Sample test', () => {
// 		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
// 		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
// 	});
// });

suite('CommandTests', () => {
	// gets all registered commands
	let allCommands: string[];
	setup(async () => {
		// WHEN PUBLISHING, CHANGE PUBLISHER FIELD IN PACKAGE.JSON AND ALSO REPLACE 'development'
		// IN LINE BELOW WITH NEW PUBLISHER NAME.
		const ext = vscode.extensions.getExtension('development.ecode');
		await ext?.activate(); // Ensure the extension is actually running
		allCommands = await vscode.commands.getCommands(true);
	});

	// test('clearStore exists and runs', () => {
	// 	const found = allCommands.indexOf('ecode.clearStore') > -1;
	// 	assert.strictEqual(found, true, 'Command was not registered!');
	// });

	// test('inputdisplay exists and runs', () => {
	// 	const found = allCommands.indexOf('ecode.inputdisplay') > -1;
	// 	assert.strictEqual(found, true, 'Command was not registered!');
	// });
	// test('openDashboard exists and runs', () => {
	// 	const found = allCommands.indexOf('ecode.openDashboard') > -1;
	// 	assert.strictEqual(found, true, 'Command was not registered!');
	// });

	test('All written commands execute without crashing', async () => {
		const stubInput = sinon.stub(vscode.window, 'showInputBox').resolves('50');
		const myExtensionCommands = allCommands.filter(cmd => cmd.startsWith('ecode.'));
		try {
			for (const command of myExtensionCommands) {
				console.log(`Running: ${command}`);
				if (command === "ecode.interceptorStart") {

					vscode.commands.executeCommand(command);
					await new Promise(res => setTimeout(res, 500));

					assert.strictEqual(state.runningInterceptor, true, "Interceptor Not Running Correctly");
					// if (command.includes("ecode.interceptor")) {
					// 	await Promise.race([
					// 		vscode.commands.executeCommand(command),
					// 		new Promise((_, reject) => setTimeout(() => reject("Timeout Reached"), 1500))
					// 	]).catch(err => {
					// 		if (err !== "Timeout Reached") {
					// 			throw err;
					// 		}
					// 		console.log("Interceptor is running in the background - it started correctly");
					// 		// assert.equal(extension.runningInterceptor, true, "Interceptor Not Running Correctly");
					// 	});
				} else {
					await vscode.commands.executeCommand(command);
				}

			}
		} catch (error) {
			assert.fail(`Command failed to execute: ${error}`);
		}
		finally {
			stubInput.restore();
		}
		// ensures that there is a list of commands to check. Without this line then it would pass because checking nothing doesn't fail!
		assert.ok(myExtensionCommands.length > 0, "No extension commands found! Is the publisher name correct?");
	});
	// below test is for checking failed tests fail. They do!

	// test('missing1Command exists and runs', () => {
	// 	const found = allCommands.indexOf('ecode.missingCommand') > -1;

	// 	assert.strictEqual(found, true, 'Command was not registered!');
	// });
	
});
suite('devtime', ()=>{
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

