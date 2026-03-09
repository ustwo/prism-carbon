import { error } from 'console';
import { resolve } from 'path';
import * as budget from './budget';
import * as vscode from 'vscode';
import * as convert from './convert';


const splitPattern= /(?<=\[info\].*copilotmd \| success \| .* \| \d+ms \| \[.*)]/g;
//was used to split the log file at the point of new model
// this is outdated and not used but may be valuable later

const purposePattern = /(?<= \| success \| .* \| \d*ms \| \[)[^\]]*/g; //gets the purpose of the call
const modelPattern = /(?<= \| success \| )\S*/g; //gets all the models used in the log file




//regex to capture Claude model tokens with datetime
const dateRegex = /\d*-\d*-\d* \d*:\d*:\d*.\d*/g; //returns all the dates
const claudePattern = /\d*-\d*-\d* \d*:\d*:\d*.\d*(?=(.*)"stop_reason":"end_turn")|(?<=stop_reason":null(.*)"cache_creation_input_tokens":)(\d+)|(?<=stop_reason":null(.*)"cache_read_input_tokens":)(\d+)|(?<=stop_reason":null(.*)"input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*)"output_tokens":)(\d+)|(?<=stop_reason":"end_turn",(.*))}}/g;
//gets the tokens used in claude calls
//this is the same no matter the purpose

export function getLogFilePath(context: vscode.ExtensionContext) {
    return context.logUri.fsPath;
} // function to get log file location

export async function identifyModel(rawLog: string): Promise<budget.Call[]> {
    var matches: budget.Call[] = [];
    var claudeFlag: boolean = false; //flag used to tell us if we need to use our claude regex
    var activeCall: budget.Call = { Emissions: 0, Model: "TEST", DateTime: 0 };
    var claudes: string[] = [];

    var models = rawLog.match(modelPattern); //creates an array of all models used in the log file provided
    if (models!==null){
        for(var i = 0;i< models.length;i++){
            var model = models[i]; 
            switch (model) {
                case 'claude-haiku-4.5': //adds the specifc claude model to an array of claude models
                    claudes.push(model);
                    claudeFlag = true;
                    break;
                case 'claude-opus-4.5':
                    claudes.push(model);
                    claudeFlag = true;
                    break;
                case 'claude-opus-4.6':
                    claudes.push(model);
                    claudeFlag = true;
                    break;
                case 'claude-sonnet-4':
                    claudes.push(model);
                    claudeFlag = true;
                    break;
                case 'claude-sonnet-4.5':
                    claudes.push(model);
                    claudeFlag = true;
                    break;
                case 'claude-sonnet-4.6':
                    claudes.push(model);
                    claudeFlag = true;
                    break;
                default:
                    console.log("Functionality coming soon!");
                    break;
            
            }
        }
        
    }
    if (claudeFlag){
        const [times, results] = findClaude(rawLog);//returns an array of time stamps and total tokens for all claude models
        for(var i = 0; i<results.length;i++){
            if (results[i] !== -1) { 
                activeCall.Model = claudes[i];
                activeCall.Emissions = Number(convert.calculateEmission(activeCall.Model, results[i]).toFixed(4));
                // converts current call's token count to emissions 
                activeCall.DateTime = times[i]; //apply appropriate time stamp
                claudeFlag = false; //resets flags
                matches.push(activeCall);
                var activeCall: budget.Call = { Emissions: 0, Model: "TEST", DateTime: 0 };//resets the call
            }
        }
    }

    return matches;
}

function findClaude(log: string): [number[], number[]] {
    var match = log.match(claudePattern); //matches the claude regex to the log file
    var timeIndex:number = 0; 
 
    if (match!==null){
        var result:number[] = [];
        var timestamp:number[] = [];
        var j = 0;
        var flag:boolean = false;
        for (let i = 0; i < match.length; i++) { //loops through all the matches (all types of tokens and appropriate time stamps)
            if (match[i] === '}}'){ //built into the regex to grab this at the end of every claude call so multiple calls don't get merged into one
                j++;
                flag = false;
            }
            else{
                if (match[i].match(dateRegex) !== null){ //if match we are currently looking at is a date make it the timestamp
                    timestamp.push(new Date(match[i]).getTime());
                    if (match[timeIndex] === '0') {timestamp.push(new Date().getTime());}
                } 
                else{          
                    if (!flag){ //if its the first token in the match set add a new value to the results array
                        result.push(Number(match[i]));
                        flag = true;
                    }
                    else{//otherwise update the result we are looking at
                        result[j] += Number(match[i]);
                        }
                }
        }

        }
        return [timestamp, result];
    }

    return [[0], [-1]];
    }