/*****************************************************************
 *                       FILELOGGER.TS                           *
 *  WRITES ONE FILE PER CALL INTO .footprints/ AT THE            *
 *  WORKSPACE ROOT. FILENAME ENCODES ALL MEANINGFUL DATA SO      *
 *  THE ARTEFACTS ARE READABLE IN GIT HISTORY AND PRs.           *
 *                                                           .   *
 *  Format: GGGGGG-{modelname}-YYYY-MM-DD-ZZZZZ              .   *
 *    GGGGGG — integer grams CO₂e, 0-padded to 6 digits      .   *
 *    ZZZZZ  — 5-char URL-safe base64 collision-avoidance suffix *
 ****************************************************************/

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Call } from './budget';
import { logger } from '../utils/logger';

// URL-safe base64 alphabet (RFC 4648 §5) — no + or / so filenames stay safe
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function randomSuffix(length: number): string {
    let s = '';
    for (let i = 0; i < length; i++) {
        s += B64[Math.floor(Math.random() * B64.length)];
    }
    return s;
}

export function writeFootprintFile(call: Call): void {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        logger.warn('writeFootprintFile: no workspace folders — skipping');
        return;
    }

    const dir = path.join(folders[0].uri.fsPath, '.footprints');
    if (!fs.existsSync(dir)) {
        logger.warn('writeFootprintFile: no .footprints directory — skipping');
        return;
    }

    try {
        const date    = new Date(call.DateTime);
        const grams   = String(Math.round(call.Emissions)).padStart(6, '0');
        const model   = call.Model.replace(/[^A-Za-z0-9-]/g, '-');
        const dateStr = date.toISOString().split('T')[0];
        const suffix  = randomSuffix(5);

        const filename = `${grams}-${model}-${dateStr}-${suffix}`;
        const source   = call.Source ?? 'Log';
        const content  = `[${source}] ${call.Model} — ${call.Emissions}g CO₂e — ${date.toLocaleString()}\n`;

        const filePath = path.join(dir, filename);
        fs.writeFileSync(filePath, content, 'utf-8');
        logger.debug(`Footprint written: ${filePath}`);
    } catch (err) {
        logger.error(`writeFootprintFile failed: ${err}`);
    }
}
