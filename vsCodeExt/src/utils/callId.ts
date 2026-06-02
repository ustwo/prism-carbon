/****************************************************************
 *                         CALLID.TS                           *
 *  SHARED UTILITIES FOR MODEL NORMALISATION AND CALL-ID       *
 *  FINGERPRINTING USED BY ALL CAPTURE PROVIDERS AND THE       *
 *  DEDUPLICATION LOGIC IN CALLMANAGER.                        *
 ****************************************************************/

// Normalise vendor model IDs so cross-provider variants match.
// "claude-haiku-4.5"  →  "claude-haiku-4-5"
// "claude-haiku-4-5-20251001"  →  "claude-haiku-4-5"
export function normalizeModel(model: string): string {
    return model
        .replace(/-\d{8}$/, '')   // strip date suffix (-20251001)
        .replace(/\./g, '-')      // dots to hyphens (4.5 → 4-5)
        .toLowerCase();
}

// Deterministic content fingerprint from exact token counts.
// Both providers reading the same API call will compute the same callId,
// enabling exact cross-provider deduplication without relying on timestamps.
export function makeCallId(
    model: string,
    inputTokens: number,
    outputTokens: number,
    cacheCreationTokens: number,
    cacheReadTokens: number,
): string {
    return [
        normalizeModel(model),
        inputTokens,
        outputTokens,
        cacheCreationTokens,
        cacheReadTokens,
    ].join('|');
}
