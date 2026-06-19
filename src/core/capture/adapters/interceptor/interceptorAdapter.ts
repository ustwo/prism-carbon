/****************************************************************
 *                    INTERCEPTORADAPTER.TS                     *
 *  OPTIONAL RUNTIME CAPTURE MECHANISM — AN HTTP PROXY THAT     *
 *  INTERCEPTS LLM API CALLS MADE FROM VS CODE TERMINALS.       *
 *  ONLY STARTED WHEN estimatingCarbon.enableRuntimeProxy IS    *
 *  TRUE (OFF BY DEFAULT). USE THIS TO CAPTURE CALLS FROM YOUR  *
 *  OWN SCRIPTS IN ADDITION TO IN-IDE TOOLS (CLAUDE CODE AND    *
 *  COPILOT, WHICH ARE CAPTURED VIA LOG FILES WITHOUT A PROXY). *
 ****************************************************************/

import * as vscode from 'vscode';
import { InterceptorProxy } from '../../../../proxy/proxyServer';
import { state } from '../../../state';
import { PROXY_PORT } from '../../../../extensionState';
import { updateTree } from '../../../callManager';
import { calculateEmission } from '../../../convert';
import { ALL_PROVIDERS } from './providers/index';
import { isSSE, parseSseLines } from '../../sseParser';
import { logger } from '../../../../utils/logger';

let proxyServer: InterceptorProxy | undefined;
let terminalListener: vscode.Disposable | undefined;

const PROXY_URL = `http://127.0.0.1:${PROXY_PORT}`;

export async function startCapture(globalStoragePath: string): Promise<void> {
    if (state.runningInterceptor) {
        logger.debug('Capture already running — skipping start');
        return;
    }
    try {
        // Show security warning before starting proxy
        const acknowledged = await vscode.window.showWarningMessage(
            '⚠️ PRISM Runtime Proxy — Security Warning',
            {
                modal: true,
                detail: 'The runtime proxy intercepts HTTPS traffic to capture LLM API calls. This means:\n\n• Your HTTPS traffic is decrypted using a self-signed certificate stored on disk\n• Complete API responses are processed in memory before being analyzed\n• Terminal environment variables are modified to route traffic through the proxy\n\nEnable only if you understand and accept these risks. See README for details.'
            },
            'I understand and accept the risks',
            'Cancel'
        );

        if (acknowledged !== 'I understand and accept the risks') {
            logger.info('User cancelled proxy startup due to security warning');
            return;
        }

        logger.info(`Starting interceptor proxy on port ${PROXY_PORT}...`);
        proxyServer = new InterceptorProxy(PROXY_PORT, onApiResponseText);
        await proxyServer.start(globalStoragePath);
        state.runningInterceptor = true;
        logger.info(`Interceptor proxy started on port ${PROXY_PORT}`);

        injectProxyIntoExistingTerminals();
        terminalListener = vscode.window.onDidOpenTerminal(injectProxyIntoTerminal);
    } catch (error) {
        logger.error(`Failed to start interceptor proxy: ${error}`);
        vscode.window.showErrorMessage('Failed to start capture proxy: ' + error);
    }
}

export async function stopCapture(): Promise<void> {
    terminalListener?.dispose();
    terminalListener = undefined;

    if (proxyServer) {
        logger.info('Stopping interceptor proxy...');
        await proxyServer.stop();
        proxyServer = undefined;
        state.runningInterceptor = false;
        logger.info('Interceptor proxy stopped');
    }
}

function tryParseJson(text: string): unknown | null {
    try { return JSON.parse(text); } catch { return null; }
}

function onApiResponseText(url: string, bodyText: string): void {
    const provider = ALL_PROVIDERS.find(p => p.matches(url));
    if (!provider) { return; }

    const parsed = isSSE(bodyText)
        ? provider.parseSSE(parseSseLines(bodyText))
        : provider.parseTokens(tryParseJson(bodyText));

    if (!parsed) { return; }

    const emissions = Number(calculateEmission(parsed.model, parsed.totalTokens).toFixed(4));
    logger.debug(`[${provider.displayName}] model: ${parsed.model}, tokens: ${parsed.totalTokens}, emissions: ${emissions}g CO₂e`);

    updateTree({
        Model: parsed.model,
        Emissions: emissions,
        DateTime: Date.now(),
        Source: `Proxy · ${provider.displayName}`,
    });
}

function proxyEnv(): Record<string, string> {
    const proxyUrl = `http://127.0.0.1:${PROXY_PORT}`;
    const certPath = proxyServer?.certPath ?? '';
    return {
        HTTP_PROXY: proxyUrl,
        HTTPS_PROXY: proxyUrl,
        http_proxy: proxyUrl,
        https_proxy: proxyUrl,
        REQUESTS_CA_BUNDLE: certPath,
        SSL_CERT_FILE: certPath,
        CURL_CA_BUNDLE: certPath,
        AWS_CA_BUNDLE: certPath,
        NODE_EXTRA_CA_CERTS: certPath,
        NODE_OPTIONS: '--use-env-proxy',
        JAVA_TOOL_OPTIONS: `-Dhttp.proxyHost=127.0.0.1 -Dhttp.proxyPort=${PROXY_PORT} -Dhttps.proxyHost=127.0.0.1 -Dhttps.proxyPort=${PROXY_PORT}`,
    };
}

function injectProxyIntoTerminal(terminal: vscode.Terminal): void {
    if (!proxyServer) { return; }
    const env = proxyEnv();
    const exports = Object.entries(env)
        .map(([k, v]) => `export ${k}="${v}"`)
        .join(' && ');
    terminal.sendText(exports, true);
    logger.debug(`Proxy env injected into terminal: ${terminal.name}`);
}

function injectProxyIntoExistingTerminals(): void {
    vscode.window.terminals.forEach(injectProxyIntoTerminal);
}
