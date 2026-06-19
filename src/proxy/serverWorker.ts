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

        let httpsConfig;
        if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
            httpsConfig = {
                key: fs.readFileSync(keyPath, 'utf-8'),
                cert: fs.readFileSync(certPath, 'utf-8'),
            };
        } else {
            const generated = await mockttp.generateCACertificate({
                subject: { commonName: 'Ecode Proxy CA' },
                bits: 2048,
            });
            fs.writeFileSync(keyPath, generated.key);
            fs.writeFileSync(certPath, generated.cert);
            httpsConfig = { key: generated.key, cert: generated.cert };
        }

        const boundPort = await bindServer(httpsConfig, preferredPort);

        if (process.send) { process.send({ type: 'started', certPath, port: boundPort }); }
    } catch (error: any) {
        if (process.send) { process.send({ type: 'error', message: error.toString() }); }
    }
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

    // Forward all traffic — no body buffering here, stream reaches client immediately
    await s.forAnyRequest().thenPassThrough({
        ignoreHostHttpsErrors: true,
    });

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
