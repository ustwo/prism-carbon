import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as extension from '../extension';
import { isFunctionDeclaration } from 'typescript';
import * as sinon from 'sinon';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
});

suite('CommandTests', () => {
	// gets all registered commands
	let allCommands: string[];
	setup(async () => {
		// WHEN PUBLISHING, CHANGE PUBLISHER FIELD IN PACKAGE.JSON AND ALSO REPLACE 'development'
		// IN LINE BELOW WITH NEW PUBLISHER NAME.
		const ext = vscode.extensions.getExtension('development.vsCodeExt');
		await ext?.activate(); // Ensure the extension is actually running
		allCommands = await vscode.commands.getCommands(true);
	});




	test('clearStore exists and runs', () => {
		const found = allCommands.indexOf('vsCodeExt.clearStore') > -1;
		assert.strictEqual(found, true, 'Command was not registered!');
	});

	test('inputdisplay exists and runs', () => {
		const found = allCommands.indexOf('vsCodeExt.inputdisplay') > -1;
		assert.strictEqual(found, true, 'Command was not registered!');
	});
	test('openDashboard exists and runs', () => {
		const found = allCommands.indexOf('vsCodeExt.openDashboard') > -1;
		assert.strictEqual(found, true, 'Command was not registered!');
	});

	test('All written commands execute without crashing', async () => {
		const stubInput = sinon.stub(vscode.window, 'showInputBox').resolves('50');
		const myExtensionCommands = allCommands.filter(cmd => cmd.startsWith('vsCodeExt.'));
		try {
			for (const command of myExtensionCommands) {
				console.log(`Running: ${command}`);

				await vscode.commands.executeCommand(command);
			}
		} catch (error) {
			assert.fail(`Command failed to execute: ${error}`);
		}
		finally {
			stubInput.restore();
		}
	});
	// below test is for checking failed tests fail. They do!

	// test('missingCommand exists and runs', () => {
	// 	const found = allCommands.indexOf('vsCodeExt.missingCommand') > -1;

	// 	assert.strictEqual(found, true, 'Command was not registered!');
	// });
});

