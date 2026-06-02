import * as assert from 'assert';
import { openaiProvider } from './openaiProvider';

suite('openaiProvider', () => {

    suite('matches()', () => {
        test('matches api.openai.com', () => {
            assert.ok(openaiProvider.matches('https://api.openai.com/v1/chat/completions'));
        });
        test('matches api.github.com (Copilot)', () => {
            assert.ok(openaiProvider.matches('https://api.github.com/copilot'));
        });
        test('does not match other domains', () => {
            assert.ok(!openaiProvider.matches('https://api.anthropic.com/v1/messages'));
        });
    });

    suite('parseTokens()', () => {
        test('extracts model and tokens from JSON response', () => {
            const body = {
                model: 'gpt-4o',
                usage: { prompt_tokens: 100, completion_tokens: 50 },
            };
            const result = openaiProvider.parseTokens(body);
            assert.deepStrictEqual(result, { model: 'gpt-4o', totalTokens: 150 });
        });

        test('returns null when usage is missing', () => {
            assert.strictEqual(openaiProvider.parseTokens({ model: 'gpt-4o' }), null);
        });
    });

    suite('parseSSE()', () => {
        test('extracts model and usage from streaming chunks', () => {
            const events = [
                { model: 'gpt-4o', choices: [{ delta: { content: 'Hello' } }] },
                { model: 'gpt-4o', choices: [{ delta: { content: ' world' } }] },
                { model: 'gpt-4o', choices: [{ finish_reason: 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 20 } },
            ];
            const result = openaiProvider.parseSSE(events);
            assert.deepStrictEqual(result, { model: 'gpt-4o', totalTokens: 30 });
        });

        test('returns null when model is not present in any chunk', () => {
            const events = [{ choices: [{ delta: { content: 'Hi' } }] }];
            assert.strictEqual(openaiProvider.parseSSE(events), null);
        });

        test('returns model with 0 tokens if usage chunk is missing', () => {
            const events = [{ model: 'gpt-4o', choices: [{ delta: { content: 'Hi' } }] }];
            const result = openaiProvider.parseSSE(events);
            assert.deepStrictEqual(result, { model: 'gpt-4o', totalTokens: 0 });
        });
    });
});
