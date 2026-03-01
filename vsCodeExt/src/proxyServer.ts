import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
// import { treeDataProvider } from './extension';
import { updateTree } from './extension';
import * as budget from './budget';
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript';

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
            let id: string = " ";
            let mod: string = " ";
            let cost: number = 0;
            // point to compiled serverWorker
            const workerPath = path.join(__dirname, 'serverWorker.js');

            this.child = cp.fork(workerPath, [], {
                env: { ...process.env }
            });

            this.child.on('message', (msg: any) => {
                if (msg.type === 'started') {
                    this.certPath = msg.certPath;
                    this.logger.show(true);
                    this.logger.appendLine(`Interceptor Proxy running on port ${this.port}`);
                    resolve();
                } else if (msg.type === 'log') {
                    let fullCall = false;
                    // check message content, and show popups. 

                    //!! purely for Dev, can be removed in main once incoorperated with UI
                    this.logger.appendLine(msg.message);
                    if (msg.message.includes('>> DateTime:')) {
                        id = msg.message.slice(16);
                        console.log(`id: ${id}`);
                    }
                    if (msg.message.includes('>> Model:')) {
                        // vscode.window.showInformationMessage(msg.message);
                        mod = msg.message.slice(13);
                        console.log(`model: ${mod}`);
                    }
                    if (msg.message.includes('>> Emissions:')) {
                        // vscode.window.showInformationMessage(msg.message);
                        cost = msg.message.slice(17);
                        fullCall = true;
                        console.log(`cost: ${cost}`);
                    }
                    if (fullCall === true) {
                        console.log(`id: ${id}, model: ${mod}, cost: ${cost}`);
                        var call: budget.Call = { DateTime: new Date(id).getTime(), Model: mod, Emissions: +cost };
                        updateTree(call);
                    }
                } else if (msg.type === 'error') {
                    vscode.window.showErrorMessage(`Proxy Error: ${msg.message}`);
                    reject(msg.message);
                }
            });

            this.child.on('error', (err) => {
                reject(err);
            });

            // start server
            this.child.send({ command: 'start', port: this.port, storagePath });
        });
    }

    public async stop() {
        if (this.child) {
            this.child.send({ command: 'stop' });
            this.child.kill(); // ensure stopped
            this.logger.appendLine('Interceptor Proxy stopped');
        }
    }
}