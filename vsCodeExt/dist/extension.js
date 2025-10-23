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
var vscode = __toESM(require("vscode"));
function activate(context) {
  const barManager = vscode.window.createStatusBarItem();
  const loading = [];
  barManager.text = "Limit:";
  barManager.show();
  for (var i = 0; i < 10; i++) {
    loading.push(vscode.window.createStatusBarItem());
    loading[i].text = "-";
    loading[i].show();
  }
  context.subscriptions.push(barManager);
  console.log('Congratulations, your extension "vsCodeExt" is now active!');
  const disposable = vscode.commands.registerCommand("vsCodeExt.helloWorld", () => {
    vscode.window.showInformationMessage("Hello World from EstimatingCarbon!");
  });
  const input = vscode.commands.registerCommand("vsCodeExt.inputdisplay", async () => {
    const limit = await vscode.window.showInputBox({
      //opens an input box currently representing the carbon footprint
      prompt: "enter your carbon limit",
      placeHolder: "eg. 5",
      ignoreFocusOut: true
      // keep input box open even if focus moves away from window
    });
    var num = Number(limit);
    var colour = "statusBarItem.activeBackground";
    if (num) {
      if (num >= 8) {
        colour = "statusBarItem.errorBackground";
        vscode.window.showInformationMessage("passed limit");
      } else {
        colour = "statusBarItem.warningBackground";
        vscode.window.showInformationMessage("below limit");
      }
      var i2 = 0;
      vscode.window.showInformationMessage(colour);
    } else {
      colour = "statusBarItem.activeBackground";
      num = 0;
      vscode.window.showInformationMessage("not satisfied!");
    }
    for (i2 = 0; i2 < num; i2++) {
      loading[i2].backgroundColor = new vscode.ThemeColor(colour);
    }
    for (i2; i2 < loading.length; i2++) {
      loading[i2].backgroundColor = new vscode.ThemeColor("statusBarItem.activeBackground");
    }
    barManager.backgroundColor = new vscode.ThemeColor(colour);
  });
  context.subscriptions.push(input);
  context.subscriptions.push(disposable);
  const treeDataProvider = new MyTreeDataProvider();
  vscode.window.registerTreeDataProvider(
    "myPrimaryView",
    new MyTreeDataProvider()
  );
}
function deactivate() {
}
var MyTreeDataProvider = class {
  _onDidChangeTreeData = new vscode.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (element) {
      return Promise.resolve([]);
    } else {
      const infoMessage = new vscode.TreeItem(
        "Here you will be able to track tokens and carbon emission",
        vscode.TreeItemCollapsibleState.None
      );
      return Promise.resolve([infoMessage]);
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
