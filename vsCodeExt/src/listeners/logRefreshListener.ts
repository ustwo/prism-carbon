/****************************************************************
 *                    LOGREFRESHLISTENER.TS                     *
 *  POLLS COPILOT LOGS ON A CONFIGURABLE INTERVAL TO CATCH      *
 *  INTERACTIONS THAT HAPPEN WITHOUT A FILE SAVE.               *
 *  SETTING: estimatingCarbon.logRefreshIntervalSeconds         *
 *  (0 = disabled). RESTARTS WHEN THE USER CHANGES THE SETTING. *
 ****************************************************************/

import * as vscode from 'vscode';
import { captureFromLogs } from '../core/capture/adapters/log/logAdapter';
import { logger } from '../utils/logger';

const CONFIG_KEY = 'estimatingCarbon.logRefreshIntervalSeconds';

function getIntervalMs(): number {
    const seconds = vscode.workspace.getConfiguration().get<number>(CONFIG_KEY, 15);
    return seconds * 1000;
}

let _stop: (() => void) | undefined;

export function stopLogRefresh(): void {
    _stop?.();
    _stop = undefined;
}

export function registerLogRefreshListener(context: vscode.ExtensionContext): vscode.Disposable[] {
    let timer: ReturnType<typeof setInterval> | undefined;

    function start() {
        const ms = getIntervalMs();
        if (ms <= 0) {
            logger.info('Copilot log refresh disabled (interval set to 0)');
            return;
        }
        logger.info(`Copilot log refresh started — interval: ${ms / 1000}s`);
        timer = setInterval(() => {
            logger.debug('Copilot log refresh tick');
            captureFromLogs(context);
        }, ms);
    }

    function stop() {
        if (timer !== undefined) {
            clearInterval(timer);
            timer = undefined;
            logger.debug('Copilot log refresh stopped');
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
