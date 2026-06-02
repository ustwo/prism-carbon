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
import { BudgetMiniViewProvider } from "./ui/budgetMiniView";
import { restoreCallHistory } from "./core/callManager";
import { registerAllCommands } from "./commands/index";
import { registerAllListeners } from "./listeners/index";
import { startCapture, stopCapture } from "./core/capture/adapters/interceptor/interceptorAdapter";
import { initializeLastAccess } from "./core/capture/adapters/log/logAdapter";
import { stopLogRefresh } from "./listeners/logRefreshListener";
import { state } from "./core/state";
import { initLogger, logger } from "./utils/logger";

export async function activate(context: vscode.ExtensionContext) {
  const log = initLogger(context);
  log.info('Estimating Carbon activating...');

  extensionState.budg = new budget.budget(context.workspaceState);
  extensionState.bar = new statusBarManager();
  extensionState.tree = new MyTreeDataProvider();
  extensionState.lastAccess = 0;

  vscode.window.registerTreeDataProvider("myPrimaryView", extensionState.tree);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      BudgetMiniViewProvider.viewType,
      new BudgetMiniViewProvider(extensionState.budg!, context.extensionUri),
    )
  );

  restoreCallHistory(extensionState.budg);
  extensionState.bar.updateLimit(extensionState.budg.updateLimit());

  const allCalls = extensionState.budg.getCalls();
  const windowStart = extensionState.budg.getBudgetWindowStart();
  // Only initialize lastAccess from calls in the current session window.
  // Using all-time latest would block capturing calls made after a clear.
  const sessionCalls = allCalls.filter(c => c.DateTime >= windowStart);
  // Use max(latest session call, windowStart) so that after a clear,
  // lastAccess = windowStart and log capture only picks up new calls.
  const latestSessionCall = sessionCalls.reduce((max, c) => c.DateTime > max ? c.DateTime : max, 0);
  initializeLastAccess(Math.max(latestSessionCall, windowStart));
  extensionState.bar.updateBar(
    sessionCalls.length > 0 ? sessionCalls[sessionCalls.length - 1].Emissions : 0,
  );

  context.subscriptions.push(
    ...registerAllListeners(context),
    ...registerAllCommands(context),
  );

  await startCapture(context.globalStorageUri.fsPath);

  log.info('Estimating Carbon activated');

  return {
    budg: extensionState.budg,
    isInterceptorRunning: () => state.runningInterceptor,
  };
}

export async function deactivate() {
  logger.info('Estimating Carbon deactivating...');
  stopLogRefresh();
  await stopCapture();
}
