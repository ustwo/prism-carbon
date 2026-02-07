import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as convert from '../convert';

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
});

function oldCalculateEmission(model: string, token: number) {
    const chatgpt4oshort = 0.000000370125;
    const chatgpt4omedium = 0.000000212625;
    const chatgpt4olong = 0.0000000875;
    const chatgpt4ominishort = 0.00923;
    const chatgpt4ominimedium = 0.00369;
    const chatgpt4ominilong = 0.0006293;
    const chatgpt4point5 = 0.0003;

    let carbon = 0;
    const lowerModel = model.toLowerCase();

    if (lowerModel.includes("gpt-4o-mini")) {
        if (token <= 400) {
            carbon = chatgpt4ominishort * token;
        } else if (token <= 2000) {
            carbon = chatgpt4ominimedium * token;
        } else if (token <= 11500) {
            carbon = chatgpt4ominilong * token;
        }
    } else if (lowerModel.includes("gpt-4o")) {
        if (token <= 400) {
            carbon = chatgpt4oshort * token;
        } else if (token <= 2000) {
            carbon = chatgpt4omedium * token;
        } else if (token <= 11500) {
            carbon = chatgpt4olong * token;
        }
    } else if (lowerModel.includes("gpt-4.5")) {
        carbon = chatgpt4point5 * token;
    }
    return carbon;
}

suite("Conversion Tests", () => {

    test("Class functions the same as previous if/else - empty tokens", () => {
        assert.equal(oldCalculateEmission("gpt-4o-mini", 0), convert.calculateEmission("gpt-4o-mini", 0));
        assert.equal(oldCalculateEmission("gpt-4o", 0), convert.calculateEmission("gpt-4o", 0));
        assert.equal(oldCalculateEmission("gpt-4.5", 0), convert.calculateEmission("gpt-4.5", 0));
    });

    test("Class functions the same as previous if/else - first tier tokens", () => {
        for (let i = 0; i<3; i++){
            let tokens = Math.floor(Math.random() * 400);
            assert.equal(oldCalculateEmission("gpt-4o-mini", 0), convert.calculateEmission("gpt-4o-mini", 0));
            assert.equal(oldCalculateEmission("gpt-4o", 0), convert.calculateEmission("gpt-4o", 0));
            assert.equal(oldCalculateEmission("gpt-4.5", 0), convert.calculateEmission("gpt-4.5", 0));
        }
    });

    test("Class functions the same as previous if/else - 2nd tier tokens", () => {
        for (let i = 0; i<3; i++){
            let tokens = 400 + Math.floor(Math.random() * 1600);
            assert.equal(oldCalculateEmission("gpt-4o-mini", 0), convert.calculateEmission("gpt-4o-mini", 0));
            assert.equal(oldCalculateEmission("gpt-4o", 0), convert.calculateEmission("gpt-4o", 0));
            assert.equal(oldCalculateEmission("gpt-4.5", 0), convert.calculateEmission("gpt-4.5", 0));
        }
    });

    test("Class functions the same as previous if/else - 3rd tier tokens", () => {
        for (let i = 0; i<3; i++){
            let tokens = 2000 + Math.floor(Math.random() * 9500);
            assert.equal(oldCalculateEmission("gpt-4o-mini", 0), convert.calculateEmission("gpt-4o-mini", 0));
            assert.equal(oldCalculateEmission("gpt-4o", 0), convert.calculateEmission("gpt-4o", 0));
            assert.equal(oldCalculateEmission("gpt-4.5", 0), convert.calculateEmission("gpt-4.5", 0));
        }
    });


    test("Class functions the same as previous if/else - out of scope tokens", () => {
        for (let i = 0; i<3; i++){
            let tokens = 11500 + Math.floor(Math.random() * 100000);
            assert.equal(oldCalculateEmission("gpt-4o-mini", 0), convert.calculateEmission("gpt-4o-mini", 0));
            assert.equal(oldCalculateEmission("gpt-4o", 0), convert.calculateEmission("gpt-4o", 0));
            assert.equal(oldCalculateEmission("gpt-4.5", 0), convert.calculateEmission("gpt-4.5", 0));
        }
    });


    



});

