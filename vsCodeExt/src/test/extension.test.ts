import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as extension from '../extension';
import { isFunctionDeclaration } from 'typescript';
import * as sinon from 'sinon';
import { state } from '../state';
import { appendFile } from 'fs';


// suite('Extension Test Suite', () => {
// 	vscode.window.showInformationMessage('Start all tests.');

// 	test('Sample test', () => {
// 		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
// 		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
// 	});
// });

suite("CommandTests", () => {
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
				console.log("Running: ${command}");
				if (command === "ecode.interceptorStart") {

					await vscode.commands.executeCommand(command);
					await new Promise(res => setTimeout(res, 500));
					const status = dynamics.isInterceptorRunning();
					assert.strictEqual(status, true, "Interceptor Not Running Correctly");
					console.log("Interceptor is running in the background - it started correctly");
				} else {
					console.log("ELSE" + dynamics.isInterceptorRunning());
				}

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
});

suite("UI Tests", () => {
		
});

suite("RunTime Tests", () => {

});

suite("DevTime Tests", () => {

});

suite("Conversion Tests", () => {

});

