/**************************************************************************
 *                            SERVERWORKER.TS                             *
 *  PROXY WORKER PROCESS. INTERCEPTS ALL HTTP/HTTPS TRAFFIC AND           *
 *  FORWARDS RAW RESPONSE BODY TEXT FOR AI API ENDPOINTS TO THE PARENT    *
 *  PROCESS VIA IPC — AFTER THE STREAM HAS FULLY COMPLETED AND BEEN       *
 *  DELIVERED TO THE CLIENT. STREAMING EXPERIENCE IS NEVER INTERRUPTED.   *
 *  BINDS THE PREFERRED PORT IF FREE, ELSE AN OS-ASSIGNED FREE PORT, SO   *
 *  MULTIPLE VS CODE WINDOWS EACH GET THEIR OWN PROXY WITHOUT COLLIDING.  *
 **************************************************************************/

import * as mockttp from 'mockttp';
import * as fs from 'fs';
import * as path from 'path';

const AI_DOMAINS = [
    'api.anthropic.com',
    'api.openai.com',
    'generativelanguage.googleapis.com',
    'api.github.com',
];

let server: mockttp.Mockttp | null = null;

process.on('message', async (msg: any) => {
    if (msg.command === 'start') {
        await startServer(msg.preferredPort, msg.storagePath);
    } else if (msg.command === 'stop') {
        if (server) { await server.stop(); }
        process.exit(0);
    }
});

async function startServer(preferredPort: number | undefined, storagePath: string) {
    try {
        if (!fs.existsSync(storagePath)) { fs.mkdirSync(storagePath, { recursive: true }); }

        const certPath = path.join(storagePath, 'local-ca.pem');
        const keyPath = path.join(storagePath, 'local-ca.key');

        const httpsConfig = await ensureCaCert(certPath, keyPath);

        const boundPort = await bindServer(httpsConfig, preferredPort);

        if (process.send) { process.send({ type: 'started', certPath, port: boundPort }); }
    } catch (error: any) {
        if (process.send) { process.send({ type: 'error', message: error.toString() }); }
    }
}

/**
 * Returns the shared CA cert, generating it once if absent. Several VS Code
 * windows share one globalStorage dir, so on a simultaneous first-ever cold
 * start they could each generate a different CA and clobber the file — leaving a
 * window serving one cert while its terminals are told to trust another (TLS
 * failure). We avoid that by electing a single generator via an exclusive (wx)
 * create of the key file; the rest wait for the cert (written last) and read the
 * same pair. After the first run the fast path just reads the existing files.
 */
async function ensureCaCert(
    certPath: string,
    keyPath: string,
    attempt = 0,
): Promise<{ key: string; cert: string }> {
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        return { key: fs.readFileSync(keyPath, 'utf-8'), cert: fs.readFileSync(certPath, 'utf-8') };
    }

    let fd: number;
    try {
        fd = fs.openSync(keyPath, 'wx'); // atomic election — only one worker wins
    } catch (e: any) {
        if (e.code !== 'EEXIST') { throw e; }
        // Another worker is generating — wait for the cert (written last) to land.
        try {
            await waitForFile(certPath, 5000);
        } catch {
            // Stale key from a crashed generator — clear it and retry once.
            if (attempt === 0) {
                try { fs.rmSync(keyPath, { force: true }); } catch { /* ignore */ }
                return ensureCaCert(certPath, keyPath, 1);
            }
            throw new Error('CA cert generation appears stuck');
        }
        return { key: fs.readFileSync(keyPath, 'utf-8'), cert: fs.readFileSync(certPath, 'utf-8') };
    }

    try {
        const generated = await mockttp.generateCACertificate({
            subject: { commonName: 'Ecode Proxy CA' },
            bits: 2048,
        });
        fs.writeSync(fd, generated.key);
        fs.closeSync(fd);
        fs.writeFileSync(certPath, generated.cert); // cert written last = completion signal
        return { key: generated.key, cert: generated.cert };
    } catch (e) {
        // Don't leave a stale empty key file blocking future runs.
        try { fs.closeSync(fd); } catch { /* already closed */ }
        try { fs.rmSync(keyPath, { force: true }); } catch { /* ignore */ }
        throw e;
    }
}

function waitForFile(file: string, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const startedAt = Date.now();
        const tick = () => {
            if (fs.existsSync(file)) { resolve(); return; }
            if (Date.now() - startedAt > timeoutMs) { reject(new Error(`Timed out waiting for ${file}`)); return; }
            setTimeout(tick, 50);
        };
        tick();
    });
}

/**
 * Builds a proxy server and binds it to `preferredPort` if available, falling
 * back to an OS-assigned free port if that one is taken (e.g. another window's
 * proxy already holds it). Returns the actual port bound.
 */
async function bindServer(httpsConfig: any, preferredPort: number | undefined): Promise<number> {
    server = await buildServer(httpsConfig);
    try {
        await server.start(preferredPort);
    } catch {
        // Preferred port busy — rebuild and let the OS pick a free one.
        await server.stop().catch(() => { /* ignore */ });
        server = await buildServer(httpsConfig);
        await server.start();
    }
    return server.port;
}

async function buildServer(httpsConfig: any): Promise<mockttp.Mockttp> {
    const s = mockttp.getLocal({ https: httpsConfig });

    // Forward all traffic — no body buffering here, stream reaches client immediately.
    // Honour any upstream corporate proxy already configured in the environment.
    const upstreamProxyUrl =
        process.env.HTTPS_PROXY || process.env.https_proxy ||
        process.env.HTTP_PROXY  || process.env.http_proxy;
    const noProxyList = (process.env.NO_PROXY || process.env.no_proxy)
        ?.split(',').map(s => s.trim()).filter(Boolean);
    const proxyConfig = upstreamProxyUrl
        ? { proxyUrl: upstreamProxyUrl, noProxy: noProxyList }
        : undefined;

    await s.forAnyRequest().thenPassThrough({ proxyConfig });

    // Track AI request URLs by id so we can correlate with the response event
    const pendingAiRequests = new Map<string, string>(); // id -> url

    s.on('request', (req: any) => {
        if (isAiUrl(req.url)) {
            pendingAiRequests.set(req.id, req.url);
            sendLog(`[AI REQUEST] ${req.method} ${req.url}`);
        }
    });

    // Fires AFTER the response has been fully sent to the client —
    // the stream is already complete, body is available without blocking
    s.on('response', async (res: any) => {
        const url = pendingAiRequests.get(res.id);
        if (!url) { return; }
        pendingAiRequests.delete(res.id);

        if (res.statusCode !== 200) { return; }

        try {
            const text = await res.body.getText();
            if (!text) { return; }
            sendApiResponse(url, text);
        } catch { /* ignore unreadable bodies */ }
    });

    return s;
}

function isAiUrl(url: string): boolean {
    return AI_DOMAINS.some(d => url.includes(d));
}

function sendLog(message: string) {
    if (process.send) { process.send({ type: 'log', message }); }
}

function sendApiResponse(url: string, bodyText: string) {
    if (process.send) { process.send({ type: 'apiResponse', url, bodyText }); }
}
