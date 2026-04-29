import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as budget from '../budget';
import * as logCap from '../logCapture'; 
import path from 'path';
import fs from 'fs';
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

				} else { await vscode.commands.executeCommand(command); }
				console.log(`Successfully Ran Test ${command}`);
			}
		} catch (error) {
			assert.fail(`Command failed to execute: ${error}`);
		}
		finally {
			stubInput.restore();
		}
		// ensures that there is a list of commands to check. Without this line then it would pass because checking nothing doesn't fail!
		assert.ok(myExtensionCommands.length > 0, "No extension commands found! Is the publisher name correct?");
	}).timeout(10000);
	// below test is for checking failed tests fail. They do!

});

suite("UI Tests", () => {

});

suite("RunTime Tests", () => {

});

suite("DevTime Tests", () => {
	let ext: any;
	var budge: budget.budget;
	setup(async () => {
		ext = vscode.extensions.getExtension('development.ecode');
		assert.ok(ext);

		const exports = await ext.activate();// Ensure the extension is actually running
		budge = exports.budg;
		assert.ok(budge);
	});

	test('Copy and Paste tests', async () => {

		var pCalls = budge.getCalls();
		const doc = await vscode.workspace.openTextDocument({ content: " " });
		await vscode.window.showTextDocument(doc);
		await vscode.commands.executeCommand('type', { text: "HELLO" });
		var pCalls2 = budge.getCalls();

		assert.strictEqual(pCalls.length, pCalls2.length);

	});
	const text1: string = "2026-02-24 13:18:53.420 [info] ccreq:5fc48f67.copilotmd | success | gpt-4o-mini-2024-07-18 | 1652ms | [progressMessages]\n2026-02-24 13:18:53.758 [info] ccreq:7ebff8b3.copilotmd | success | claude-haiku-4.5 -> claude-haiku-4-5-20251001 | 1307ms | [inline/generate]";
	const text2: string = "2026-02-24 13:18:53.420 [info] ccreq:5fc48f67.copilotmd | success | gpt-4o-mini-2024-07-18 | 1652ms | [progressMessages]\n2026-02-24 13:18:53.420 [trace] [InlineChatProgressMessages] Fetched 10 messages for generate\n2026-02-24 13:18:53.727 [trace] [messagesAPI]SSE: {\"delta\":{\"text\":\"python\nprint(\"Hello, World!\")\",\"type\":\"text_delta\"},\"index\":0,\"type\":\"content_block_delta\"}2026-02-24 13:18:53.728 [trace] [messagesAPI]SSE: {\"delta\":{\"text\":\"\n```\",\"type\":\"text_delta\"},\"index\":0,\"type\":\"content_block_delta\"}\n2026-02-24 13:18:53.728 [trace] [messagesAPI]SSE: {\"index\":0,\"type\":\"content_block_stop\"}\n2026-02-24 13:18:53.728 [trace] [messagesAPI]SSE: {\"delta\":{\"stop_reason\":\"end_turn\",\"stop_sequence\":null},\"type\":\"message_delta\",\"usage\":{\"output_tokens\":14}}\n2026-02-24 13:18:53.745 [trace] [messagesAPI]SSE: {\"type\":\"message_stop\"}\n2026-02-24 13:18:53.745 [info] [messagesAPI] message 0 returned. finish reason: [stop]\n2026-02-24 13:18:53.754 [trace] [messagesAPI]SSE: [DONE]\n2026-02-24 13:18:53.758 [info] ccreq:7ebff8b3.copilotmd | success | claude-haiku-4.5 -> claude-haiku-4-5-20251001 | 1307ms | [inline/generate]";
	const text3: string = '2026-02-24 23:50:49.607 [trace] [messagesAPI]SSE: {"message":{"content":[],"id":"msg_bdrk_01Sn2aTmHjfYjxerCNx3ABR7","model":"claude-sonnet-4-5-20250929","role":"assistant","stop_reason":null,"stop_sequence":null,"type":"message","usage":{"cache_creation":{"ephemeral_1h_input_tokens":0,"ephemeral_5m_input_tokens":865},"cache_creation_input_tokens":865,"cache_read_input_tokens":8820,"input_tokens":8,"output_tokens":8}},"type":"message_start"} \n 2026-02-24 23:50:49.607 [trace] [messagesAPI]SSE: {"delta":{"thinking":"d request for","type":"thinking_delta"},"index":0,"type":"content_block_delta"}\n{"delta":{"stop_reason":"end_turn","stop_sequence":null},"type":"message_delta","usage":{"cache_creation_input_tokens":865,"cache_read_input_tokens":8820,"input_tokens":8,"output_tokens":373}}';
	const text4 = fs.readFileSync(path.join(__dirname, '../../src/test/testLogFile.txt'), 'utf-8');


	test("Regex Model test", async () => {
		var matches = text2.match(logCap.modelPattern);
		assert.notEqual(matches, null);
		assert.strictEqual(matches?.length, 2);
		assert.strictEqual(matches[0], "gpt-4o-mini-2024-07-18");
		assert.strictEqual(matches[1], "claude-haiku-4.5");
	}); //tests the correct model si picked up

	test("Regex Claude Chat Token test", async () => {
		var matches = text3.match(logCap.claudePattern);
		assert.notEqual(matches, null);
		assert.strictEqual(matches?.length, 5);

	});//tests correct tokens are caught for new Claude models

	test("Regex Newer GPT Model Token test", async () =>{
		const content:String = '"usage":{"input_tokens":14785,"input_tokens_details":{"cached_tokens":6784},"output_tokens":54,"output_tokens_details":{"reasoning_tokens":0},"total_tokens":14839},"user":null},"sequence_number":53,"type":"response.completed"}\n2026-03-13 13:15:26.427 [info] ccreq:79439032.copilotmd | success | gpt-5.2-codex | 3010ms | [panel/editAgent]\n2026-03-13 13:15:26.518 [info] [ToolCallingLoop] Stop hook result: shouldContinue=false, reasons=undefined\n2026-03-13 13:15:26.538 [trace] Resolving chat model';
		const matches = content.match(logCap.GPT5Pattern);
		const real: string[] = ["14785","6784","54","0","2026-03-13 13:15:26.518","shouldContinue=false"];
		assert.notEqual(matches,null);
		assert.strictEqual(matches?.length,6);
		for (let i = 0; i < Math.min(real.length - 1, matches?.length - 1); i++) {
			assert.strictEqual(matches[i], real[i]);
		}

	}); //tests correct tokens are caught for new GPT models

	test("Testing the findModel function",async () =>{
		assert.deepEqual(logCap.findModel(text4,logCap.claudePattern,"}}")[1], [24022]);
	}); //tests that findmodel function returns the correct total tokens
	test("Testing find model gracefully handles null", async () =>{
		assert.deepEqual(logCap.findModel("NomodelHERE",logCap.claudePattern,"}}"), [[0],[-1]]);
	});
	test("Identify Model function",async () =>{
		const expectedTime = new Date("2026-04-29T00:55:36.156Z").getTime()
		var call: budget.Call = { Emissions: 10.1112, Model: 'claude-haiku-4.5', DateTime: expectedTime};//resets the call
		const result = await logCap.identifyModel(text4);
		assert.deepEqual(result,[call]);
	}); //tests the final resultant call is accurate

});

suite("Conversion Tests", () => {

});

