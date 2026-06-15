import { CaptureProvider, TokenResult } from '../../../captureProvider';

// Covers OpenAI, GitHub Copilot (api.github.com/copilot) and Codex —
// all use the same OpenAI response format.
export const openaiProvider: CaptureProvider = {
    id: 'openai',
    displayName: 'OpenAI / Copilot / Codex',

    matches(url: string): boolean {
        return url.includes('api.openai.com') || url.includes('api.github.com');
    },

    parseTokens(body: unknown): TokenResult | null {
        const b = body as any;
        if (!b?.model || !b?.usage) { return null; }
        return {
            model: b.model,
            totalTokens: (b.usage.prompt_tokens ?? 0) + (b.usage.completion_tokens ?? 0),
        };
    },

    // OpenAI streaming sends usage in the final chunk when stream_options.include_usage is set.
    // Model is available in every chunk.
    parseSSE(events: unknown[]): TokenResult | null {
        let model = '';
        let inputTokens = 0;
        let outputTokens = 0;

        for (const e of events as any[]) {
            if (!model && e.model) { model = e.model; }
            if (e.usage) {
                if (!inputTokens) { inputTokens = e.usage.prompt_tokens ?? 0; }
                if (!outputTokens) { outputTokens = e.usage.completion_tokens ?? 0; }
            }
        }

        if (!model) { return null; }
        return { model, totalTokens: inputTokens + outputTokens };
    },
};
