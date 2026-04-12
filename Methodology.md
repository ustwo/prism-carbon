Calculation based on: Model-specific energy consumption data, Global average Grid Intensity (471gCO2e/kwh) (unless specific region is selected when using Azure OpenAI or Google Vertex AI, at which point localised grid intensities are selectable in settings.json)

Our carbon emission calculator is based on the best data we could find, but AI model providers do not publish transparent per-token energy or CO₂ data. Most available values come from vendor claims or research estimates. Values here should be treated as indicative, not exact. The emission data we provide is purely from generations prompted by the user (inference). The carbon footprint of training specific models is not taken into consideration. Inference makes up ~90% of the emission footprint of an AI model <link>href link=https://watershed.com/en-GB/blog/ai-emissions-sustainability</link> [1]

Methodology & Sources
This calculator estimates the CO₂ emissions of AI model use. It combines published research on AI energy use with public electricity grid data and ecological studies.

1. AI Model Emissions
Different AI models require different amounts of energy per token or per query. Because providers do not publish precise numbers, we used estimates from independent research, industry reports and provider announcements:

Jegham et al. (2025)– How Hungry is AI? Benchmarking Energy, Water, and Carbon Footprint of LLM Inference.

Strubell et al. (2019)– quantify the training and inference costs of NLP models.

Patterson et al. (2021, Google)– examine the emissions of large-scale AI systems.

Lacoste et al. (2019)– propose a framework for measuring ML emissions.

OECD AI reports and recent LCA studies (2023–2024)– offered updated ranges for inference efficiency.

Ren et. al. (2024)– Reconciling the contrasting narratives on the environmental impact of large language models

Mistral AI (2025)- Our contribution to a global environmental standard for AI

Anthropic (2024)- Claude 3 announcement

Google (2023)- Introducing Gemini

Meta- Meta Llama 3 (2024)

Meta- Meta Llama 2 (2023)

From these sources, we extracted reported ranges of CO₂ per 1,000 tokens and then took the median value for each model. Estimates vary hugely between sources, especially more recently, so we looked for concurrances and source authority, but this data can be regarded as a "best guess" based on available information.

GPT-3.5-turbo: 0.773 gCO₂ per 1000 tokens

GPT-4: 1.745 gCO₂ per 1000 tokens

GPT-4-turbo: 1.461 gCO₂ per 1000 tokens

GPT-4.1: 0.810 gCO₂ per 1000 tokens

GPT-5: 0.90 gCO₂ per 1000 tokens

Claude-3-haiku: 0.25 gCO₂ per 1000 tokens

Claude-3-sonnet: 0.55 gCO₂ per 1000 tokens

Claude-3-opus: 1.2 gCO₂ per 1000 tokens

Claude-4: 0.8 gCO₂ per 1000 tokens

Gemini-pro: 0.35 gCO₂ per 1000 tokens

Llama-2-70b: 1.5gCO₂ per 1000 tokens

Llama-3-70b: 1.3 gCO₂ per 1000 tokens

Mistral-large: 0.2gCO₂ per 1000 tokens

A query is roughly assumed to be 400 tokens.

Note there is no published data on Gpt-5, Claude-3-opus or Claude-4, so we based their values on inferences.

2. Grid Carbon Intensity
Electricity emissions depend on where the AI runs. To reflect the differing grid intensities of different regions, we apply regional multipliers based on electricity grid intensity (grams of CO₂ per kWh):

Ember Global Electricity Review 2024, IEA data, and Our World in Data were used.

These values capture the differences in regional power mixes — coal-heavy grids emit more CO₂ per kWh, while renewables-heavy grids emit less.

US West: 280 gCO₂/kWh, intensity multiplier: 1.0

US East: 400 gCO₂/kWh, intensity multiplier: 1.25

Europe: 350 gCO₂/kWh, intensity multiplier: 0.65

Asia Pacific: 500 gCO₂/kWh, intensity multiplier: 1.8

The user's datacenter region is inferred from the region they select. This is a simplification of the way data routing works - in actuality a user's data could be split up and processed in multiple locations for efficiency. But for the purposes of the calculator we chose the nearest region for illustrative purposes.

3. Tree Carbon Sequestration
We convert emissions into the number of trees required to mitigate that carbon footprint. We assume:

A mature native tree planted via Trees That Count is estimated to sequester ≈220 kg CO₂ over its 50 year lifespan.

Accounting for a typical 85% survival rate for plantings, the effective sequestration per planted tree is about 3.74 kg CO₂/yr.

This means one tree is treated as mitigating about 3.74 kg CO₂ per year.

4. Calculation Steps
User input (queries or tokens) × model emission factor = baseline emissions.

Multiply by the regional grid intensity multiplier.

Scale to daily or annual totals depending on the user's timeframe.

Divide annual emissions by 3.74 kg CO₂/tree to estimate the number of trees needed.

Important Note
All results are estimates, not exact measurements. They incorporate AI usage, not the carbon costs of building the infrastructure for AI, which are enormous. Values here should be treated as giving you an indicative, order-of-magnitude view to help you plant trees, not an exact measurement.