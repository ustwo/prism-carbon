/****************************************************************
 *                         SSEPARSER.TS                         *
 *  GENERIC SSE UTILITY — SPLITS RAW SSE TEXT INTO AN ARRAY     *
 *  OF PARSED EVENT OBJECTS. NO PROVIDER-SPECIFIC LOGIC HERE.   *
 ****************************************************************/

export function isSSE(bodyText: string): boolean {
    return bodyText.trimStart().startsWith('data: ');
}

export function parseSseLines(bodyText: string): unknown[] {
    return bodyText
        .split('\n')
        .filter(line => line.startsWith('data: ') && !line.includes('[DONE]'))
        .flatMap(line => {
            try { return [JSON.parse(line.slice(6))]; }
            catch { return []; }
        });
}
