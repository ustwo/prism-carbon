import * as assert from 'assert';
import { geminiProvider } from './geminiProvider';

suite('geminiProvider', () => {

    suite('matches()', () => {
        test('matches generativelanguage.googleapis.com', () => {
            assert.ok(geminiProvider.matches('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent'));
        });
        test('does not match other domains', () => {
            assert.ok(!geminiProvider.matches('https://api.openai.com/v1/chat'));
        });
    });

    suite('parseTokens()', () => {
        test('extracts model and total token count from JSON response', () => {
            const body = {
                modelVersion: 'gemini-2.5-pro',
                usageMetadata: { totalTokenCount: 300 },
            };
            const result = geminiProvider.parseTokens(body);
            assert.deepStrictEqual(result, { model: 'gemini-2.5-pro', totalTokens: 300 });
        });

        test('falls back to gemini-unknown when modelVersion is missing', () => {
            const body = { usageMetadata: { totalTokenCount: 100 } };
            const result = geminiProvider.parseTokens(body);
            assert.deepStrictEqual(result, { model: 'gemini-unknown', totalTokens: 100 });
        });

        test('returns null when usageMetadata is missing', () => {
            assert.strictEqual(geminiProvider.parseTokens({ modelVersion: 'gemini-2.5-pro' }), null);
        });
    });

    suite('parseSSE()', () => {
        test('finds usageMetadata in the final SSE event', () => {
            const events = [
                { candidates: [{ content: { parts: [{ text: 'Hello' }] } }] },
                { candidates: [{ content: { parts: [{ text: ' world' }] } }], usageMetadata: { totalTokenCount: 150 }, modelVersion: 'gemini-2.5-flash' },
            ];
            const result = geminiProvider.parseSSE(events);
            assert.deepStrictEqual(result, { model: 'gemini-2.5-flash', totalTokens: 150 });
        });

        test('returns null when no event has usageMetadata', () => {
            const events = [{ candidates: [{ content: { parts: [{ text: 'Hi' }] } }] }];
            assert.strictEqual(geminiProvider.parseSSE(events), null);
        });
    });
});
