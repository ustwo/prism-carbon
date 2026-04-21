// convert tokens to carbon

// for water:
// use interface and return 
interface EnvironmentalImpact {
    carbon: number; //in grams
    water: number; // in ml
}

let carbonIntensityGrid = 471; // gco2e/kwh -- global average
// reference: https://ember-energy.org/data/electricity-data-explorer/?data=co2_intensity&fuel=total&chart=single_year

abstract class LLMModel {
    abstract calculate(tokens: number): number; // change number to EnvironmentalImpact for output when adding water
}

export class TieredModel extends LLMModel {

    constructor(public modelName: string, private energyTiers: { limit: number, energyPerToken: number }[]
    ) {
        super();
        this.modelName = modelName;
        // this.energyPerToken = energyPerToken; // in kwh
        // this.waterPerToken = waterPerToken; // in ml
    }

    calculate(tokens: number): number {
        const energyRate = this.energyTiers.find(t => tokens <= t.limit)?.energyPerToken ?? 0; // returns 0 if no rate found
        return tokens * energyRate;
        // // return {
        //     carbon: carbonRate*tokens,
        //     water : waterRate * tokens{}};
    };
}

export function setCalculationData(vscode: any): void {
    // check to see if configuration data already exists:
    const config = vscode.workspace.getConfiguration("carbonIntensity");


}

const veryLarge = Number.MAX_SAFE_INTEGER;


// energy values used are in kwh per token based on the tool from the paper 
// "How Hungry is AI? Benchmarking Energy, Water, and Carbon Footprint of LLM Inference" by Jegham et al. 2025

//https://app.powerbi.com/view?r=eyJrIjoiZjVmOTI0MmMtY2U2Mi00ZTE2LTk2MGYtY2ZjNDMzODZkMjlmIiwidCI6IjQyNmQyYThkLTljY2QtNDI1NS04OTNkLTA2ODZhMzJjMTY4ZCIsImMiOjF9

export const modelRegistry: Record<string, TieredModel> = {
    "o3-pro": new TieredModel("OpenAI o3 Pro", [{limit: 2000, energyPerToken: 32.36/2000}, { limit: 11500, energyPerToken: 36.08/11500 }]),
    "o3": new TieredModel("OpenAI o3", [{limit: 2000, energyPerToken: 4.32/2000}, { limit: 11500, energyPerToken: 5.73/11500 }]),
    "o4-mini-high": new TieredModel("OpenAI o4-mini (high)", [{limit: 2000, energyPerToken: 6.13/2000}, { limit: 11500, energyPerToken: 5.66/11500 }]),


    "gpt-5-high": new TieredModel("OpenAI GPT 5 (high)", [{limit: 2000, energyPerToken: 22.16/2000}, { limit: 11500, energyPerToken: 21.83/11500 }]),
    "gpt-5-medium": new TieredModel("OpenAI GPT 5 (medium)", [{limit: 2000, energyPerToken: 11.89/2000}, { limit: 11500, energyPerToken: 10.59/11500 }]),
    "gpt-5-low": new TieredModel("OpenAI GPT 5 (low)", [{limit: 2000, energyPerToken: 5.01/2000}, { limit: 11500, energyPerToken: 6.47/11500 }]),

    "gpt-4-turbo": new TieredModel("OpenAI GPT 4 turbo", [{limit: 2000, energyPerToken: 7.01/2000}, { limit: 11500, energyPerToken: 10.93/11500 }]),
    "gpt-4.1": new TieredModel("OpenAI GPT 4.1", [{limit: 2000, energyPerToken: 1.85/2000}, { limit: 11500, energyPerToken: 2.94/11500 }]),

    "gpt-4o-mini": new TieredModel("OpenAI GPT 4o mini", [{limit: 2000, energyPerToken: 1.65/2000}, { limit: 11500, energyPerToken: 3.85/11500 }]),
    "o3-mini-high": new TieredModel("OpenAI o3 Mini High", [{ limit: 2000, energyPerToken: 5.04/2000 }, { limit: 11500, energyPerToken: 8.47/11500 }]),
    "o3-mini": new TieredModel("OpenAI o3 Mini", [{ limit: 2000, energyPerToken: 1.72/2000 }, { limit: 11500, energyPerToken: 2.7/11500 }]),
    "o1": new TieredModel("OpenAI o1", [{ limit: 2000, energyPerToken: 6.44/2000 }, { limit: 11500, energyPerToken: 15.31/11500 }]),
    "gpt-5-mini-high": new TieredModel("GPT5 Mini High", [{ limit: 2000, energyPerToken: 14.86/2000 }, { limit: 11500, energyPerToken: 13.37/11500 }]),
    "gpt-5-nano-high": new TieredModel("GPT5 Nano High", [{ limit: 2000, energyPerToken: 6.65/2000 }, { limit: 11500, energyPerToken: 6.45/11500 }]),
    "gpt-5-nano-medium": new TieredModel("GPT5 Nano Medium", [{ limit: 2000, energyPerToken: 3.87/2000 }, { limit: 11500, energyPerToken: 3.14/11500 }]),
    "gpt-5-nano-minimal": new TieredModel("GPT5 Nano Minimal", [{ limit: 2000, energyPerToken: 0.5/2000 }, { limit: 11500, energyPerToken: 0.65/11500 }]),
    "gpt-5-minimal": new TieredModel("GPT5 Minimal", [{ limit: 2000, energyPerToken: 3.00/2000 }, { limit: 11500, energyPerToken: 4.72/11500 }]),
    "gpt-5-mini-medium": new TieredModel("GPT5 Mini Medium", [{ limit: 2000, energyPerToken: 4.3/2000 }, { limit: 11500, energyPerToken: 3.52/11500 }]),
    "gpt-4o-2024-11": new TieredModel("GPT4o November", [{ limit: 2000, energyPerToken: 1.33/2000 }, { limit: 11500, energyPerToken: 2.74/11500 }]),
    "gpt-4o-2024-08": new TieredModel("GPT4o August", [{ limit: 2000, energyPerToken: 1.63/2000 }, { limit: 11500, energyPerToken: 2.24/11500 }]),
    "gpt-4.1-nano": new TieredModel("GPT4.1 Nano", [{ limit: 2000, energyPerToken: 0.36/2000 }, { limit: 11500, energyPerToken: 0.57/11500 }]),

    
    
    // OLD DATA FROM BEFORE - IMPLEMENT NEW TIERS ABOVE

    // // "gpt-4o-mini": new TieredModel("GPT4oMini", [{ limit: 400, energyPerToken: 0.00923 }, { limit: 2000, energyPerToken: 0.00369 }, { limit: 11500, energyPerToken: 0.0006293 }]),
    // // "gpt-3.5-turbo": new TieredModel("GPT3.5Turbo", [{ limit: veryLarge, energyPerToken: 0.000002 }]),// kwh (1)
    // // "gpt-4-turbo": new TieredModel("GPT4Turbo", [{ limit: veryLarge, energyPerToken: 0.000006 }]), //kwh (1)
    // "gpt-4o": new TieredModel("GPT4o", [{ limit: veryLarge, energyPerToken: 0.9/365000 }]), //kwh (1)
    // // "gpt-4.5": new TieredModel("GPT4.5", [{ limit: veryLarge, energyPerToken: 0.0003 }]),
    // // "gpt-4": new TieredModel("GPT4", [{ limit: veryLarge, energyPerToken: 0.000006 }]), //kwh (1)
    // "gpt-5": new TieredModel("GPT5", [{ limit: veryLarge, energyPerToken: 1.8/365000 }]), // ESTIMATED //https://impact.esg.ai/
    // "claude-haiku-4.5": new TieredModel("ClaudeHaiku4.5", [{ limit: veryLarge, energyPerToken: 0.2/365000 }]),  //https://impact.esg.ai/
    // "claude-sonnet-4.5": new TieredModel("ClaudeSonnet4.5", [{ limit: veryLarge, energyPerToken: 0.4/365000 }]),  //https://impact.esg.ai/
    // "claude-opus-4.5": new TieredModel("ClaudeOpus4.5", [{ limit: veryLarge, energyPerToken: 4.6/365000 }]),  //https://impact.esg.ai/
    // // "claude": new TieredModel("Generic Claude", [{ limit: veryLarge, energyPerToken: 0.000969444444 }]), // generic claude catcher
    // "gemini": new TieredModel("Gemini", [{ limit: veryLarge, energyPerToken: 0.7/365000 }]) // based on gemini 2.5 pro
    // // "gpt": new TieredModel("Generic GPT Model", [{ limit: veryLarge, energyPerToken: 0.00036 }]) // emissions based on 0.09g per median gemini prompt. Assuming this to be 250 tokens (input and output) then 0.09/250

};




// references - (1) https://tokenomy.ai/tools?tab=energy

// reference for SCI formula: https://sci.greensoftware.foundation/

// SCI = ((E * I)+M) per R

// E = energy consumed (kWh)
// I = carbon intensity of the energy source (gCO2e/kWh)
// M = manufacturing emissions (gCO2e)
    // M = TE * (TiR/EL) * (RR/ToR)
    // Where:

    // TiR = Time Reserved; the length of time the hardware is reserved for use by the software.
    // EL = Expected Lifespan; the anticipated time that the equipment will be installed.
    // RR = Resources Reserved; the number of resources reserved for use by the software.
    // ToR = Total Resources; the total number of resources available.
// R = number of tokens processed

// so our SCI = ((Energy of model tokens * global average carbon intensity) + manufacturing emissions per R tokens) / R = gCO2e per token

export function getModel(inputString: string): TieredModel | null {
    const normalizedInput = inputString.trim().toLowerCase();
    if (!normalizedInput) {
        return null;
    }

    // Exact match (case-insensitive)
    const exactKey = Object.keys(modelRegistry).find(k => k.toLowerCase() === normalizedInput);
    if (exactKey) {
        return modelRegistry[exactKey];
    }

    // Substring match (case-insensitive). Prefer the longest key to avoid partial collisions.
    const keysBySpecificity = Object.keys(modelRegistry).sort((a, b) => b.length - a.length);
    const matchedKey = keysBySpecificity.find(k => normalizedInput.includes(k.toLowerCase()));
    return matchedKey ? modelRegistry[matchedKey] : null;
}

export function calculateEmission(modelName: string, numTokens: number) {
    const energy = getEnergy(modelName, numTokens); // energy in kwh from call using tokens
    const gridCarbonIntensity = carbonIntensityGrid; // gco2e/kwh from configuration or default
    // + M
    return energy * gridCarbonIntensity; // returns carbon in grams for this call
}


export function getEnergy(modelName: string, numTokens: number): number {
    if (numTokens < 0) { return 0; }
    const chosenModel = getModel(modelName);
    const energy = chosenModel?.calculate(numTokens) ?? 0;
    return energy;
}