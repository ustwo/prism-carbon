/****************************************************************
 *                    INTERCEPTORADAPTER.TS                     *
 *  THE SINGLE CAPTURE MECHANISM — AN HTTP PROXY THAT           *
 *  INTERCEPTS ALL LLM API CALLS. ROUTES EACH RESPONSE          *
 *  THROUGH THE REGISTERED PROVIDERS TO EXTRACT TOKEN DATA,     *
 *  CALCULATES EMISSIONS, AND EMITS A CALL.                     *
 *  AUTO-INJECTS PROXY ENV VARS INTO EVERY NEW TERMINAL.        *
 *  EACH VS CODE WINDOW RUNS ITS OWN PROXY ON ITS OWN PORT, SO  *
 *  CAPTURE IS INDEPENDENT AND CORRECTLY ATTRIBUTED PER WINDOW. *
 *  A PID REGISTRY GARBAGE-COLLECTS PROXIES LEFT BY CRASHED     *
 *  WINDOWS, NEVER TOUCHING A LIVE SIBLING'S WORKER.            *
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

// Directory of per-window lock files (one JSON per owning extension-host PID),
// shared across windows via the extension's globalStorage path.
const LOCK_DIR = 'proxy-locks';

interface ProxyLock { hostPid: number; workerPid: number; port: number; }

let proxyServer: InterceptorProxy | undefined;
let terminalListener: vscode.Disposable | undefined;
let storagePath: string | undefined;
let activePort: number | undefined;

export async function startCapture(globalStoragePath: string): Promise<void> {
    if (state.runningInterceptor) {
        logger.debug('Capture already running — skipping start');
        return;
    }
    storagePath = globalStoragePath;
    try {
        // Clean up proxies left behind by VS Code windows that crashed without
        // running deactivate. Never touches a live sibling's worker.
        await gcOrphanedProxies(globalStoragePath);

        logger.info(`Starting interceptor proxy (preferred port ${PROXY_PORT})...`);
        proxyServer = new InterceptorProxy(PROXY_PORT, onApiResponseText);
        await proxyServer.start(globalStoragePath);
        activePort = proxyServer.port;
        state.runningInterceptor = true;
        writeOwnLock(globalStoragePath, {
            hostPid: process.pid,
            workerPid: proxyServer.workerPid ?? -1,
            port: activePort ?? -1,
        });
        logger.info(`Interceptor proxy started on port ${activePort}`);

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
        activePort = undefined;
        state.runningInterceptor = false;
        if (storagePath) { clearOwnLock(storagePath); }
        logger.info('Interceptor proxy stopped');
    }
}

/**
 * Scans the lock registry and kills any proxy worker whose owning VS Code
 * window is no longer alive (e.g. a hard crash where deactivate never ran).
 * Live siblings are left untouched. Each lock records its worker PID, so we
 * kill by PID — no port scanning needed — and we verify the PID is still a Node
 * process first, so a recycled PID can never make us kill an unrelated process.
 * Best-effort: failures are logged, never thrown.
 */
async function gcOrphanedProxies(storagePath: string): Promise<void> {
    const dir = path.join(storagePath, LOCK_DIR);
    let files: string[];
    try {
        files = fs.readdirSync(dir);
    } catch {
        return; // no registry yet — nothing to collect
    }

    for (const file of files) {
        const full = path.join(dir, file);
        const lock = readLockFile(full);
        if (!lock) { rmFile(full); continue; }

        if (lock.hostPid === process.pid || isProcessAlive(lock.hostPid)) {
            continue; // ours or a live sibling — leave it alone
        }

        // Owner window is gone — reclaim its worker.
        if (lock.workerPid > 0 && await isNodeProcess(lock.workerPid)) {
            logger.info(`Killing orphaned proxy worker (PID ${lock.workerPid}, port ${lock.port}) from dead window ${lock.hostPid}`);
            try { process.kill(lock.workerPid, 'SIGKILL'); } catch (e) { logger.debug(`kill ${lock.workerPid} failed: ${e}`); }
        }
        rmFile(full);
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

function ownLockPath(storagePath: string): string {
    return path.join(storagePath, LOCK_DIR, `${process.pid}.json`);
}

function readLockFile(file: string): ProxyLock | null {
    try {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
        if (typeof parsed?.hostPid === 'number' && typeof parsed?.workerPid === 'number') {
            return parsed;
        }
        return null;
    } catch { return null; }
}

function writeOwnLock(storagePath: string, lock: ProxyLock): void {
    try {
        fs.mkdirSync(path.join(storagePath, LOCK_DIR), { recursive: true });
        fs.writeFileSync(ownLockPath(storagePath), JSON.stringify(lock));
    } catch (e) {
        logger.debug(`writeOwnLock failed: ${e}`);
    }
}

function rmFile(file: string): void {
    try { fs.rmSync(file, { force: true }); } catch (e) { logger.debug(`rm ${file} failed: ${e}`); }
}

/** Remove this window's own lock file. */
function clearOwnLock(storagePath: string): void {
    rmFile(ownLockPath(storagePath));
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
    const port = activePort ?? PROXY_PORT;
    const proxyUrl = `http://127.0.0.1:${port}`;
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
        JAVA_TOOL_OPTIONS: `-Dhttp.proxyHost=127.0.0.1 -Dhttp.proxyPort=${port} -Dhttps.proxyHost=127.0.0.1 -Dhttps.proxyPort=${port}`,
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
