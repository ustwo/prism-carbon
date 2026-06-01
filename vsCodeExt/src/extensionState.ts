/****************************************************************
 *                       EXTENSIONSTATE.TS                      *
 *   HOLDS THE MUTABLE SINGLETON REFERENCES SHARED ACROSS THE  *
 *        EXTENSION: BUDGET, TREE VIEW AND STATUS BAR           *
 ****************************************************************/

import type { MyTreeDataProvider } from './ui/treeView';
import type { statusBarManager } from './ui/statusBar';
import type { budget } from './core/budget';

export const PROXY_PORT = 3024;

export const extensionState: {
    tree?: MyTreeDataProvider;
    bar?: statusBarManager;
    budg?: budget;
    lastAccess: number;
} = {
    lastAccess: 0,
};
