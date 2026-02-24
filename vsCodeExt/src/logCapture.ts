import { error } from 'console';
import { resolve } from 'path';
import * as budget from './budget';
import * as vscode from 'vscode';
import * as convert from './convert';


const modelPattern = /(?<=\[info\].*copilotmd \| success \| .* \| \d+ms \| \[.*)]/g;
///\[debug\] chat model /g;

const modelPattern3 = /\s\S*$/g; //gets the purpose of the call
const modelPattern2 = /(?<= \| success \| )\S*/g;
///^(.*)/g; gets first character for the other break point
const testPattern = /a/g;
//new split regex
//based on model and job change the token regex


//regex to capture Claude model tokens with datetime
const claudeLine1 = / "stop_reason":null/g;
const inlineClaudePattern = /\d*-\d*-\d* \d*:\d*:\d*.\d*(?=(.*)"stop_reason":"end_turn")|(?<="stop_reason":"end_turn"(.*):{"cache_creation_input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*)"cache_read_input_tokens":)(\d+)|(?<=stop_reason":null(.*)"input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*)"output_tokens":)(\d+)/g;
const chatClaudePattern = /\d*-\d*-\d* \d*:\d*:\d*.\d*(?=(.*)"stop_reason":"end_turn")|(?<="stop_reason":"end_turn"(.*):{"cache_creation_input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*)"cache_read_input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*)"input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*)"output_tokens":)(\d+)/g;

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
        console.log("No chunks have been made");
    }
    //console.log(chunks[1]+"\n\n\n\n------------");
    for (var i = 0; i<chunks.length; i++){
        var models = chunks[i].match(modelPattern2);
        if (models!==null){
            var model = models[0]; 
            console.log("model:"+model); //rn its getting the wrong model (well not wrong its getting too much of the model)
            switch (model) {
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
            const [time, result] = findClaude(chunks[i],chunks.slice(0,i-1));
            if (result !== -1) { 
                activeCall.Emissions = Number(convert.calculateEmission(activeCall.Model, result).toFixed(4));
                activeCall.DateTime = time;
                claudeFlag = false;
                matches.push(activeCall);
                var activeCall: budget.Call = { Emissions: 0, Model: "TEST", DateTime: 0 };
            }
        }
    }

    console.log("FOUND MATCHES:\n", matches);
    return matches;
}

function findClaude(line: string,priorChunks: string[]): [number, number] {
    const purpose = line.match(modelPattern3);
    var match = line.match(chatClaudePattern); 
    var timeIndex:number = 0; 
    if (purpose !== null) {
        if (purpose[0] === ' [inline/generate'){ //this doesn't 
            console.log("INLINE CALL MADEEEEEEEE");
            timeIndex = 1;
            var chunk = line;
            for (let i = priorChunks.length-1; i>=0; --i){
                var matches = priorChunks[i].match(inlineClaudePattern);
                if (matches!==null){
                    if (matches.length === 1){
                        // console.log("added orther section -----------------------------------------------------");
                        // console.log(matches);
                        chunk.concat(priorChunks[i]);
                        break;
                    }
                }
            }
            match = chunk.match(inlineClaudePattern);
        }
        if (match!==null){
            var result:number = Number(match[Number(!timeIndex)]);
            for (let i = 2; i < match.length; i++) {
                result += Number(match[i]);
            }
            console.log("C L A U D E T O K E N S !!");
            var timestamp: number = new Date(match[timeIndex]).getTime();
            if (match[timeIndex] === '0') {timestamp = new Date().getTime();}
            console.log("Timestamp: ", timestamp);
            console.log(match);
            console.log("TOKENSSSSSSSSSS"+result);
            return [timestamp, result];
        }
    }
    return [0, -1];
    }