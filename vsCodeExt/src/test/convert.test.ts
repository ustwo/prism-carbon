import * as assert from 'assert';
import * as convert from '../convert';

suite("Conversion Tests", () => {
    for (const [modelKey, model] of Object.entries(convert.modelRegistry)) {

    test("Negative tokens are handled gracefully", () => {
        let tokens = -1;
        assert.strictEqual(convert.calculateEmission(modelKey, tokens), 0);
    });

    test("Correct models are chosen given input string", () => {
        for (const [modelKey, model] of Object.entries(convert.modelRegistry)) {
            const modelString = `noise-${modelKey.toUpperCase()}-noise`;
            assert.strictEqual(
                convert.getModel(modelString)!.modelName,
                model.modelName,
                `Expected ${modelKey} to resolve from ${modelString}`
            );
        }

        assert.strictEqual(convert.getModel("abcdefghijlkmnopqrstuvwxyz")?.modelName ?? null, null); // if null then assign null, and compare to null
        assert.strictEqual(convert.getModel("")?.modelName ?? null, null);
    });


    test("Conversion fails gracefully given valid tokens and invalid model string", () => {
        let modelString = "ncdsdfj135tdsdf335334pt-yrgadgasd42352351-bminiasdben123el.d";
        assert.strictEqual(convert.calculateEmission(modelString, 450), 0);
        modelString = "abcdefghijlkmnopqrstuvwxyz";
        assert.strictEqual(convert.calculateEmission(modelString, 450), 0); // if null then assign null, and compare to null
        modelString = "";
        assert.strictEqual(convert.calculateEmission(modelString, 450), 0);
    });

    test("Calculates correct energy for tokens above and below 2000 tier limit", () => {
        const underLimit = convert.calculateEmission(modelKey, 1000);
        assert.ok(underLimit > 0);

        const overLimit = convert.calculateEmission(modelKey, 2500);
        assert.ok(overLimit > 0);
        assert.ok(overLimit > underLimit); 
    });

    test("Correctly parses reasoning levels from strings", () => {
        assert.strictEqual(convert.getModel("gpt-5-minimal")?.modelName, "GPT5 (minimal)");
        
        assert.strictEqual(convert.getModel("o3-mini-high")?.modelName, "OpenAI o3 Mini (high)");

        assert.strictEqual(convert.getModel("gpt-5")?.modelName, "GPT5 (medium)");
    });

    
}
  test("getModel handles undefined and whitespace gracefully", () => {
    // @ts-ignore - Forcing undefined to test runtime safety
    assert.strictEqual(convert.getModel(undefined), null);
    
    assert.strictEqual(convert.getModel("   ")?.modelName ?? null, null);
});

});
