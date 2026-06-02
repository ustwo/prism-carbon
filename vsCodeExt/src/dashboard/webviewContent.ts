/****************************************************************
 *                     WEBVIEWCONTENT.TS                        *
 *  LOADS HTML TEMPLATES FROM DISK AND INJECTS WEBVIEW-SAFE    *
 *  URIS FOR LOCAL RESOURCES.                                   *
 *  public/dashboard/  →  getWebviewContent()                  *
 *  public/miniview/   →  getMiniviewContent()                  *
 ****************************************************************/

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const dir = path.join(extensionUri.fsPath, 'public', 'dashboard');

    const toUri = (file: string) =>
        webview.asWebviewUri(vscode.Uri.file(path.join(dir, file))).toString();

    return fs.readFileSync(path.join(dir, 'dashboard.html'), 'utf8')
        .replace('{{STYLE_URI}}',  toUri('style.css'))
        .replace('{{SCRIPT_URI}}', toUri('dashboard.js'))
        .replace('{{GRAPH_URI}}',  toUri('graph.js'));
}

export function getMiniviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const dir = path.join(extensionUri.fsPath, 'public', 'miniview');

    const toUri = (file: string) =>
        webview.asWebviewUri(vscode.Uri.file(path.join(dir, file))).toString();

    return fs.readFileSync(path.join(dir, 'miniview.html'), 'utf8')
        .replace('{{STYLE_URI}}',  toUri('miniview.css'))
        .replace('{{SCRIPT_URI}}', toUri('miniview.js'));
}
