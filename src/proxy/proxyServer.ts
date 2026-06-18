/*********************************************************************************
 *                                PROXYSERVER.TS                                 *
 *  MANAGES THE FORKED SERVERWORKER CHILD PROCESS VIA IPC.                       *
 *  FORWARDS apiResponse MESSAGES TO THE INTERCEPTORADAPTER FOR PARSING.         *
 *********************************************************************************/

import * as cp from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';
import { logger } from '../utils/logger';

export class InterceptorProxy {
    private child?: cp.ChildProcess;
    private readonly port: number;
    private readonly proxyLog: vscode.OutputChannel;
    private readonly onApiResponse: (url: string, bodyText: string) => void;
    public certPath: string = '';

    constructor(port: number, onApiResponse: (url: string, bodyText: string) => void) {
        this.port = port;
        this.onApiResponse = onApiResponse;
        this.proxyLog = vscode.window.createOutputChannel('PRISM — Proxy');
    }

    public async start(storagePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const workerPath = path.join(__dirname, 'proxy', 'serverWorker.js');

            const { PATH, HOME, TMPDIR, TEMP, TMP,
                    HTTP_PROXY, HTTPS_PROXY, http_proxy, https_proxy,
                    NO_PROXY, no_proxy } = process.env;
            this.child = cp.fork(workerPath, [], {
                env: { PATH, HOME, TMPDIR, TEMP, TMP,
                       HTTP_PROXY, HTTPS_PROXY, http_proxy, https_proxy,
                       NO_PROXY, no_proxy },
                execArgv: [],
            });

            this.child.on('message', (msg: any) => {
                if (msg.type === 'started') {
                    this.certPath = msg.certPath;
                    this.proxyLog.appendLine(`Proxy running on port ${this.port}`);
                    resolve();
                } else if (msg.type === 'log') {
                    this.proxyLog.appendLine(msg.message);
                } else if (msg.type === 'apiResponse') {
                    logger.debug(`API response intercepted: ${msg.url}`);
                    this.onApiResponse(msg.url, msg.bodyText);
                } else if (msg.type === 'error') {
                    logger.error(`Proxy worker error: ${msg.message}`);
                    vscode.window.showErrorMessage(`Proxy Error: ${msg.message}`);
                    reject(msg.message);
                }
            });

            this.child.on('error', reject);

            this.child.on('exit', (code) => {
                if (code !== 0) {
                    logger.error(`Proxy worker exited unexpectedly with code ${code}`);
                    reject(new Error(`Worker exited with code ${code}`));
                }
            });

            this.child.send({ command: 'start', port: this.port, storagePath });
        });
    }

    public async stop(): Promise<void> {
        if (this.child) {
            this.child.send({ command: 'stop' });
            this.child.kill();
            this.proxyLog.appendLine('Proxy stopped');
        }
    }
}
