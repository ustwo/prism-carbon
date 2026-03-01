import { error } from 'console';
import { resolve } from 'path';
import * as budget from './budget';
import * as vscode from 'vscode';
import * as convert from './convert';


const modelPattern = /(?<=\[info\].*copilotmd \| success \| .* \| \d+ms \| \[.*)]/g;

const modelPattern3 = /\s\S*$/g; //gets the purpose of the call
const modelPattern2 = /(?<= \| success \| )\S*/g;
///^(.*)/g; gets first character for the other break point
const testPattern = /a/g;
//new split regex
//based on model and job change the token regex


//regex to capture Claude model tokens with datetime
const dateRegex = /\d*-\d*-\d* \d*:\d*:\d*.\d*/g;
const inlineClaudePattern = /\d*-\d*-\d* \d*:\d*:\d*.\d*(?=(.*)"stop_reason":"end_turn")|(?<=stop_reason":null(.*)"cache_creation_input_tokens":)(\d+)|(?<=stop_reason":null(.*)"cache_read_input_tokens":)(\d+)|(?<=stop_reason":null(.*)"input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*)"output_tokens":)(\d+)|(?<=stop_reason":"end_turn",(.*))}}/g;
const chatClaudePattern = /\d*-\d*-\d* \d*:\d*:\d*.\d*(?=(.*)"stop_reason":"end_turn")|(?<="stop_reason":"end_turn"(.*):{"cache_creation_input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*)"cache_read_input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*)"input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*)"output_tokens":)(\d+)/g;

export function getLogFilePath(context: vscode.ExtensionContext) {
    return context.logUri.fsPath;
}

export async function identifyModel(rawLog: string): Promise<budget.Call[]> {
    var matches: budget.Call[] = [];
    console.log("FIRST FIRST MATCHES:\n", matches);
    var claudeFlag: boolean = false;
    var activeCall: budget.Call = { Emissions: 0, Model: "TEST", DateTime: 0 };

    var models = rawLog.match(modelPattern2);
    if (models!==null){
        for(var i = 0;i< models.length;i++){
            var model = models[i];
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
    }
    if (claudeFlag){
        const [times, results] = findClaude(rawLog);
        for(var i = 0; i<results.length;i++){
            if (results[i] !== -1) { 
                activeCall.Emissions = results[i];
                //Number(convert.calculateEmission(activeCall.Model, result).toFixed(4));
                activeCall.DateTime = times[i];
                claudeFlag = false;
                matches.push(activeCall);
                var activeCall: budget.Call = { Emissions: 0, Model: "TEST", DateTime: 0 };
            }
        }
    }

    console.log("FOUND MATCHES:\n", matches);
    return matches;
}

function findClaude(log: string): [number[], number[]] {
    const purpose = log.match(modelPattern3);
    var match = log.match(inlineClaudePattern); 
    var timeIndex:number = 0; 
 
    if (match!==null){
        var result:number[] = [];
        var timestamp:number[] = [];
        var j = 0;
        var flag:boolean = false;
        console.log(match);
        for (let i = 0; i < match.length; i++) {
            console.log("match ",i,match[i]);
            if (match[i] === '}}'){
                j++;
                flag = false;
            }
            else{
                console.log("not }}");
                if (match[i].match(dateRegex) !== null){
                    timestamp.push(new Date(match[i]).getTime());
                    if (match[timeIndex] === '0') {timestamp.push(new Date().getTime());}
                    console.log("Timestamp: ", timestamp);
                } 
                else{  
                    console.log("not date");           
                    if (!flag){
                        console.log("Added new numer");
                        result.push(Number(match[i]));
                        flag = true;
                    }
                    else{
                        console.log("UPDATED result");
                        result[j] += Number(match[i]);
                        }
                }
        }

        }
        console.log("C L A U D E T O K E N S !!");
        console.log(result);
        return [timestamp, result];
    }

    return [[0], [-1]];
    }