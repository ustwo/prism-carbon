"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode2 = __toESM(require("vscode"));

// src/proxyServer.ts
var vscode = __toESM(require("vscode"));
var cp = __toESM(require("child_process"));
var path = __toESM(require("path"));
var InterceptorProxy = class {
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
      const workerPath = path.join(__dirname, "serverWorker.js");
      this.child = cp.fork(workerPath, [], {
        env: { ...process.env }
        // Copy env, but worker will clean it
      });
      this.child.on("message", (msg) => {
        if (msg.type === "started") {
          this.certPath = msg.certPath;
          this.logger.show(true);
          this.logger.appendLine(`Interceptor Proxy running on port ${this.port}`);
          resolve();
        } else if (msg.type === "log") {
          this.logger.appendLine(msg.message);
          if (msg.message.includes("\u{1F525}\u{1F525}")) {
            vscode.window.showInformationMessage(msg.message);
          }
          if (msg.message.includes(">> Analysis:")) {
            vscode.window.showInformationMessage(msg.message);
          }
          if (msg.message.includes(">> Est. Carbon:")) {
            vscode.window.showInformationMessage(msg.message);
          }
        } else if (msg.type === "error") {
          vscode.window.showErrorMessage(`Proxy Error: ${msg.message}`);
          reject(msg.message);
        }
      });
      this.child.on("error", (err) => {
        reject(err);
      });
      this.child.send({ command: "start", port: this.port, storagePath });
    });
  }
  async stop() {
    if (this.child) {
      this.child.send({ command: "stop" });
      this.child.kill();
      this.logger.appendLine("Interceptor Proxy stopped");
    }
  }
};

// src/extension.ts
var proxyServer;
var PROXY_PORT = 3024;
function activate(context) {
  console.log("Interceptor Proxy Server is active");
  let startDisposable = vscode2.commands.registerCommand("interceptor.start", async () => {
    try {
      proxyServer = new InterceptorProxy(PROXY_PORT);
      await proxyServer.start(context.globalStorageUri.fsPath);
      const config = vscode2.workspace.getConfiguration("http");
      await config.update("proxy", `http://localhost:${PROXY_PORT}`, vscode2.ConfigurationTarget.Global);
      await config.update("proxyStrictSSL", false, vscode2.ConfigurationTarget.Global);
      vscode2.window.showInformationMessage("Interceptor Proxy started on port " + PROXY_PORT);
    } catch (error) {
      vscode2.window.showErrorMessage("Failed to start Interceptor Proxy: " + error);
    }
  });
  let stopDisposable = vscode2.commands.registerCommand("interceptor.stop", async () => {
    if (proxyServer) {
      proxyServer.stop();
    }
    const config = vscode2.workspace.getConfiguration("http");
    await config.update("proxy", void 0, vscode2.ConfigurationTarget.Global);
    await config.update("proxyStrictSSL", void 0, vscode2.ConfigurationTarget.Global);
    vscode2.window.showInformationMessage("Interceptor Proxy stopped. Proxy settings cleared.");
  });
  let terminalDisposable = vscode2.commands.registerCommand("interceptor.openTerminal", async () => {
    if (!proxyServer) {
      vscode2.window.showErrorMessage("There is no Interceptor Proxy Running. Please initiate `interceptor.start`");
      return;
    }
    const proxyUrl = `http://127.0.0.1:${PROXY_PORT}`;
    const terminal = vscode2.window.createTerminal({
      name: "Estimating Carbon Terminal",
      env: {
        //Standard Proxy Vars
        "HTTP_PROXY": proxyUrl,
        "HTTPS_PROXY": proxyUrl,
        "http_proxy": proxyUrl,
        "https_proxy": proxyUrl,
        // python specific
        "REQUESTS_CA_BUNDLE": proxyServer.certPath,
        // NODE JS SPECIFIC: Trust the proxy
        "NODE_EXTRA_CA_CERTS": proxyServer.certPath
      }
    });
    terminal.show();
    vscode2.window.showInformationMessage("Opened Terminal with Proxy Environment Vars");
  });
  context.subscriptions.push(terminalDisposable);
  context.subscriptions.push(startDisposable);
  context.subscriptions.push(stopDisposable);
}
async function deactivate() {
  if (proxyServer) {
    await proxyServer.stop();
  }
  const config = vscode2.workspace.getConfiguration("http");
  await config.update("proxy", void 0, vscode2.ConfigurationTarget.Global);
  await config.update("proxyStrictSSL", void 0, vscode2.ConfigurationTarget.Global);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
