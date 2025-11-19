import * as mockttp from 'mockttp';
import * as fs from 'fs';
import * as path from 'path';

// ==========================================================
// 1. THE FIX: Clean Environment for this Child Process
// This ensures this process connects DIRECTLY to the internet
// ==========================================================
process.env.HTTP_PROXY = '';
process.env.HTTPS_PROXY = '';
process.env.NO_PROXY = '*';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Trust upstream firewalls

let server: mockttp.Mockttp | null = null;

// 2. Listen for commands from the main Extension
process.on('message', async (msg: any) => {
    if (msg.command === 'start') {
        await startServer(msg.port, msg.storagePath);
    } else if (msg.command === 'stop') {
        if (server) await server.stop();
        process.send?.({ type: 'log', message: 'Proxy Worker Stopped' });
    }
});

async function startServer(port: number, storagePath: string) {
    try {
        // Ensure storage folder exists
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }

        // Generate CA
        const https = await mockttp.generateCACertificate();

        // Save CA to file
        const certPath = path.join(storagePath, 'mockttp-ca.pem');
        fs.writeFileSync(certPath, https.cert);

        // Create Server
        server = mockttp.getLocal({
            https,
            debug: true
        });

        await server.enableDebug();

        // Define Rules
        await server.forAnyRequest().thenPassThrough({
            ignoreHostHttpsErrors: true,
            beforeRequest: async (req) => {
                // Send data back to parent process
                process.send?.({ type: 'log', message: `[REQUEST] -> ${req.url}` });
            },
            beforeResponse: async (res) => {
                const body = await res.body.getText();
                process.send?.({
                    type: 'log',
                    message: `[RESPONSE] <- ${res.statusCode} (Body: ${body.substring(0, 100)}...)`
                });
            }
        });

        await server.start(port);

        // Tell parent we are ready
        process.send?.({ type: 'started' });
        process.send?.({ type: 'log', message: `Proxy running on port ${port}` });

    } catch (error: any) {
        process.send?.({ type: 'error', message: error.toString() });
    }
}