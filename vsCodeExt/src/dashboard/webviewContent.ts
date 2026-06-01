/****************************************************************
 *                     WEBVIEWCONTENT.TS                        *
 *  LOADS webview/dashboard.html FROM DISK AND INJECTS THE      *
 *  WEBVIEW-SAFE URIS FOR LOCAL RESOURCES.                      *
 *  KEEPING THE HTML TEMPLATE SEPARATE MAKES IT EDITABLE AS A  *
 *  REAL FILE INSTEAD OF A TYPESCRIPT STRING LITERAL.           *
 ****************************************************************/

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const dir = path.join(extensionUri.fsPath, 'public');

    const toUri = (file: string) =>
        webview.asWebviewUri(vscode.Uri.file(path.join(dir, file))).toString();

    return fs.readFileSync(path.join(dir, 'dashboard.html'), 'utf8')
        .replace('{{STYLE_URI}}',  toUri('style.css'))
        .replace('{{SCRIPT_URI}}', toUri('dashboard.js'))
        .replace('{{GRAPH_URI}}',  toUri('graph.js'));
}
