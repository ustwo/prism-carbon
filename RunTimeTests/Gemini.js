import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-3-flash-preview";
const MODEL_PRESETS = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
];

function parseArgs() {
  const args = process.argv.slice(2);
  let model = DEFAULT_MODEL;
  let listModels = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--list-models") {
      listModels = true;
    } else if (arg === "--model") {
      model = args[index + 1] ?? DEFAULT_MODEL;
      index += 1;
    }
  }

  return { model, listModels };
}


const ai = new GoogleGenAI({});

async function main() {
  const { model, listModels } = parseArgs();

  if (listModels) {
    console.log("Available model presets:")
    MODEL_PRESETS.forEach((modelName) => console.log(`- ${modelName}`));
    return;
  }

  const response = await ai.models.generateContent({
    model,
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

main();