import * as assert from 'assert';
import { isSSE, parseSseLines } from './sseParser';

suite('sseParser', () => {

    suite('isSSE()', () => {
        test('returns true for SSE body', () => {
            assert.strictEqual(isSSE('data: {"type":"message_start"}'), true);
        });

        test('returns false for JSON body', () => {
            assert.strictEqual(isSSE('{"model":"claude-3","usage":{}}'), false);
        });

        test('returns false for empty string', () => {
            assert.strictEqual(isSSE(''), false);
        });

        test('handles leading whitespace', () => {
            assert.strictEqual(isSSE('\ndata: {"type":"ping"}'), true);
        });
    });

    suite('parseSseLines()', () => {
        test('parses valid data lines', () => {
            const text = [
                'data: {"type":"message_start"}',
                'data: {"type":"content_block_delta"}',
                'data: {"type":"message_stop"}',
            ].join('\n');

            const result = parseSseLines(text);
            assert.strictEqual(result.length, 3);
            assert.deepStrictEqual(result[0], { type: 'message_start' });
        });

        test('skips [DONE] sentinel', () => {
            const text = 'data: {"type":"message_stop"}\ndata: [DONE]';
            const result = parseSseLines(text);
            assert.strictEqual(result.length, 1);
        });

        test('skips non-data lines', () => {
            const text = 'event: ping\ndata: {"ok":true}\n: comment';
            const result = parseSseLines(text);
            assert.strictEqual(result.length, 1);
        });

        test('skips malformed JSON lines without throwing', () => {
            const text = 'data: {"ok":true}\ndata: not-json';
            const result = parseSseLines(text);
            assert.strictEqual(result.length, 1);
        });

        test('returns empty array for non-SSE body', () => {
            const result = parseSseLines('{"model":"gpt-4o"}');
            assert.strictEqual(result.length, 0);
        });
    });
});
