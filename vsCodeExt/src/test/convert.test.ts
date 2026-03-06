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

    test("Class functions the same as previous if/else - empty tokens", () => {
        assert.strictEqual(oldCalculateEmission("gpt-4o-mini", 0), convert.calculateEmission("gpt-4o-mini", 0));
        assert.strictEqual(oldCalculateEmission("gpt-4o", 0), convert.calculateEmission("gpt-4o", 0));
        assert.strictEqual(oldCalculateEmission("gpt-4.5", 0), convert.calculateEmission("gpt-4.5", 0));
    });

    test("Class functions the same as previous if/else - first tier tokens", () => {
        for (let i = 0; i < 3; i++) {
            let tokens = Math.floor(Math.random() * 400);
            assert.strictEqual(oldCalculateEmission("gpt-4o-mini", tokens), convert.calculateEmission("gpt-4o-mini", tokens));
            assert.strictEqual(oldCalculateEmission("gpt-4o", tokens), convert.calculateEmission("gpt-4o", tokens));
            assert.strictEqual(oldCalculateEmission("gpt-4.5", tokens), convert.calculateEmission("gpt-4.5", tokens));
        }
    });

    test("Class functions the same as previous if/else - 2nd tier tokens", () => {
        for (let i = 0; i < 3; i++) {
            let tokens = 400 + Math.floor(Math.random() * 1600);
            assert.strictEqual(oldCalculateEmission("gpt-4o-mini", tokens), convert.calculateEmission("gpt-4o-mini", tokens));
            assert.strictEqual(oldCalculateEmission("gpt-4o", tokens), convert.calculateEmission("gpt-4o", tokens));
            assert.strictEqual(oldCalculateEmission("gpt-4.5", tokens), convert.calculateEmission("gpt-4.5", tokens));
        }
    });

    test("Class functions the same as previous if/else - 3rd tier tokens", () => {
        for (let i = 0; i < 3; i++) {
            let tokens = 2000 + Math.floor(Math.random() * 9500);
            assert.strictEqual(oldCalculateEmission("gpt-4o-mini", tokens), convert.calculateEmission("gpt-4o-mini", tokens));
            assert.strictEqual(oldCalculateEmission("gpt-4o", tokens), convert.calculateEmission("gpt-4o", tokens));
            assert.strictEqual(oldCalculateEmission("gpt-4.5", tokens), convert.calculateEmission("gpt-4.5", tokens));
        }
    });

    test("Class functions the same as previous if/else - out of scope tokens", () => {
        for (let i = 0; i < 3; i++) {
            let tokens = 11500 + Math.floor(Math.random() * 100000);
            assert.strictEqual(oldCalculateEmission("gpt-4o-mini", tokens), convert.calculateEmission("gpt-4o-mini", tokens));
            assert.strictEqual(oldCalculateEmission("gpt-4o", tokens), convert.calculateEmission("gpt-4o", tokens));
            assert.strictEqual(oldCalculateEmission("gpt-4.5", tokens), convert.calculateEmission("gpt-4.5", tokens));
        }
    });

    test("Negative tokens are handled gracefully", () => {
        let tokens = -1;
        assert.strictEqual(convert.calculateEmission("gpt-4o-mini", tokens), 0);
        assert.strictEqual(convert.calculateEmission("gpt-4o", tokens), 0);
        assert.strictEqual(convert.calculateEmission("gpt-4.5", tokens), 0);
    });

    test("Correct models are chosen given input string", () => {
        let modelString = "ncdsdfj135tdsdfgpt-4o-bminiasdben123el.d"; // expecting gpt-4o
        assert.strictEqual(convert.getModel(modelString)!.modelName, "GPT4o");
        modelString = "ncdsdfj135tdsdfgpt-4.5o-bminiasdben123el.d"; // expecting gpt-4o
        assert.strictEqual(convert.getModel(modelString)!.modelName, "GPT4.5");
        modelString = "ncdsdfj135tdsdfgpt-4ploeo-bminiasdben123elasdfkjh.gpt-4o-minigpt-4od"; // expecting gpt-4o
        assert.strictEqual(convert.getModel(modelString)!.modelName, "GPT4oMini");
        modelString = "abcdefghijlkmnopqrstuvwxyz";
        assert.strictEqual(convert.getModel(modelString)?.modelName ?? null, null); // if null then assign null, and compare to null
        modelString = "";
        assert.strictEqual(convert.getModel(modelString)?.modelName ?? null, null);
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
});
