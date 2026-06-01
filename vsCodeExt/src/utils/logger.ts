/****************************************************************
 *                          LOGGER.TS                           *
 *  CENTRALISED LOGGING VIA VSCODE'S NATIVE LOG OUTPUT CHANNEL *
 *  LEVELS: error / warn / info / debug / trace                 *
 *  VIEW IN: Output panel → "Estimating Carbon"                 *
 ****************************************************************/

import * as vscode from 'vscode';

let _channel: vscode.LogOutputChannel | undefined;

export function initLogger(context: vscode.ExtensionContext): vscode.LogOutputChannel {
    _channel = vscode.window.createOutputChannel('Estimating Carbon', { log: true });
    context.subscriptions.push(_channel);
    return _channel;
}

export const logger = {
    error: (msg: string, ...args: unknown[]) => _channel?.error(msg, ...args),
    warn:  (msg: string, ...args: unknown[]) => _channel?.warn(msg, ...args),
    info:  (msg: string, ...args: unknown[]) => _channel?.info(msg, ...args),
    debug: (msg: string, ...args: unknown[]) => _channel?.debug(msg, ...args),
    trace: (msg: string, ...args: unknown[]) => _channel?.trace(msg, ...args),
};
