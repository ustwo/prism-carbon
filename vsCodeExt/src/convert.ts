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
//99999999999999999999999999999999999999999999999999999999999999;
export const modelRegistry: Record<string, TieredModel> = {
    // "gpt-4o-mini": new TieredModel("GPT4oMini", [{ limit: 400, energyPerToken: 0.00923 }, { limit: 2000, energyPerToken: 0.00369 }, { limit: 11500, energyPerToken: 0.0006293 }]),
    "gpt-3.5-turbo": new TieredModel("GPT3.5Turbo", [{ limit: veryLarge, energyPerToken: 0.000002 }]),// kwh (1)
    "gpt-4-turbo": new TieredModel("GPT4Turbo", [{ limit: veryLarge, energyPerToken: 0.000006 }]), //kwh (1)
    "gpt-4o": new TieredModel("GPT4o", [{ limit: veryLarge, energyPerToken: 0.0000012 }]), //kwh (1)
    // "gpt-4.5": new TieredModel("GPT4.5", [{ limit: veryLarge, energyPerToken: 0.0003 }]),
    "gpt-4": new TieredModel("GPT4", [{ limit: veryLarge, energyPerToken: 0.000006 }]), //kwh (1)
    "gpt-5": new TieredModel("GPT5", [{ limit: veryLarge, energyPerToken: 0.00269722222 }]), // ESTIMATED //https://impact.esg.ai/
    // "claude-haiku-4.5": new TieredModel("ClaudeHaiku4.5", [{ limit: veryLarge, energyPerToken: 0.000269444444 }]),  //https://impact.esg.ai/
    // "claude-sonnet-4.5": new TieredModel("ClaudeSonnet4.5", [{ limit: veryLarge, energyPerToken: 0.0005388888889 }]),  //https://impact.esg.ai/
    // "claude-opus-4.5": new TieredModel("ClaudeOpus4.5", [{ limit: veryLarge, energyPerToken: 0.0561888888888889 }]),  //https://impact.esg.ai/
    // "claude": new TieredModel("Generic Claude", [{ limit: veryLarge, energyPerToken: 0.000969444444 }]), // generic claude catcher
    "gemini": new TieredModel("Gemini", [{ limit: veryLarge, energyPerToken: 0.0006 }]),
    // "gpt": new TieredModel("Generic GPT Model", [{ limit: veryLarge, energyPerToken: 0.00036 }]) // emissions based on 0.09g per median gemini prompt. Assuming this to be 250 tokens (input and output) then 0.09/250

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
    const lowerModel = inputString.toLowerCase();
    if (modelRegistry[lowerModel]) { return modelRegistry[inputString]; }
    const key = Object.keys(modelRegistry).find(k => inputString.includes(k));
    return key ? modelRegistry[key] : null;
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