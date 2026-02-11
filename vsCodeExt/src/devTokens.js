"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.inline = void 0;
exports.getTextAroundCursor = getTextAroundCursor;
exports.change = change;
const vscode = __importStar(require("vscode"));
const tiktoken_1 = require("tiktoken");
function getTextAroundCursor(linesBefore = 150, linesAfter = 150) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return ""; //if document is empty
    }
    const docu = editor.document; //pretty self explanitory
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
exports.inline = vscode.commands.registerCommand('ecode.wrappedInline', async () => {
    accept = true;
    await vscode.commands.executeCommand("editor.action.inlineSuggest.commit"); //then does the accept command
});
async function change(evt) {
    //disposables.push(vscode.workspace.onDidChangeTextDocument(async evt => {
    const enc = await (0, tiktoken_1.encoding_for_model)("gpt-4o"); //use gpt-4o for now because copilot very secretive
    if (accept) {
        console.log("accept gone through");
        for (const change of evt.contentChanges) {
            if (change.text.length > 2) { //if its more than 2 character
                const tokens = enc.encode(change.text + getTextAroundCursor()); //tokenises the new text(output tokens) along with a portion of the doucment (input tokens)
                accept = false; //accept boolean stops like copy and paste having an effect
                return tokens.length; //placeholder for a convertion function			
            }
        }
    }
    else {
        console.log("accept not gone through");
        return -1;
    }
}
//# sourceMappingURL=devTokens.js.map