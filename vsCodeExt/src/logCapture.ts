import { error } from 'console';
import { resolve } from 'path';
import * as budget from './budget';
import * as vscode from 'vscode';


const modelPattern = /(?<=\[debug\] chat model )(.*)/g;
const testPattern = /a/g;

//regex to capture Claude model tokens with datetime
const claudePattern = /\d*-\d*-\d* \d*:\d*:\d*.\d*(?= \[trace\] \[messagesAPI\]SSE: {"delta":{"stop_reason")|(?<="stop_reason":"end_turn"(.*):{"cache_creation_input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*):{"cache_creation_input_tokens":(.*),"cache_read_input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*):{"cache_creation_input_tokens":(.*),"cache_read_input_tokens":(.*),"input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*):{"cache_creation_input_tokens":(.*),"cache_read_input_tokens":(.*),"input_tokens":(.*),"output_tokens":)(\d+)/g;

export function getLogFilePath(context: vscode.ExtensionContext) {
    return context.logUri.fsPath;
}

export async function identifyModel(rawLog: string): Promise<budget.Call[]> {
    var matches: budget.Call[] = [];
    console.log("FIRST FIRST MATCHES:\n", matches);
    var claudeFlag: boolean = false;
    var activeCall: budget.Call = { Emissions: 0, Model: "TEST", DateTime: 0 };
    const lines: string[] = rawLog.split(/\r?\n/);
    for (var line of lines) {
        //console.log(line);
        const match = line.match(modelPattern);
        if (claudeFlag) {
            const [time, result] = findClaude(line);
            if (result !== -1) { 
                activeCall.Emissions = result;
                activeCall.DateTime = time;
                claudeFlag = false;
                console.log("INIT MATCHES:\n", matches);
                matches.push(activeCall);
                var activeCall: budget.Call = { Emissions: 0, Model: "TEST", DateTime: 0 };
            }
        }

        if (match === null) {continue;}

        console.log(match[0]);
        switch (match[0]) {
            case 'claude-haiku-4.5':
                activeCall.Model = match[0];
                claudeFlag = true;
                break;
            case 'claude-opus-4.5':
                activeCall.Model = match[0];
                claudeFlag = true;
                break;
            case 'claude-opus-4.6':
                activeCall.Model = match[0];
                claudeFlag = true;
                break;
            case 'claude-sonnet-4':
                activeCall.Model = match[0];
                claudeFlag = true;
                break;
            case 'claude-sonnet-4.5':
                activeCall.Model = match[0];
                claudeFlag = true;
                break;
            default:
                console.log("Functionality coming soon!");
                break;
        }
        
    }
    console.log("FOUND MATCHES:\n", matches);
    return matches;
}

function findClaude(line: string): [number, number] {
    
    const match = line.match(claudePattern);  
    if (match !== null) {
        var result = 0;
        for (let i = 1; i < match.length; i++) {
            result += Number(match[i]);
        }
        console.log("C L A U D E T O K E N S !!");
        const timestamp: number = new Date(match[0]).getTime();
        console.log("Timestamp: ", timestamp);
        console.log(match);
        console.log(result);
        return [timestamp, result];
    }
    return [0, -1];
}