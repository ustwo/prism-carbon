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

const veryLarge = Number.MAX_SAFE_INTEGER;
//99999999999999999999999999999999999999999999999999999999999999;
export const modelRegistry: Record<string, TieredModel> = {
    "gpt-4o-mini": new TieredModel("GPT4oMini", [{ limit: 400, carbonPerToken: 0.00923 }, { limit: 2000, carbonPerToken: 0.00369 }, { limit: 11500, carbonPerToken: 0.0006293 }]),
    // "gpt-4-turbo": new TieredModel("GPT4Turbo", [{ limit: 300, carbonPerToken: 2 }]),
    "gpt-4o": new TieredModel("GPT4o", [{ limit: veryLarge, carbonPerToken: 0.001324931507 }]),
    "gpt-4.5": new TieredModel("GPT4.5", [{ limit: veryLarge, carbonPerToken: 0.0003 }]),
    "gpt-5": new TieredModel("GPT5", [{ limit: veryLarge, carbonPerToken: 0.00269722222 }]), // ESTIMATED //https://impact.esg.ai/
    "claude-haiku-4.5": new TieredModel("ClaudeHaiku4.5", [{ limit: veryLarge, carbonPerToken: 0.000269444444 }]),  //https://impact.esg.ai/
    "claude-sonnet-4.5": new TieredModel("ClaudeSonnet4.5", [{ limit: veryLarge, carbonPerToken: 0.0005388888889 }]),  //https://impact.esg.ai/
    "claude-opus-4.5": new TieredModel("ClaudeOpus4.5", [{ limit: veryLarge, carbonPerToken: 0.0561888888888889 }]),  //https://impact.esg.ai/
    "claude": new TieredModel("Generic Claude", [{ limit: veryLarge, carbonPerToken: 0.000969444444 }]), // generic claude catcher
    "gemini": new TieredModel("Gemini", [{ limit: veryLarge, carbonPerToken: 0.00036 }]),
    "gpt": new TieredModel("Generic GPT Model", [{ limit: veryLarge, carbonPerToken: 0.00036 }]) // emissions based on 0.09g per median gemini prompt. Assuming this to be 250 tokens (input and output) then 0.09/250

};

export function getModel(inputString: string): TieredModel | null {
    const lowerModel = inputString.toLowerCase();
    if (modelRegistry[lowerModel]) { return modelRegistry[inputString]; }
    const key = Object.keys(modelRegistry).find(k => inputString.includes(k));
    return key ? modelRegistry[key] : null;
}

export function calculateEmission(model: string, tokenCount: number) {
    if (tokenCount < 0) { return 0; }
    const chosenModel = getModel(model);
    const impact = chosenModel?.calculate(tokenCount) ?? 0;
    return impact;
}