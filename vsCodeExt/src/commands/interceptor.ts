/****************************************************************
 *                        INTERCEPTOR.TS                        *
 *  COMMANDS: interceptorStart / Stop / OpenTerminal /          *
 *  runtimeAnalysis — MANAGE THE HTTPS PROXY THAT INTERCEPTS    *
 *             LLM API CALLS DURING RUNTIME ANALYSIS            *
 ****************************************************************/

import * as vscode from 'vscode';
import { InterceptorProxy } from '../proxyServer';
import { state } from '../state';
import { shared, PROXY_PORT } from '../extensionState';
import { updateTree } from '../callManager';

let terminal: vscode.Terminal | undefined;

export function registerInterceptorCommands(globalStoragePath: string): vscode.Disposable[] {
    const start = vscode.commands.registerCommand('ecode.interceptorStart', async () => {
        if (state.runningInterceptor) {
            console.log('Interceptor is already running!');
            return;
        }
        try {
            shared.proxyServer = new InterceptorProxy(PROXY_PORT, (call) => {
                updateTree(call);
            });
            await shared.proxyServer.start(globalStoragePath);
            state.runningInterceptor = true;
        } catch (error) {
            console.error('Error starting Interceptor Proxy:', error);
            vscode.window.showErrorMessage('Failed to start Interceptor Proxy: ' + error);
        }
    });

    const openTerminal = vscode.commands.registerCommand('ecode.interceptorOpenTerminal', async () => {
        if (!shared.proxyServer) {
            vscode.window.showErrorMessage('There is no Interceptor Proxy Running. Please initiate `ecode.InterceptorStart`');
            return;
        }

        const proxyUrl = `http://127.0.0.1:${PROXY_PORT}`;

        terminal = vscode.window.createTerminal({
            name: 'Estimating Carbon RunTime Analysis Terminal',
            env: {
                HTTP_PROXY: proxyUrl,
                HTTPS_PROXY: proxyUrl,
                http_proxy: proxyUrl,
                https_proxy: proxyUrl,
                REQUESTS_CA_BUNDLE: shared.proxyServer.certPath,
                SSL_CERT_FILE: shared.proxyServer.certPath,
                CURL_CA_BUNDLE: shared.proxyServer.certPath,
                AWS_CA_BUNDLE: shared.proxyServer.certPath,
                NODE_EXTRA_CA_CERTS: shared.proxyServer.certPath,
                NODE_OPTIONS: '--use-env-proxy',
                JAVA_TOOL_OPTIONS: `-Dhttp.proxyHost=127.0.0.1 -Dhttp.proxyPort=${PROXY_PORT} -Dhttps.proxyHost=127.0.0.1 -Dhttps.proxyPort=${PROXY_PORT}`,
            },
        });

        terminal.show();
    });

    const stop = vscode.commands.registerCommand('ecode.interceptorStop', async () => {
        if (shared.proxyServer) {
            shared.proxyServer.stop();
            state.runningInterceptor = false;
            vscode.window.showInformationMessage('Runtime Analysis stopped. ');
        }
        if (terminal) {
            terminal.dispose();
            terminal = undefined;
        }
    });

    const runtime = vscode.commands.registerCommand('ecode.runtimeAnalysis', async () => {
        try {
            await vscode.commands.executeCommand('ecode.interceptorStart');
            await vscode.commands.executeCommand('ecode.interceptorOpenTerminal');
        } catch (error) {
            vscode.window.showErrorMessage('Failed to launch runtime analysis service');
        }
    });

    return [start, openTerminal, stop, runtime];
}
