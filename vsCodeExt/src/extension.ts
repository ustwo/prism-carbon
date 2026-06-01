/****************************************************************
 *                         EXTENSION.TS                         *
 * THE MAIN FILE FOR THE EXTENSION. RESPONSIBLE FOR ACTIVATION, *
 *       REGISTERING COMMANDS, AND MANAGING OVERALL STATE       *
 ****************************************************************/

import * as vscode from "vscode";
import * as budget from "./core/budget";
import { extensionState } from "./extensionState";
import { MyTreeDataProvider } from "./ui/treeView";
import { statusBarManager } from "./ui/statusBar";
import { restoreCallHistory } from "./core/callManager";
import { registerAllCommands } from "./commands/index";
import { registerAllListeners } from "./listeners/index";
import { startInterceptor, stopInterceptor } from "./proxy/proxyManager";
import { stopAutoRefresh } from "./listeners/autoRefreshListener";
import { state } from "./core/state";
import { initLogger, logger } from "./utils/logger";

export async function activate(context: vscode.ExtensionContext) {
  const log = initLogger(context);
  log.info('Estimating Carbon activating...');

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

  extensionState.budg = new budget.budget(context.workspaceState);
  extensionState.bar = new statusBarManager();
  extensionState.tree = new MyTreeDataProvider();
  extensionState.lastAccess = 0;

  vscode.window.registerTreeDataProvider("myPrimaryView", extensionState.tree);

  restoreCallHistory(extensionState.budg);
  extensionState.bar.updateLimit(extensionState.budg.updateLimit());

  const pastCalls = extensionState.budg.getCalls();
  extensionState.bar.updateBar(
    pastCalls.length > 0 ? pastCalls[pastCalls.length - 1].Emissions : 0,
  );

  context.subscriptions.push(
    ...registerAllListeners(context),
    ...registerAllCommands(context),
  );

  await startInterceptor(context.globalStorageUri.fsPath);

  log.info('Estimating Carbon activated');

  return {
    budg: extensionState.budg,
    isInterceptorRunning: () => state.runningInterceptor,
  };
}

export async function deactivate() {
  logger.info('Estimating Carbon deactivating...');
  stopAutoRefresh();
  await stopInterceptor();
}
