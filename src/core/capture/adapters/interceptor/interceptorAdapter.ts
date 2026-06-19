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
import * as fs from 'fs';
import * as path from 'path';
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

const LOCK_FILE = 'proxy.lock';

interface ProxyLock { hostPid: number; workerPid: number; port: number; }

let proxyServer: InterceptorProxy | undefined;
let terminalListener: vscode.Disposable | undefined;
let storagePath: string | undefined;

export async function startCapture(globalStoragePath: string): Promise<void> {
    if (state.runningInterceptor) {
        logger.debug('Capture already running — skipping start');
        return;
    }
    storagePath = globalStoragePath;
    try {
        // Reclaim the port only if it's free or held by a dead orphan. If another
        // live VS Code window already owns the proxy, stand down — one shared
        // proxy per machine, and we must not kill a sibling's worker.
        if (!(await ensurePortReclaimable(PROXY_PORT, globalStoragePath))) {
            logger.info('Proxy already owned by another VS Code window — this window will not start its own.');
            return;
        }

        logger.info(`Starting interceptor proxy on port ${PROXY_PORT}...`);
        proxyServer = new InterceptorProxy(PROXY_PORT, onApiResponseText);
        await proxyServer.start(globalStoragePath);
        state.runningInterceptor = true;
        writeLock(globalStoragePath, {
            hostPid: process.pid,
            workerPid: proxyServer.workerPid ?? -1,
            port: PROXY_PORT,
        });
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
        if (storagePath) { clearOwnLock(storagePath); }
        logger.info('Interceptor proxy stopped');
    }
}

/**
 * Decides whether this window may take port `port`, and clears the way if so.
 * Returns true when the port is free, or when it's held by an orphaned worker
 * whose owning VS Code window is gone (hard crash) — in which case the orphan
 * is killed. Returns false when a *live* sibling window owns the proxy, so we
 * never kill a healthy sibling's worker. Best-effort: failures fall back to
 * "reclaimable" so a transient check error never blocks capture.
 */
async function ensurePortReclaimable(port: number, storagePath: string): Promise<boolean> {
    try {
        const pids = await listeningPids(port);
        if (pids.length === 0) {
            clearLock(storagePath);
            return true;
        }

        const lock = readLock(storagePath);
        if (lock && lock.hostPid !== process.pid && isProcessAlive(lock.hostPid)) {
            // Owner window is still running — leave its proxy alone.
            return false;
        }

        // Orphan (owner host dead or no lock): reclaim the port. Only kill Node
        // processes so we never touch an unrelated service on the same port.
        for (const pid of pids) {
            if (!(await isNodeProcess(pid))) {
                logger.warn(`Port ${port} held by non-Node PID ${pid} — leaving it alone`);
                continue;
            }
            logger.info(`Killing orphaned proxy (PID ${pid}) on port ${port}`);
            try { process.kill(pid, 'SIGKILL'); } catch (e) { logger.debug(`kill ${pid} failed: ${e}`); }
        }
        clearLock(storagePath);
        return true;
    } catch (error) {
        logger.debug(`ensurePortReclaimable: check failed, assuming free (${error})`);
        return true;
    }
}

function isProcessAlive(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch (e: any) {
        // EPERM = process exists but we can't signal it; still "alive".
        return e?.code === 'EPERM';
    }
}

function lockPath(storagePath: string): string {
    return path.join(storagePath, LOCK_FILE);
}

function readLock(storagePath: string): ProxyLock | null {
    try {
        const raw = fs.readFileSync(lockPath(storagePath), 'utf-8');
        const parsed = JSON.parse(raw);
        if (typeof parsed?.hostPid === 'number') { return parsed; }
        return null;
    } catch { return null; }
}

function writeLock(storagePath: string, lock: ProxyLock): void {
    try {
        fs.writeFileSync(lockPath(storagePath), JSON.stringify(lock));
    } catch (e) {
        logger.debug(`writeLock failed: ${e}`);
    }
}

function clearLock(storagePath: string): void {
    try {
        fs.rmSync(lockPath(storagePath), { force: true });
    } catch (e) {
        logger.debug(`clearLock failed: ${e}`);
    }
}

/** Remove the lock only if this window owns it. */
function clearOwnLock(storagePath: string): void {
    const lock = readLock(storagePath);
    if (lock && lock.hostPid === process.pid) { clearLock(storagePath); }
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
