// // convert tokens to carbon

// class LLMModel {
//     modelName : string;
//     carbonPerToken : double; //in grams
//     waterPerToken : double; //in ml

//     public getCarbon(tokens): double {
//         return this.carbonPerToken * tokens
//     }

//     public getWater(tokens): double {
//         return this.waterPerToken * tokens
//     }
// }
// function calculateEmission(model: string, token: number) {
//     // grams of co2 emitted per token (averaged over output and input)
//     const chatgpt4oshort = 0.000000370125;
//     const chatgpt4omedium = 0.000000212625;
//     const chatgpt4olong = 0.0000000875;
//     const chatgpt4ominishort = 0.00923;
//     const chatgpt4ominimedium = 0.00369;
//     const chatgpt4ominilong = 0.0006293;
//     const chatgpt4point5 = 0.0003;

//     let carbon = 0;
//     const lowerModel = model.toLowerCase();

//     if (lowerModel.includes("gpt-4o-mini")) {
//         if (token <= 400) {
//             carbon = chatgpt4ominishort * token;
//         } else if (token <= 2000) {
//             carbon = chatgpt4ominimedium * token;
//         } else if (token <= 11500) {
//             carbon = chatgpt4ominilong * token;
//         }
//     } else if (lowerModel.includes("gpt-4o")) {
//         if (token <= 400) {
//             carbon = chatgpt4oshort * token;
//         } else if (token <= 2000) {
//             carbon = chatgpt4omedium * token;
//         } else if (token <= 11500) {
//             carbon = chatgpt4olong * token;
//         }
//     } else if (lowerModel.includes("gpt-4.5")) {
//         carbon = chatgpt4point5 * token;
//     }
//     return carbon;
// }