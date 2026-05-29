/****************************************************************
 *                          SHARED.TS                           *
 *   HOLDS THE MUTABLE SINGLETON REFERENCES SHARED ACROSS THE  *
 *   EXTENSION: BUDGET, TREE VIEW, STATUS BAR, AND PROXY       *
 ****************************************************************/

import type { MyTreeDataProvider } from './ui/treeView';
import type { statusBarManager } from './ui/statusBar';
import type { budget } from './budget';
import type { InterceptorProxy } from './proxyServer';

export const PROXY_PORT = 3024;

export const extensionState: {
    tree?: MyTreeDataProvider;
    bar?: statusBarManager;
    budg?: budget;
    proxyServer?: InterceptorProxy;
    lastAccess: number;
} = {
    lastAccess: 0,
};
