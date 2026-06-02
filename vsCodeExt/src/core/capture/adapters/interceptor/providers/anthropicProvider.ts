import { CaptureProvider, TokenResult } from '../../../captureProvider';

export const anthropicProvider: CaptureProvider = {
    id: 'anthropic',
    displayName: 'Anthropic (Claude)',

    matches(url: string): boolean {
        return url.includes('api.anthropic.com');
    },

    parseTokens(body: unknown): TokenResult | null {
        const b = body as any;
        if (!b?.model || !b?.usage) { return null; }
        return {
            model: b.model,
            totalTokens: (b.usage.input_tokens ?? 0) + (b.usage.output_tokens ?? 0),
        };
    },

    parseSSE(events: unknown[]): TokenResult | null {
        let model = '';
        let inputTokens = 0;
        let outputTokens = 0;

        for (const e of events as any[]) {
            if (e.type === 'message_start' && e.message) {
                if (!model) { model = e.message.model ?? ''; }
                if (!inputTokens) { inputTokens = e.message.usage?.input_tokens ?? 0; }
            }
            if (e.type === 'message_delta' && e.usage) {
                if (!outputTokens) { outputTokens = e.usage.output_tokens ?? 0; }
            }
        }

        if (!model) { return null; }
        return { model, totalTokens: inputTokens + outputTokens };
    },
};
