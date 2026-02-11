"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = __importStar(require("vscode"));
const sinon = __importStar(require("sinon"));
const state_1 = require("../state");
// suite('Extension Test Suite', () => {
// 	vscode.window.showInformationMessage('Start all tests.');
// 	test('Sample test', () => {
// 		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
// 		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
// 	});
// });
suite('CommandTests', () => {
    // gets all registered commands
    let allCommands;
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
                    assert.strictEqual(state_1.state.runningInterceptor, true, "Interceptor Not Running Correctly");
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
                }
                else {
                    await vscode.commands.executeCommand(command);
                }
            }
        }
        catch (error) {
            assert.fail(`Command failed to execute: ${error}`);
        }
        finally {
            stubInput.restore();
        }
        // ensures that there is a list of commands to check. Without this line then it would pass because checking nothing doesn't fail!
        assert.ok(myExtensionCommands.length > 0, "No extension commands found! Is the publisher name correct?");
    });
    // below test is for checking failed tests fail. They do!
    // test('missingCommand exists and runs', () => {
    // 	const found = allCommands.indexOf('ecode.missingCommand') > -1;
    // 	assert.strictEqual(found, true, 'Command was not registered!');
    // });
});
//# sourceMappingURL=extension.test.js.map