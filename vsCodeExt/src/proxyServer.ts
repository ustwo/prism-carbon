// Generate the https server and dynamically generate certificates when a client connects

import * as mockttp from 'mockttp'
import * as vscode from 'vscode'
import * as fs from 'fs';
import * as path from 'path'


process.env.NO_PROXY = '*';
process.env.no_proxy = '*';
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;



// import * as http from 'http';
// import * as net from 'net';
// import { URL } from 'url';


// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
export class InterceptorProxy {
    private server?: mockttp.Mockttp;
    private port: number;

    // see decrypted data
    private logger: vscode.OutputChannel;

    constructor(port: number) {
        this.port = port;
        this.logger = vscode.window.createOutputChannel("Interceptor");
        // this.server = mockttp.getLocal()
    }

    public certPath: string = "";


    public async start(storagePath: string) {
        // make sure storage path exists
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }

        try {


            //generate self signed certificate of authority - ca - for session
            const https = await mockttp.generateCACertificate();
            this.server = mockttp.getLocal({ https });

            this.certPath = path.join(storagePath, 'mockttp-ca.pem');
            fs.writeFileSync(this.certPath, https.cert);
            this.logger.appendLine(`CA Certificate saved to: ${this.certPath}`);

            await this.server.enableDebug();



            await this.server.forAnyRequest().thenPassThrough({

                ignoreHostHttpsErrors: true,

                // read the request
                beforeRequest: async (req) => {
                    const url = req.url;

                    // filter traffic **used for devtime**
                    // if (url.includes('copilot') || url.includes('github')) {
                    const body = await req.body.getText()
                    this.logger.appendLine(`[REQUEST] -> ${url}`);
                    this.logger.appendLine(`Method: ${req.method}`)
                    if (body) {
                        this.logger.appendLine(`Body: ${body.substring(0, 500)}...`)
                    }
                    this.logger.appendLine('-------')
                    // }
                },

                // read the response
                beforeResponse: async (res) => {
                    const body = await res.body.getText();      // only focus on the body if text
                    this.logger.appendLine(`[RESPONSE] <- Status: ${res.statusCode}`);
                    if (body) {
                        this.logger.appendLine(`Responded Body: ${body.substring(0, 200)}...`);
                    }
                    this.logger.appendLine('==========================================================')
                }
            });

            // start listening on the port
            await this.server.start(this.port);
            this.logger.show(true);                             // show outputs
            this.logger.appendLine(`Interceptor Proxy running on https://localhost:${this.port}`);

        } catch (error) {
            vscode.window.showErrorMessage('Error starting proxy: ${error}');
            console.error("Proxy Start Error:", error);
        }
    }



    public async stop() {
        try {
            if (this.server) {
                await this.server.stop();
                this.logger.appendLine('Interceptor Proxy stopped');
            }
        } catch (error) {
            console.error("Proxy Stop Error:", error);
        }
    }
}



//     private handleBlindTunnel(req: http.IncomingMessage, clientSocket: net.Socket, head: Buffer) {
//         const { port, hostname } = new URL(`http://${req.url}`);
//         const serverSocket = net.connect(Number(port) || 443, hostname, () => {
//             clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
//                 'Proxy-agent: VSCodeInterceptor\r\n' +
//                 '\r\n');
//             serverSocket.write(head);
//             serverSocket.pipe(clientSocket);
//             clientSocket.pipe(serverSocket);
//         });

//         serverSocket.on('error', (err) => {
//             console.error('Tunnel Error:', err);
//             clientSocket.end();
//         });
//     }



//     private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
//         const options = {
//             hostname: req.headers.host?.split(':')[0],
//             port: req.headers.host?.split(':')[1] || 80,
//         };
//     }
// }