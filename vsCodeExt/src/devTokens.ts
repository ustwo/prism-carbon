import * as vscode from 'vscode';
import { encoding_for_model } from "tiktoken";



export function getTextAroundCursor(linesBefore: number = 150, linesAfter: number = 150): string { //use 150 becuase from research copilot sends around that portion of the document
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return "";//if document is empty
    }
    const docu = editor.document;//pretty self explanitory
    const cursorPos = editor.selection.active;
    const startLine = Math.max(0, cursorPos.line - linesBefore);
    const endLine = Math.min(docu.lineCount - 1, cursorPos.line + linesAfter);

    const start = new vscode.Position(startLine, 0); //sets the start to the start of the first line
    const end = new vscode.Position(endLine, docu.lineAt(endLine).text.length); //sets end to the end of the last line
    const range = new vscode.Range(start, end); //range is the range
    return docu.getText(range);
}

//let lastInlineState = false;
var accept = false;

export async function change(evt: vscode.TextDocumentChangeEvent) {
    //disposables.push(vscode.workspace.onDidChangeTextDocument(async evt => {
    const enc = await encoding_for_model("gpt-4o"); //use gpt-4o for now because copilot very secretive

    if (accept) {
        console.log("accept gone through");
        for (const change of evt.contentChanges) {
            if (change.text.length > 2) { //if its more than 2 character
                const tokens = enc.encode(change.text + getTextAroundCursor()); //tokenises the new text(output tokens) along with a portion of the doucment (input tokens)
                accept = false;//accept boolean stops like copy and paste having an effect
                return tokens.length; //placeholder for a convertion function			
            }
        }
    }
    else {
        console.log("accept not gone through");
        return -1;
    }
}
