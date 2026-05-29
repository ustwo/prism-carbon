/****************************************************************
 *                         EXTENSION.TS                         *
 * THE MAIN FILE FOR THE EXTENSION. RESPONSIBLE FOR ACTIVATION, *
 *       REGISTERING COMMANDS, AND MANAGING OVERALL STATE       *
 ****************************************************************/

import * as vscode from "vscode";
import * as budget from "./budget";
import { shared } from "./extensionState";
import { MyTreeDataProvider } from "./ui/treeView";
import { statusBarManager } from "./ui/statusBar";
import { restoreCallHistory } from "./callManager";
import { registerAllCommands } from "./commands/index";
import { registerAllListeners } from "./listeners/index";
import { state } from "./state";

export async function activate(context: vscode.ExtensionContext) {
  const copilotChat = vscode.extensions.getExtension("github.copilot-chat");
  if (!copilotChat) {
    vscode.window.showWarningMessage(
      "GitHub Copilot Chat is not installed. Carbon emissions will not be tracked during development time!",
    );
  } else {
    if (!copilotChat.isActive) {
      await copilotChat.activate();
    }
    vscode.commands.executeCommand("workbench.action.setLogLevel");
    vscode.window.showInformationMessage(
      'Please Select "Github Copilot Chat" then "Trace" in the above command window',
    );
  }

  shared.budg = new budget.budget(context.workspaceState);
  shared.bar = new statusBarManager();
  shared.tree = new MyTreeDataProvider();
  shared.lastAccess = 0;

  vscode.window.registerTreeDataProvider("myPrimaryView", shared.tree);

  restoreCallHistory(shared.budg);
  shared.bar.updateLimit(shared.budg.updateLimit());

  const pastCalls = shared.budg.getCalls();
  shared.bar.updateBar(
    pastCalls.length > 0 ? pastCalls[pastCalls.length - 1].Emissions : 0,
  );

  context.subscriptions.push(
    ...registerAllListeners(context),
    ...registerAllCommands(context),
  );

  return {
    budg: shared.budg,
    isInterceptorRunning: () => state.runningInterceptor,
  };
}

export async function deactivate() {
  if (shared.proxyServer) {
    await shared.proxyServer.stop();
  }
}
