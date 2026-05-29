/****************************************************************
 *                       PROXYMANAGER.TS                        *
 *  MANAGES THE LIFECYCLE OF THE INTERCEPTOR PROXY — STARTED    *
 *  AUTOMATICALLY ON EXTENSION ACTIVATION AND STOPPED ON EXIT   *
 ****************************************************************/

import * as vscode from 'vscode';
import { InterceptorProxy } from './proxyServer';
import { state } from '../core/state';
import { PROXY_PORT } from '../extensionState';
import { updateTree } from '../core/callManager';
import { logger } from '../utils/logger';

let proxyServer: InterceptorProxy | undefined;
let proxyTerminal: vscode.Terminal | undefined;

export async function startInterceptor(globalStoragePath: string): Promise<void> {
    if (state.runningInterceptor) {
        logger.debug('Interceptor already running — skipping start');
        return;
    }
    try {
        logger.info(`Starting interceptor proxy on port ${PROXY_PORT}...`);
        proxyServer = new InterceptorProxy(PROXY_PORT, (call) => {
            updateTree(call);
        });
        await proxyServer.start(globalStoragePath);
        state.runningInterceptor = true;
        logger.info(`Interceptor proxy started on port ${PROXY_PORT}`);
    } catch (error) {
        logger.error(`Failed to start interceptor proxy: ${error}`);
        vscode.window.showErrorMessage('Failed to start Interceptor Proxy: ' + error);
    }
}

export async function stopInterceptor(): Promise<void> {
    if (proxyServer) {
        logger.info('Stopping interceptor proxy...');
        await proxyServer.stop();
        state.runningInterceptor = false;
        logger.info('Interceptor proxy stopped');
    }
    if (proxyTerminal) {
        proxyTerminal.dispose();
        proxyTerminal = undefined;
    }
}

export function openProxyTerminal(): void {
    if (!proxyServer) {
        vscode.window.showErrorMessage('There is no Interceptor Proxy Running.');
        return;
    }

    const proxyUrl = `http://127.0.0.1:${PROXY_PORT}`;

    proxyTerminal = vscode.window.createTerminal({
        name: 'Estimating Carbon RunTime Analysis Terminal',
        env: {
            HTTP_PROXY: proxyUrl,
            HTTPS_PROXY: proxyUrl,
            http_proxy: proxyUrl,
            https_proxy: proxyUrl,
            REQUESTS_CA_BUNDLE: proxyServer.certPath,
            SSL_CERT_FILE: proxyServer.certPath,
            CURL_CA_BUNDLE: proxyServer.certPath,
            AWS_CA_BUNDLE: proxyServer.certPath,
            NODE_EXTRA_CA_CERTS: proxyServer.certPath,
            NODE_OPTIONS: '--use-env-proxy',
            JAVA_TOOL_OPTIONS: `-Dhttp.proxyHost=127.0.0.1 -Dhttp.proxyPort=${PROXY_PORT} -Dhttps.proxyHost=127.0.0.1 -Dhttps.proxyPort=${PROXY_PORT}`,
        },
    });

    proxyTerminal.show();
}
