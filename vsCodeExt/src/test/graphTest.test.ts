import * as assert from 'assert';
import { getCColor, carbonEmissionReferenceStrip } from '../graphTest';

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


    test('Low Emission strip is green', () => {
        assert.strictEqual(carbonEmissionReferenceStrip[0].color, "#4CAF50");
    });
    test('Average Emission strip is amber', () => {
        assert.strictEqual(carbonEmissionReferenceStrip[1].color, "#FFC107");
    });
    test('High Emission strip is red', () => {
        assert.strictEqual(carbonEmissionReferenceStrip[2].color, "#F44336");
    });
    test('Low Emission max is 15', () => {
        assert.strictEqual(carbonEmissionReferenceStrip[0].max, 15);
    });
    test('Average Emission max is 40', () => {
        assert.strictEqual(carbonEmissionReferenceStrip[1].max, 40);
    });
    test('High Emission max is Infinity', () => {
        assert.strictEqual(carbonEmissionReferenceStrip[2].max, Infinity);
    });
    test('Carbon Emission strip only has 3 options', () => {
        assert.strictEqual(carbonEmissionReferenceStrip.length, 3);
    });
});

