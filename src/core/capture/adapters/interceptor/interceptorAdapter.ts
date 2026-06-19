/****************************************************************
 *                    INTERCEPTORADAPTER.TS                     *
 *  THE SINGLE CAPTURE MECHANISM — AN HTTP PROXY THAT           *
 *  INTERCEPTS ALL LLM API CALLS. ROUTES EACH RESPONSE          *
 *  THROUGH THE REGISTERED PROVIDERS TO EXTRACT TOKEN DATA,     *
 *  CALCULATES EMISSIONS, AND EMITS A CALL.                     *
 *  AUTO-INJECTS PROXY ENV VARS INTO EVERY NEW TERMINAL.        *
 ****************************************************************/

import * as vscode from 'vscode';
import * as cp from 'child_process';
import { promisify } from 'util';
import { InterceptorProxy } from '../../../../proxy/proxyServer';
import { state } from '../../../state';
import { PROXY_PORT } from '../../../../extensionState';
import { updateTree } from '../../../callManager';
import { calculateEmission } from '../../../convert';
import { ALL_PROVIDERS } from './providers/index';
import { isSSE, parseSseLines } from '../../sseParser';
import { logger } from '../../../../utils/logger';

const execAsync = promisify(cp.exec);

let proxyServer: InterceptorProxy | undefined;
let terminalListener: vscode.Disposable | undefined;

export async function startCapture(globalStoragePath: string): Promise<void> {
    if (state.runningInterceptor) {
        logger.debug('Capture already running — skipping start');
        return;
    }
    try {
        // Guard against an orphaned worker from a previous session (e.g. a hard
        // crash where deactivate never ran) still holding the port.
        await freeProxyPort(PROXY_PORT);

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

    // Unset the proxy env vars from any terminal we injected into, so they
    // don't keep pointing at the now-dead proxy after the extension stops.
    cleanupProxyFromExistingTerminals();

    if (proxyServer) {
        logger.info('Stopping interceptor proxy...');
        await proxyServer.stop();
        proxyServer = undefined;
        state.runningInterceptor = false;
        logger.info('Interceptor proxy stopped');
    }
}

/**
 * Kills any orphaned proxy still listening on `port` before we start a fresh
 * one. Only targets Node processes, so we never kill an unrelated service that
 * happens to use the same port. Best-effort: failures are logged, not thrown.
 */
async function freeProxyPort(port: number): Promise<void> {
    try {
        const pids = await listeningPids(port);
        for (const pid of pids) {
            if (!(await isNodeProcess(pid))) {
                logger.warn(`Port ${port} held by non-Node PID ${pid} — leaving it alone`);
                continue;
            }
            logger.info(`Killing orphaned proxy (PID ${pid}) on port ${port}`);
            process.kill(pid, 'SIGKILL');
        }
    } catch (error) {
        logger.debug(`freeProxyPort: nothing to clean up or check failed (${error})`);
    }
}

async function listeningPids(port: number): Promise<number[]> {
    const cmd = process.platform === 'win32'
        ? `netstat -ano -p tcp | findstr LISTENING | findstr :${port}`
        : `lsof -ti tcp:${port} -sTCP:LISTEN`;

    const { stdout } = await execAsync(cmd);

    if (process.platform === 'win32') {
        // Last column of each matching line is the PID.
        const pids = stdout.trim().split(/\r?\n/)
            .map(line => Number(line.trim().split(/\s+/).pop()))
            .filter(pid => Number.isInteger(pid) && pid > 0);
        return [...new Set(pids)];
    }

    return [...new Set(
        stdout.trim().split(/\r?\n/)
            .map(Number)
            .filter(pid => Number.isInteger(pid) && pid > 0)
    )];
}

async function isNodeProcess(pid: number): Promise<boolean> {
    try {
        if (process.platform === 'win32') {
            const { stdout } = await execAsync(`tasklist /fi "PID eq ${pid}" /fo csv /nh`);
            return /node\.exe/i.test(stdout);
        }
        const { stdout } = await execAsync(`ps -p ${pid} -o comm=`);
        return /node/i.test(stdout);
    } catch {
        return false;
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

function cleanupProxyFromTerminal(terminal: vscode.Terminal): void {
    const keys = Object.keys(proxyEnv());
    terminal.sendText(`unset ${keys.join(' ')}`, true);
    logger.debug(`Proxy env unset from terminal: ${terminal.name}`);
}

function cleanupProxyFromExistingTerminals(): void {
    vscode.window.terminals.forEach(cleanupProxyFromTerminal);
}
