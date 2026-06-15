import * as assert from 'assert';
import { anthropicProvider } from './anthropicProvider';

suite('anthropicProvider', () => {

    suite('matches()', () => {
        test('matches api.anthropic.com', () => {
            assert.ok(anthropicProvider.matches('https://api.anthropic.com/v1/messages'));
        });
        test('does not match other domains', () => {
            assert.ok(!anthropicProvider.matches('https://api.openai.com/v1/chat'));
        });
    });

    suite('parseTokens()', () => {
        test('extracts model and tokens from JSON response', () => {
            const body = {
                model: 'claude-opus-4',
                usage: { input_tokens: 100, output_tokens: 50 },
            };
            const result = anthropicProvider.parseTokens(body);
            assert.deepStrictEqual(result, { model: 'claude-opus-4', totalTokens: 150 });
        });

        test('returns null when usage is missing', () => {
            assert.strictEqual(anthropicProvider.parseTokens({ model: 'claude-opus-4' }), null);
        });

        test('returns null when model is missing', () => {
            assert.strictEqual(anthropicProvider.parseTokens({ usage: { input_tokens: 10 } }), null);
        });
    });

    suite('parseSSE()', () => {
        test('extracts tokens from message_start and message_delta events', () => {
            const events = [
                { type: 'message_start', message: { model: 'claude-sonnet-4-5', usage: { input_tokens: 24 } } },
                { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
                { type: 'message_delta', usage: { output_tokens: 42 } },
                { type: 'message_stop' },
            ];
            const result = anthropicProvider.parseSSE(events);
            assert.deepStrictEqual(result, { model: 'claude-sonnet-4-5', totalTokens: 66 });
        });

        test('returns null when model is not present', () => {
            const events = [
                { type: 'content_block_delta', delta: { text: 'Hi' } },
            ];
            assert.strictEqual(anthropicProvider.parseSSE(events), null);
        });

        test('handles missing output tokens gracefully', () => {
            const events = [
                { type: 'message_start', message: { model: 'claude-haiku-4.5', usage: { input_tokens: 10 } } },
            ];
            const result = anthropicProvider.parseSSE(events);
            assert.deepStrictEqual(result, { model: 'claude-haiku-4.5', totalTokens: 10 });
        });
    });
});
