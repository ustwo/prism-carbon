// convert tokens to carbon

// for water:
// use interface and return 
interface EnvironmentalImpact {
    carbon: number; //in grams
    water: number; // in ml
}

abstract class LLMModel {
    abstract calculate(tokens: number): number; // change number to EnvironmentalImpact for output when adding water
}

export class TieredModel extends LLMModel {

    constructor(public modelName: string, private carbonTiers: { limit: number, carbonPerToken: number }[]
    ) {
        super();
        this.modelName = modelName;
        // this.carbonPerToken = carbonPerToken; // in grams
        // this.waterPerToken = waterPerToken; // in ml
    }

    calculate(tokens: number): number {
        const carbonRate = this.carbonTiers.find(t => tokens <= t.limit)?.carbonPerToken ?? 0; // returns 0 if no rate found
        return tokens * carbonRate;
        // // return {
        //     carbon: carbonRate*tokens,
        //     water : waterRate * tokens{}};
    };
}

export const modelRegistry: Record<string, TieredModel> = {
    "gpt-4o-mini": new TieredModel("GPT4oMini", [{ limit: 400, carbonPerToken: 0.00923 }, { limit: 2000, carbonPerToken: 0.00369 }, { limit: 11500, carbonPerToken: 0.0006293 }]),
    "gpt-4o": new TieredModel("GPT4o", [{ limit: 400, carbonPerToken: 0.000000370125 }, { limit: 2000, carbonPerToken: 0.000000212625 }, { limit: 11500, carbonPerToken: 0.0000000875 }]),
    "gpt-4.5": new TieredModel("GPT4.5", [{ limit: 999999999999, carbonPerToken: 0.0003 }])
};

export function getModel(inputString: string): TieredModel | null {
    const lowerModel = inputString.toLowerCase();
    if (modelRegistry[lowerModel]) {return modelRegistry[inputString];}
    const key = Object.keys(modelRegistry).find(k => inputString.includes(k));
    return key ? modelRegistry[key] : null;
}

export function calculateEmission(model: string, tokenCount: number) {
    if (tokenCount <0) { return 0; }
    // grams of co2 emitted per token (averaged over output and input)
    // const chatgpt4oshort = 0.000000370125;
    // const chatgpt4omedium = 0.000000212625;
    // const chatgpt4olong = 0.0000000875;
    // const chatgpt4ominishort = 0.00923;
    // const chatgpt4ominimedium = 0.00369;
    // const chatgpt4ominilong = 0.0006293;
    // const chatgpt4point5 = 0.0003;
    const chosenModel = getModel(model);
    const impact = chosenModel?.calculate(tokenCount) ?? 0;
    return impact;
}