/**************************************************************************
 *                            SERVERWORKER.TS                             *
 *  PROXY WORKER PROCESS. INTERCEPTS ALL HTTP/HTTPS TRAFFIC AND           *
 *  FORWARDS RAW RESPONSE BODY TEXT FOR AI API ENDPOINTS TO THE PARENT    *
 *  PROCESS VIA IPC — AFTER THE STREAM HAS FULLY COMPLETED AND BEEN       *
 *  DELIVERED TO THE CLIENT. STREAMING EXPERIENCE IS NEVER INTERRUPTED.   *
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
        await startServer(msg.port, msg.storagePath);
    } else if (msg.command === 'stop') {
        if (server) { await server.stop(); }
        process.exit(0);
    }
});

async function startServer(port: number, storagePath: string) {
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

        server = mockttp.getLocal({ https: httpsConfig });

        // Forward all traffic — no body buffering here, stream reaches client immediately
        await server.forAnyRequest().thenPassThrough({
            ignoreHostHttpsErrors: true,
        });

        // Track AI request URLs by id so we can correlate with the response event
        const pendingAiRequests = new Map<string, string>(); // id -> url

        server.on('request', (req: any) => {
            if (isAiUrl(req.url)) {
                pendingAiRequests.set(req.id, req.url);
                sendLog(`[AI REQUEST] ${req.method} ${req.url}`);
            }
        });

        // Fires AFTER the response has been fully sent to the client —
        // the stream is already complete, body is available without blocking
        server.on('response', async (res: any) => {
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

        await server.start(port);

        if (process.send) { process.send({ type: 'started', certPath }); }
    } catch (error: any) {
        if (process.send) { process.send({ type: 'error', message: error.toString() }); }
    }
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
