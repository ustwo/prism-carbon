import { error } from 'console';
import { resolve } from 'path';
import * as vscode from 'vscode';


const modelPattern = /(?<=\[debug\] chat model )(.*)/g;
const testPattern = /a/g;

export function getLogFilePath(context: vscode.ExtensionContext) {
    return context.logUri.fsPath;
}

export async function identifyModel(rawLog: string): Promise<string[]> {
    var matches = [];
    const lines: string[] = rawLog.split(/\r?\n/);
    for (var line of lines) {
        //console.log(line);
        const match = line.match(modelPattern);
        
        if (match === null) {
          continue;
        }
        console.log(match[0]);
        matches.push(match[0]);
        
    }
    return matches;
}