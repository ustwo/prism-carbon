# Adding a New LLM Provider

A provider tells the extension how to extract token counts from a specific LLM API.
The HTTP proxy captures all traffic — providers only handle the parsing.

## Steps

### 1. Create the provider file

Create `src/core/capture/providers/<name>Provider.ts` and implement `CaptureProvider`:

```typescript
import { CaptureProvider, TokenResult } from '../captureProvider';

export const myProvider: CaptureProvider = {
    id: 'my-provider',           // unique, lowercase, kebab-case
    displayName: 'My Provider',  // shown in logs

    // Return true if this provider should handle the given URL
    matches(url: string): boolean {
        return url.includes('api.myprovider.com');
    },

    // Non-streaming: called with the parsed JSON response body
    parseTokens(body: unknown): TokenResult | null {
        const b = body as any;
        if (!b?.model || !b?.usage) { return null; }
        return {
            model: b.model,
            totalTokens: (b.usage.input_tokens ?? 0) + (b.usage.output_tokens ?? 0),
        };
    },

    // Streaming: called with an array of parsed SSE event objects
    // Each element is one parsed `data: {...}` line from the stream
    parseSSE(events: unknown[]): TokenResult | null {
        for (const e of events as any[]) {
            if (e.usage && e.model) {
                return { model: e.model, totalTokens: e.usage.total_tokens ?? 0 };
            }
        }
        return null;
    },
};
```

### 2. Register the provider

Add it to `src/core/capture/providers/index.ts`:

```typescript
import { myProvider } from './myProvider';

export const ALL_PROVIDERS: CaptureProvider[] = [
    anthropicProvider,
    openaiProvider,
    geminiProvider,
    myProvider,   // ← add here
];
```

### 3. That's it

No other files need to change. The proxy and adapter are provider-agnostic.

---

## How it works

```
HTTP response (streaming or not)
    ↓
serverWorker.ts — fires after stream completes, stream already delivered to client
    ↓
interceptorAdapter.ts — checks isSSE(), routes to parseSSE() or parseTokens()
    ↓
provider.parseSSE(events) / provider.parseTokens(body) → { model, totalTokens }
    ↓
calculateEmission(model, totalTokens) → emissions in gCO₂e
```

## Tips

- `matches()` is checked before any parsing — keep it fast (simple `includes` check).
- `parseTokens` and `parseSSE` must return `null` if the response doesn't have enough
  data (incomplete or unrecognised format). The adapter silently skips `null` results.
- For SSE, events are in chronological order. Usage data is usually in the last event.
- Check `models.json` to make sure the model names your provider returns are registered
  there, otherwise `calculateEmission` will fall back to 0.
