/*********************************************************************************
 *                                PROXYSERVER.TS                                 *
 * CREATES AND MANAGES A BACKGROUND PROCESS RUNNING THE INTERCEPTOR PROXY SERVER *
 *    SPAWNS SERVER AND WORKER PROCESSES, COMMUNICATES VIA IPC MESSAGES, AND     *
 *        DISPLAYS LOGS WHILST EXTRACTING AI USAGE METRICS TO BE RECORDED        *
 *********************************************************************************/


import * as cp from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';
import * as budget from './budget';

// manages a background process running the proxy server
// spawns server and worker, communicates via IPC messages
// displays logs in VSCode and extracts AI usage metrics
export class InterceptorProxy {
    private child?: cp.ChildProcess;
    private port: number;
    private logger: vscode.OutputChannel;
    public certPath: string = "";
    private onCallRecorded:(call: budget.Call) => void;

    constructor(port: number, onCallRecorded:(call: budget.Call) => void) {
        this.port = port;
        this.onCallRecorded = onCallRecorded;
        // create output channel for logs
        this.logger = vscode.window.createOutputChannel("Interceptor");
    }

    public async start(storagePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // hold parsed data to be sent to be recorded as a call after logging
            let id: string = " ";
            let mod: string = " ";
            let cost: number = 0;
            // point to compiled serverWorker
            const workerPath = path.join(__dirname, 'serverWorker.js');

            // fork  new node process to run proxy worker
            // give current environment variables
            this.child = cp.fork(workerPath, [], {
                env: { ...process.env },
                execArgv: []
            });
            
            //Listen for IPC messages from worker process
            this.child.on('message', (msg: any) => {
                if (msg.type === 'started') {
                    this.certPath = msg.certPath;
                    this.logger.show(true);
                    this.logger.appendLine(`Interceptor Proxy running on port ${this.port}`);
                    resolve();
                } else if (msg.type === 'log') {
                    let fullCall = false;

                    // check message content, and show popups. 
                    this.logger.appendLine(msg.message);
                    if (msg.message.includes('>> DateTime:')) {
                        id = msg.message.slice(16);
                        console.log(`id: ${id}`);
                    }
                    if (msg.message.includes('>> Model:')) {
                        mod = msg.message.slice(13);
                        console.log(`model: ${mod}`);
                    }
                    if (msg.message.includes('>> Emissions:')) {
                        cost = msg.message.slice(17);
                        fullCall = true;
                        console.log(`cost: ${cost}`);
                    }
                    if (fullCall === true) {
                        console.log(`id: ${id}, model: ${mod}, cost: ${cost}`);
                        var call: budget.Call = { DateTime: new Date(id).getTime(), Model: mod, Emissions: +cost };
                        // fire callback to register the cost
                        this.onCallRecorded(call);
                    }
                } 
                // display error message if the worker crashes
                else if (msg.type === 'error') {
                    vscode.window.showErrorMessage(`Proxy Error: ${msg.message}`);
                    reject(msg.message);
                }
            });
            // handles process level errors
            this.child.on('error', (err) => {
                reject(err);
            });
            
            //handles unexpected exits of worker process
            this.child.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker exited with code ${code}`));
                    console.log(`Worker exited with code ${code}`);
                };
            });

            // start server
            this.child.send({ command: 'start', port: this.port, storagePath });
        });
    }
    // gracefully stop proxy server
    public async stop() {
        if (this.child) {
            this.child.send({ command: 'stop' });
            this.child.kill(); // ensure stopped
            this.logger.appendLine('Interceptor Proxy stopped');
        }
    }
}