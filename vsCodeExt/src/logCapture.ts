import { error } from 'console';
import { resolve } from 'path';
import * as budget from './budget';
import * as vscode from 'vscode';
import * as convert from './convert';


const modelPattern = /\[debug\] chat model /g;
const modelPattern2 = /^(.*)/g;
const testPattern = /a/g;

//regex to capture Claude model tokens with datetime
const claudeLine1 = / "stop_reason":null/g;
const claudePattern = /\d*-\d*-\d* \d*:\d*:\d*.\d*(?=(.*)"stop_reason":"end_turn")|(?<="stop_reason":"end_turn"(.*):{"cache_creation_input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*)"cache_read_input_tokens":)(\d+)|(?<=stop_reason":null(.*)"input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*)"output_tokens":)(\d+)/g;

export function getLogFilePath(context: vscode.ExtensionContext) {
    return context.logUri.fsPath;
}

export async function identifyModel(rawLog: string): Promise<budget.Call[]> {
    var matches: budget.Call[] = [];
    console.log("FIRST FIRST MATCHES:\n", matches);
    var claudeFlag: boolean = false;
    var activeCall: budget.Call = { Emissions: 0, Model: "TEST", DateTime: 0 };
    //var models = rawLog.match(modelPattern);
    //console.log(rawLog+"\n\n\n\n");
    const chunks:string[] = rawLog.split(modelPattern);
    if (chunks===null){
        console.log("no chunks?????????????????????????????");
    }
    for (var i = 0; i<chunks.length; i++){
        var models = chunks[i].match(modelPattern2);
        if (models!==null){
            var model = models[0];
            console.log("-----------------------------model found "+model);
            switch (model) { //rn this is obvs only working with the first model but we dont want that
                case 'claude-haiku-4.5':
                    activeCall.Model = model;
                    claudeFlag = true;
                    break;
                case 'claude-opus-4.5':
                    activeCall.Model = model;
                    claudeFlag = true;
                    break;
                case 'claude-opus-4.6':
                    activeCall.Model = model;
                    claudeFlag = true;
                    break;
                case 'claude-sonnet-4':
                    activeCall.Model = model;
                    claudeFlag = true;
                    break;
                case 'claude-sonnet-4.5':
                    activeCall.Model = model;
                    claudeFlag = true;
                    break;
                case 'claude-sonnet-4.6':
                    activeCall.Model = model;
                    claudeFlag = true;
                    break;
                default:
                    console.log("Functionality coming soon!");
                    break;
            }
        }
        if (claudeFlag){
            const [time, result] = findClaude(chunks[i]);
            if (result !== -1) { 
                activeCall.Emissions = convert.calculateEmission(activeCall.Model, result);
                activeCall.DateTime = time;
                claudeFlag = false;
                matches.push(activeCall);
                var activeCall: budget.Call = { Emissions: 0, Model: "TEST", DateTime: 0 };
            }
        }
        //put the rest of the matching mlarky here please
    }

    // var lines:string[];
    // if (claudeFlag){
    //     console.log("claude model found ----------------------------------");
    //     lines= rawLog.split(claudeLine1);}
    // else{lines= rawLog.split(/\r?\n/);}

    // for (var line of lines) {
    //     const match = line.match(modelPattern);
    //     console.log("--------------------------------matching"+match);
    //     if (claudeFlag) {
    //         const [time, result] = findClaude(line);
    //         if (result !== -1) { 
    //             activeCall.Emissions = convert.calculateEmission(activeCall.Model, result);
    //             activeCall.DateTime = time;
    //             claudeFlag = false;
    //             matches.push(activeCall);
    //             var activeCall: budget.Call = { Emissions: 0, Model: "TEST", DateTime: 0 };
    //         }
    //     }

    //     if (match === null) {continue;}

        
        
    // }
    console.log("FOUND MATCHES:\n", matches);
    return matches;
}

function findClaude(line: string): [number, number] {
    
    const match = line.match(claudePattern);  
    if (match !== null) {
        var result:number = Number(match[0]);
        for (let i = 2; i < match.length; i++) {
            result += Number(match[i]);
        }
        console.log("C L A U D E T O K E N S !!");
        var timestamp: number = new Date(match[1]).getTime();
        if (match[1] === '0') {timestamp = new Date().getTime();}
        console.log("Timestamp: ", timestamp);
        console.log(match);
        console.log(result);
        return [timestamp, result];
    }
    return [0, -1];
    }