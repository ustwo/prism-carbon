import * as vscode from 'vscode';

export function getLogFilePath(context: vscode.ExtensionContext) {
    return context.logUri.fsPath;
}

export function parseLogForCalls(rawLog: string) {
    // TODO - regex to convert log file lines to usable data 
}
