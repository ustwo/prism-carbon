/****************************************************************
 *                   AUTOREFRESHLISTENER.TS                     *
 *  POLLS COPILOT LOGS ON A CONFIGURABLE INTERVAL.              *
 *  SETTING: estimatingCarbon.refreshIntervalSeconds            *
 *  (0 = disabled). RESTARTS AUTOMATICALLY WHEN THE USER        *
 *  CHANGES THE SETTING VIA VSCODE SETTINGS UI.                 *
 ****************************************************************/

import * as vscode from 'vscode';
import { getLogs } from '../core/callManager';
import { logger } from '../utils/logger';

const CONFIG_KEY = 'estimatingCarbon.refreshIntervalSeconds';

function getIntervalMs(): number {
    const seconds = vscode.workspace.getConfiguration().get<number>(CONFIG_KEY, 15);
    return seconds * 1000;
}

let _stop: (() => void) | undefined;

export function stopAutoRefresh() {
    _stop?.();
}

export function registerAutoRefreshListener(context: vscode.ExtensionContext): vscode.Disposable[] {
    let timer: ReturnType<typeof setInterval> | undefined;

    function start() {
        const ms = getIntervalMs();
        if (ms <= 0) {
            logger.info('Auto-refresh disabled — logs will refresh on file save only');
            return;
        }
        logger.info(`Auto-refresh started — interval: ${ms / 1000}s`);
        timer = setInterval(() => {
            logger.debug('Auto-refresh tick — reading Copilot logs');
            getLogs(context);
        }, ms);
    }

    function stop() {
        if (timer !== undefined) {
            clearInterval(timer);
            timer = undefined;
            logger.debug('Auto-refresh stopped');
        }
    }

    _stop = stop;
    start();

    const configListener = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(CONFIG_KEY)) {
            stop();
            start();
        }
    });

    return [
        configListener,
        { dispose: stop },
    ];
}
