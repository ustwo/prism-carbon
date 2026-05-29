/****************************************************************
 *                        INTERCEPTOR.TS                        *
 *  COMMAND: ecode.runtimeAnalysis — OPENS THE PROXY TERMINAL   *
 *  FOR THE DEVELOPER TO RUN THEIR CODE THROUGH THE PROXY.      *
 *  PROXY LIFECYCLE IS MANAGED AUTOMATICALLY BY PROXYMANAGER.TS *
 ****************************************************************/

import * as vscode from 'vscode';
import { openProxyTerminal } from '../proxy/proxyManager';

export function registerInterceptorCommands(): vscode.Disposable[] {
    const runtime = vscode.commands.registerCommand('ecode.runtimeAnalysis', openProxyTerminal);
    return [runtime];
}
