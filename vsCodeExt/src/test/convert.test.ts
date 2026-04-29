import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as convert from '../convert';

function oldCalculateEmission(model: string, token: number) {
    const gpt4o = 0.001324931507;
    const chatgpt4ominishort = 0.00923;
    const chatgpt4ominimedium = 0.00369;
    const chatgpt4ominilong = 0.0006293;
    const chatgpt4point5 = 0.0003;

    let carbon = 0;
    const lowerModel = model.toLowerCase();

    if (lowerModel.includes("gpt-4o-mini")) {
        if (token <= 400) {
            carbon = chatgpt4ominishort * token;
        } else if (token <= 2000) {
            carbon = chatgpt4ominimedium * token;
        } else if (token <= 11500) {
            carbon = chatgpt4ominilong * token;
        }
    } else if (lowerModel.includes("gpt-4o")) {
        carbon = gpt4o * token;
    }
    else if (lowerModel.includes("gpt-4.5")) {
        carbon = chatgpt4point5 * token;
    }
    return carbon;
}

suite("Conversion Tests", () => {
    for (const [modelKey, model] of Object.entries(convert.modelRegistry)) {

    // test("Class functions the same as previous if/else - empty tokens", () => {
    //     assert.strictEqual(oldCalculateEmission("gpt-4o-mini", 0), convert.calculateEmission("gpt-4o-mini", 0));
    //     assert.strictEqual(oldCalculateEmission("gpt-4o", 0), convert.calculateEmission("gpt-4o", 0));
    //     assert.strictEqual(oldCalculateEmission("gpt-4.5", 0), convert.calculateEmission("gpt-4.5", 0));
    // });

    // test("Class functions the same as previous if/else - first tier tokens", () => {
    //     for (let i = 0; i < 3; i++) {
    //         let tokens = Math.floor(Math.random() * 400);
    //         assert.strictEqual(oldCalculateEmission("gpt-4o-mini", tokens), convert.calculateEmission("gpt-4o-mini", tokens));
    //         assert.strictEqual(oldCalculateEmission("gpt-4o", tokens), convert.calculateEmission("gpt-4o", tokens));
    //         assert.strictEqual(oldCalculateEmission("gpt-4.5", tokens), convert.calculateEmission("gpt-4.5", tokens));
    //     }
    // });

    // test("Class functions the same as previous if/else - 2nd tier tokens", () => {
    //     for (let i = 0; i < 3; i++) {
    //         let tokens = 400 + Math.floor(Math.random() * 1600);
    //         assert.strictEqual(oldCalculateEmission("gpt-4o-mini", tokens), convert.calculateEmission("gpt-4o-mini", tokens));
    //         assert.strictEqual(oldCalculateEmission("gpt-4o", tokens), convert.calculateEmission("gpt-4o", tokens));
    //         assert.strictEqual(oldCalculateEmission("gpt-4.5", tokens), convert.calculateEmission("gpt-4.5", tokens));
    //     }
    // });

    // test("Class functions the same as previous if/else - 3rd tier tokens", () => {
    //     for (let i = 0; i < 3; i++) {
    //         let tokens = 2000 + Math.floor(Math.random() * 9500);
    //         assert.strictEqual(oldCalculateEmission("gpt-4o-mini", tokens), convert.calculateEmission("gpt-4o-mini", tokens));
    //         assert.strictEqual(oldCalculateEmission("gpt-4o", tokens), convert.calculateEmission("gpt-4o", tokens));
    //         assert.strictEqual(oldCalculateEmission("gpt-4.5", tokens), convert.calculateEmission("gpt-4.5", tokens));
    //     }
    // });

    // test("Class functions the same as previous if/else - out of scope tokens", () => {
    //     for (let i = 0; i < 3; i++) {
    //         let tokens = 11500 + Math.floor(Math.random() * 100000);
    //         assert.strictEqual(oldCalculateEmission("gpt-4o-mini", tokens), convert.calculateEmission("gpt-4o-mini", tokens));
    //         assert.strictEqual(oldCalculateEmission("gpt-4o", tokens), convert.calculateEmission("gpt-4o", tokens));
    //         assert.strictEqual(oldCalculateEmission("gpt-4.5", tokens), convert.calculateEmission("gpt-4.5", tokens));
    //     }
    // });

    test("Negative tokens are handled gracefully", () => {
        let tokens = -1;
        assert.strictEqual(convert.calculateEmission(modelKey, tokens), 0);
        // assert.strictEqual(convert.calculateEmission("gpt-4o", tokens), 0);
        // assert.strictEqual(convert.calculateEmission("gpt-4.5", tokens), 0);
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
        let modelString = "ncdsdfj135tdsdf335334pt-yrgadgasd42352351-bminiasdben123el.d"; // expecting gpt-4o
        assert.strictEqual(convert.calculateEmission(modelString, 450), 0);
        // modelString = "ncdsdfj135tdsdfgpt-2534.52o-bminiasdben123el.d"; // expecting gpt-4o
        // assert.strictEqual(convert.calculateEmission(modelString, 450), 0);
        // modelString = "ncdsdfj135tdsdfgptkhgc-4ploeo-bminiasdben123elasdfkjh.gpt-4dfghno-minigpthvjh-4od"; // expecting gpt-4o
        // assert.strictEqual(convert.calculateEmission(modelString, 450), 0);
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
