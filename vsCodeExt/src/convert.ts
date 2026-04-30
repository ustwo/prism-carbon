/*****************************************************************************************
 *                                      CONVERT.TS                                       *
 *   HANDLES CONVERSION OF MODEL NAMES AND TOKEN COUNT TO ENERGY AND CARBON ESTIMATES.   *
 *    USES THE MODEL REGISTRY FROM MODELS.JSON TO CALCULATE RATES BASED ON THE PAPER     *
 * "HOW HUNGRY IS AI? BENCHMARKING ENERGY, WATER, AND CARBON FOOTPRINT OF LLM INFERENCE" *
 *                                 BY JEGHAM ET AL. 2025                                 *
 *****************************************************************************************/

import * as models from '../models.json'

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
    }

    calculate(tokens: number): number {
        let surplusTokens = 0;
        if (tokens >= 2000) {
            surplusTokens = tokens - 2000;
        }
        const energyRate1 = this.energyTiers[0].energyPerToken; // rate for first 2000 tokens
        const energyRate2 = this.energyTiers[1].energyPerToken; // rate for tokens beyond 2000 (taken at the 11500 token data point)
        return ((tokens-surplusTokens) * energyRate1) + (surplusTokens * energyRate2);
        // return {
        //     carbon: carbonRate*tokens,
        //     water : waterRate * tokens{}};
    };
}

const veryLarge = Number.MAX_SAFE_INTEGER;

// fetches models from models.json
const modelFromJson = (key: keyof typeof models): TieredModel => {
    const model = models[key];
    return new TieredModel(model.name, [
        { limit: 2000, energyPerToken: model.tiers[0].energyPerToken/2000 },
        { limit: veryLarge, energyPerToken: model.tiers[1].energyPerToken/11500 }
    ]);
};

// energy values used are in wh per token based on the tool from the paper 
// "How Hungry is AI? Benchmarking Energy, Water, and Carbon Footprint of LLM Inference" by Jegham et al. 2025
//https://app.powerbi.com/view?r=eyJrIjoiZjVmOTI0MmMtY2U2Mi00ZTE2LTk2MGYtY2ZjNDMzODZkMjlmIiwidCI6IjQyNmQyYThkLTljY2QtNDI1NS04OTNkLTA2ODZhMzJjMTY4ZCIsImMiOjF9

// registry is loaded from models.json, and ordered in by specificity of model name
// to allow for partial matching to filter correctly.
export const modelRegistry: Record<string, TieredModel> = {
    // GPT O Models
    "o4-mini-high": modelFromJson("o4-mini-high"),
    "o3-pro": modelFromJson("o3-pro"),
    "o3-mini-high": modelFromJson("o3-mini-high"),
    "o3-mini": modelFromJson("o3-mini"),
    "o3-medium": modelFromJson("o3-medium"),
    "o1-medium": modelFromJson("o1-medium"),
    "o3": modelFromJson("o3"),
    "o1": modelFromJson("o1"),
    "o4": modelFromJson("o4"),

    //GPT 5 Models
    "gpt-5-mini-high": modelFromJson("gpt-5-mini-high"),
    "gpt-5-mini-medium": modelFromJson("gpt-5-mini-medium"),
    "gpt-5-nano-high": modelFromJson("gpt-5-nano-high"),
    "gpt-5-nano-medium": modelFromJson("gpt-5-nano-medium"),
    "gpt-5-nano-minimal": modelFromJson("gpt-5-nano-minimal"),
    "gpt-5-minimal": modelFromJson("gpt-5-minimal"),
    "gpt-5-high": modelFromJson("gpt-5-high"),
    "gpt-5-medium": modelFromJson("gpt-5-medium"),
    "gpt-5-low": modelFromJson("gpt-5-low"),
    "gpt-5-mini": modelFromJson("gpt-5-mini"),
    "gpt-5": modelFromJson("gpt-5"),

    // GPT 4 Models
    "gpt-4-turbo": modelFromJson("gpt-4-turbo"),
    "gpt-4.1-nano": modelFromJson("gpt-4.1-nano"),
    "gpt-4.1-mini": modelFromJson("gpt-4.1-mini"),
    "gpt-4.1": modelFromJson("gpt-4.1"),
    "gpt-4o-2024-11-20": modelFromJson("gpt-4o-2024-11-20"),
    "gpt-4o-2024-08-06": modelFromJson("gpt-4o-2024-08-06"),
    "gpt-4o-2024-05-13": modelFromJson("gpt-4o-2024-05-13"),
    "gpt-4o-mini": modelFromJson("gpt-4o-mini"),
    "gpt-4o": modelFromJson("gpt-4o"),
    
    // Anthropic Claude Models
    "claude-haiku-4.5": modelFromJson("claude-haiku-4.5"),
    "claude-opus-4.1": modelFromJson("claude-opus-4.1"),
    "claude-sonnet-4.5": modelFromJson("claude-sonnet-4.5"),
    "claude-sonnet-4": modelFromJson("claude-sonnet-4"),
    "claude-opus-4": modelFromJson("claude-opus-4"),
    "claude-haiku-3": modelFromJson("claude-haiku-3"),
    "claude-sonnet": modelFromJson("claude-sonnet"),
    "claude-haiku": modelFromJson("claude-haiku"),
    "claude-opus": modelFromJson("claude-opus"),

    // Gemini Models
    "gemini-2.5-pro": modelFromJson("gemini-2.5-pro"),
    "gemini-2.5-flash": modelFromJson("gemini-2.5-flash"),
    
    // data from this website since other study had no data for gemini models 3+
    // https://www.climatealigned.co/tools/ai-footprint-calculator
    "gemini-3.1-pro": modelFromJson("gemini-3.1-pro"),
    "gemini-3-flash": modelFromJson("gemini-3-flash"),
};

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

// returns correct Record item from modelRegsitry based on input string, null if no match found
export function getModel(inputString: string): TieredModel | null {
    if (inputString === undefined) {
        return null;
    }
    const normalisedInput = inputString.trim().toLowerCase();
    if (!normalisedInput) {
        return null;
    }
    const exactKey = Object.keys(modelRegistry).find(k => k.toLowerCase() === normalisedInput);
    if (exactKey) {
        return modelRegistry[exactKey];
    }

    // if the model index is not an exact match, find partial match. Ordering of registry allows this to filter correctly 
    const defaultModelKey = Object.keys(modelRegistry).find(k => normalisedInput.includes(k.toLowerCase()));
    if (defaultModelKey) {
        return modelRegistry[defaultModelKey];
    }
    return null;
}
    
// takes model name and tokens, returns carbon in grams for the call
export function calculateEmission(modelName: string, numTokens: number) {
    const energy = getEnergy(modelName, numTokens); // energy in kwh from call using tokens
    const gridCarbonIntensity = carbonIntensityGrid; // gco2e/kwh from configuration or default
    // + M
    return energy * gridCarbonIntensity; // returns carbon in grams for this call
}

// takes model name and tokens, returns energy in kwh for the call
export function getEnergy(modelName: string, numTokens: number): number {
    if (numTokens < 0) { return 0; }
    const chosenModel = getModel(modelName);
    const energyWh = chosenModel?.calculate(numTokens) ?? 0;
    const energyKwh = energyWh / 1000; // convert Wh to kWh
    return energyKwh;
}
