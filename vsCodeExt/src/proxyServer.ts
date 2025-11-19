// // Generate the https server and dynamically generate certificates when a client connects

// import * as mockttp from 'mockttp'
// import * as vscode from 'vscode'
// import * as fs from 'fs';
// import * as path from 'path'


// process.env.NO_PROXY = '*';
// process.env.no_proxy = '*';
// delete process.env.HTTP_PROXY;
// delete process.env.HTTPS_PROXY;
// delete process.env.http_proxy;
// delete process.env.https_proxy;



// // import * as http from 'http';
// // import * as net from 'net';
// // import { URL } from 'url';


// // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// export class InterceptorProxy {
//     private server?: mockttp.Mockttp;
//     private port: number;

//     // see decrypted data
//     private logger: vscode.OutputChannel;
//     public certPath: string = "";

//     constructor(port: number) {
//         this.port = port;
//         this.logger = vscode.window.createOutputChannel("Interceptor");
//         // this.server = mockttp.getLocal()
//     }


//     public async start(storagePath: string) {
//         // make sure storage path exists
//         if (!fs.existsSync(storagePath)) {
//             fs.mkdirSync(storagePath, { recursive: true });
//         }

//         try {


//             //generate self signed certificate of authority - ca - for session
//             const https = await mockttp.generateCACertificate();
//             this.server = mockttp.getLocal({ https });

//             this.certPath = path.join(storagePath, 'mockttp-ca.pem');
//             fs.writeFileSync(this.certPath, https.cert);
//             this.logger.appendLine(`CA Certificate saved to: ${this.certPath}`);

//             await this.server.enableDebug();



//             await this.server.forAnyRequest().thenPassThrough({

//                 ignoreHostHttpsErrors: true,

//                 // read the request
//                 beforeRequest: async (req) => {
//                     const url = req.url;

//                     // filter traffic **used for devtime**
//                     // if (url.includes('copilot') || url.includes('github')) {
//                     const body = await req.body.getText() || '';
//                     this.logger.appendLine(`[REQUEST] -> ${url}`);
//                     this.detectTokens(req.headers, body)
//                     if (body) {
//                         this.logger.appendLine(`Body: ${body.substring(0, 500)}...`)
//                     }
//                     this.logger.appendLine('-------')
//                     // }
//                 },

//                 // read the response
//                 beforeResponse: async (res) => {
//                     const body = await res.body.getText();      // only focus on the body if text
//                     this.logger.appendLine(`[RESPONSE] <- Status: ${res.statusCode}`);
//                     if (body) {
//                         this.logger.appendLine(`Responded Body: ${body.substring(0, 200)}...`);
//                     }
//                     this.logger.appendLine('==========================================================')
//                 }
//             });

//             // start listening on the port
//             await this.server.start(this.port);
//             this.logger.show(true);                             // show outputs
//             this.logger.appendLine(`Interceptor Proxy running on https://localhost:${this.port}`);

//         } catch (error) {
//             vscode.window.showErrorMessage('Error starting proxy: ${error}');
//             console.error("Proxy Start Error:", error);
//         }
//     }



//     public async stop() {
//         try {
//             if (this.server) {
//                 await this.server.stop();
//                 this.logger.appendLine('Interceptor Proxy stopped');
//             }
//         } catch (error) {
//             console.error("Proxy Stop Error:", error);
//         }
//     }

//     private detectTokens(headers: mockttp.Headers, body: string) {
//         const TOKEN_KEYS = ["authorisation", "x-api-key", "api-key", "token", "access_token"];
//         Object.keys(headers).forEach(key => {
//             if (TOKEN_KEYS.includes(key.toLowerCase())) {
//                 const value = headers[key];
//                 this.logTokenFound(`Header [${key}]`, value as string);
//             }
//         });

//         if (body && (body.startsWith('{') || body.startsWith('['))) {
//             try {
//                 const json = JSON.parse(body);
//                 this.scanJsonForTokens(json);
//             } catch (e) {
//                 // Not JSON, ignore
//             }
//         }
//     }

//     private scanJsonForTokens(obj: any) {
//         const TOKEN_MATCHERS = [/token/i, /key/i, /auth/i, /secret/i];

//         if (!obj || typeof obj !== 'object') return;

//         Object.keys(obj).forEach(key => {
//             const value = obj[key];

//             // Check if key matches token patterns
//             if (TOKEN_MATCHERS.some(matcher => matcher.test(key))) {
//                 if (typeof value === 'string' && value.length > 8) { // heuristic for token length
//                     this.logTokenFound(`Body JSON [${key}]`, value);
//                 }
//             }

//             // Recurse if object
//             if (typeof value === 'object') {
//                 this.scanJsonForTokens(value);
//             }
//         });
//     }

//     private logTokenFound(source: string, token: string) {
//         const msg = `🔥🔥 TOKEN DETECTED (${source}): ${token}`;
//         this.logger.appendLine(msg);
//         // Optional: Notify user via UI for immediate visibility
//         vscode.window.showInformationMessage(`Token Detected in ${source}! Check Output.`);
//     }
// }



// //     private handleBlindTunnel(req: http.IncomingMessage, clientSocket: net.Socket, head: Buffer) {
// //         const { port, hostname } = new URL(`http://${req.url}`);
// //         const serverSocket = net.connect(Number(port) || 443, hostname, () => {
// //             clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
// //                 'Proxy-agent: VSCodeInterceptor\r\n' +
// //                 '\r\n');
// //             serverSocket.write(head);
// //             serverSocket.pipe(clientSocket);
// //             clientSocket.pipe(serverSocket);
// //         });

// //         serverSocket.on('error', (err) => {
// //             console.error('Tunnel Error:', err);
// //             clientSocket.end();
// //         });
// //     }



// //     private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
// //         const options = {
// //             hostname: req.headers.host?.split(':')[0],
// //             port: req.headers.host?.split(':')[1] || 80,
// //         };
// //     }
// // }
import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export class InterceptorProxy {
    private child?: cp.ChildProcess;
    private port: number;
    private logger: vscode.OutputChannel;
    public certPath: string = "";

    constructor(port: number) {
        this.port = port;
        this.logger = vscode.window.createOutputChannel("Interceptor");
    }

    public async start(storagePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Point to the compiled JS version of the worker
            // NOTE: Ensure esbuild outputs serverWorker.js to the dist/ folder
            const workerPath = path.join(__dirname, 'serverWorker.js');

            this.child = cp.fork(workerPath, [], {
                env: { ...process.env } // Copy env, but worker will clean it
            });

            this.child.on('message', (msg: any) => {
                if (msg.type === 'started') {
                    this.certPath = msg.certPath;
                    this.logger.show(true);
                    this.logger.appendLine(`Interceptor Proxy running on port ${this.port}`);
                    resolve();
                } else if (msg.type === 'log') {
                    this.logger.appendLine(msg.message);
                    // Optional: Show popup for tokens
                    if (msg.message.includes('🔥🔥')) {
                        vscode.window.showInformationMessage(msg.message);
                    }
                    if (msg.message.includes('>> Analysis:')) {
                        vscode.window.showInformationMessage(msg.message);
                    }
                    if (msg.message.includes('>> Est. Carbon:')) {
                        vscode.window.showInformationMessage(msg.message);
                    }
                } else if (msg.type === 'error') {
                    vscode.window.showErrorMessage(`Proxy Error: ${msg.message}`);
                    reject(msg.message);
                }
            });

            this.child.on('error', (err) => {
                reject(err);
            });

            // Send start command
            this.child.send({ command: 'start', port: this.port, storagePath });
        });
    }

    public async stop() {
        if (this.child) {
            this.child.send({ command: 'stop' });
            this.child.kill(); // Ensure it's dead
            this.logger.appendLine('Interceptor Proxy stopped');
        }
    }
}