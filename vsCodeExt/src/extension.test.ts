import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

suite('Runtime Tests', () => {
    suite('CommandTests', () => {
        let allCommands: string[];
        let dynamics: any;

        setup(async () => {
            const ext = vscode.extensions.getExtension('development.ecode');
            dynamics = await ext?.activate();
            allCommands = await vscode.commands.getCommands(true);
        });

        test('All written commands execute without crashing', async () => {
            const stubInput = sinon.stub(vscode.window, 'showInputBox').resolves('50');
            const myExtensionCommands = allCommands.filter(cmd => cmd.startsWith('ecode.'));
            try {
                for (const command of myExtensionCommands) {
                    await vscode.commands.executeCommand(command);
                }
            } catch (error) {
                assert.fail(`Command failed to execute: ${error}`);
            } finally {
                stubInput.restore();
            }
            assert.ok(myExtensionCommands.length > 0, 'No extension commands found! Is the publisher name correct?');
        }).timeout(10000);
    });
});
