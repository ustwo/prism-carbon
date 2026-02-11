"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterceptorProxy = void 0;
const vscode = __importStar(require("vscode"));
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
// import { treeDataProvider } from './extension';
const extension_1 = require("./extension");
class InterceptorProxy {
    child;
    port;
    logger;
    certPath = "";
    constructor(port) {
        this.port = port;
        this.logger = vscode.window.createOutputChannel("Interceptor");
    }
    async start(storagePath) {
        return new Promise((resolve, reject) => {
            let id = " ";
            let mod = " ";
            let cost = 0;
            // point to compiled serverWorker
            const workerPath = path.join(__dirname, 'serverWorker.js');
            this.child = cp.fork(workerPath, [], {
                env: { ...process.env }
            });
            this.child.on('message', (msg) => {
                if (msg.type === 'started') {
                    this.certPath = msg.certPath;
                    this.logger.show(true);
                    this.logger.appendLine(`Interceptor Proxy running on port ${this.port}`);
                    resolve();
                }
                else if (msg.type === 'log') {
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
                        var call = { DateTime: id, Model: mod, Emissions: +cost };
                        (0, extension_1.updateTree)(call);
                    }
                }
                else if (msg.type === 'error') {
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
    async stop() {
        if (this.child) {
            this.child.send({ command: 'stop' });
            this.child.kill(); // ensure stopped
            this.logger.appendLine('Interceptor Proxy stopped');
        }
    }
}
exports.InterceptorProxy = InterceptorProxy;
//# sourceMappingURL=proxyServer.js.map