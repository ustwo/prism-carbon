import * as assert from 'assert';

export function getCColor(carbon : number) : string{
    if(carbon < 15){
        return "#4CAF50";
    }
    if(carbon < 40){
        return "#FFC107";
    }
    return "#F44336";
}

export const carbonEmissionReferenceStrip = [
    {label : "Low Emission" , max: 15 , color: "#4CAF50"},
    {label : "Average Emission" , max: 40 , color: "#FFC107"},
    {label : "High Emission" , max: Infinity , color: "#F44336"},
];

suite('Carbon Usage Graph Tests', () => {

    suite('getCColor test', () => {
        test('Low carbon should display green color', () => {
            assert.strictEqual(getCColor(6), "#4CAF50");
        });
        test('Average carbon should display amber color', () => {
            assert.strictEqual(getCColor(23), "#FFC107");
        });
        test('High carbon should display red color', () => {
            assert.strictEqual(getCColor(69), "#F44336");
        });
        test('Boundary value of 15 should display amber color', () => {
            assert.strictEqual(getCColor(15), "#FFC107");
        });
        test('Boundary value of 40 should display red color', () => {
            assert.strictEqual(getCColor(40), "#F44336");
        });
    });

    suite('carbonEmissionReferenceStrip test', () => {
        test('Should contain only 3 emission categories', () => {
            assert.strictEqual(carbonEmissionReferenceStrip.length, 3);
        });
        test('Emission categories should have thresholds in increasing order', () => {
            assert.ok(carbonEmissionReferenceStrip[0].max < carbonEmissionReferenceStrip[1].max &&
                carbonEmissionReferenceStrip[1].max < carbonEmissionReferenceStrip[2].max);
        });
        test('Each strip should have label, max and color', () => {
            carbonEmissionReferenceStrip.forEach(eachStrip => {
                assert.ok(eachStrip.label);
                assert.ok(eachStrip.max !== undefined);
                assert.ok(eachStrip.color);
            });
        });
        test('getCColor actually matches the reference strip thresholds', () => {
            assert.strictEqual(getCColor(14), carbonEmissionReferenceStrip[0].color);
            assert.strictEqual(getCColor(31), carbonEmissionReferenceStrip[1].color);
            assert.strictEqual(getCColor(43), carbonEmissionReferenceStrip[2].color);
        });
    });

});

