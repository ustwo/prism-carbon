import * as assert from 'assert';
import { getCColor } from '../graphTest';

suite('Carbon Usage Graph Tests', () => {
    test('Low carbon should display green color', () => {
        assert.strictEqual(getCColor(6), "#4CAF50");
    });
    test('Average carbon should display amber color', () => {
        assert.strictEqual(getCColor(23), "#FFC107");
    });
    test('High carbon should display red color', () => {
        assert.strictEqual(getCColor(69), "#F44336");
    });
});