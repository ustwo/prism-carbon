import { CaptureProvider, TokenResult } from '../captureProvider';

export const geminiProvider: CaptureProvider = {
    id: 'gemini',
    displayName: 'Google Gemini',

    matches(url: string): boolean {
        return url.includes('generativelanguage.googleapis.com');
    },

    parseTokens(body: unknown): TokenResult | null {
        const b = body as any;
        if (!b?.usageMetadata) { return null; }
        return {
            model: b.modelVersion ?? 'gemini-unknown',
            totalTokens: b.usageMetadata.totalTokenCount ?? 0,
        };
    },

    // Gemini SSE sends usageMetadata in the final event.
    parseSSE(events: unknown[]): TokenResult | null {
        for (const e of events as any[]) {
            if (e.usageMetadata) {
                return {
                    model: e.modelVersion ?? 'gemini-unknown',
                    totalTokens: e.usageMetadata.totalTokenCount ?? 0,
                };
            }
        }
        return null;
    },
};
