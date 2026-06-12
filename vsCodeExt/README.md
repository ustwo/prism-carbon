# PRISM — AI Carbon Tracker

PRISM estimates the carbon footprint of AI interactions in your IDE. It captures token usage from GitHub Copilot Chat, Claude Code, and runtime LLM API calls, then shows CO₂ equivalents in the sidebar, status bar, and a live dashboard.

---

## What PRISM tracks

| Source | How it's captured |
|---|---|
| GitHub Copilot Chat | Reads Copilot's log file (requires Trace log level — see setup below) |
| Claude Code | Reads Claude Code's log file automatically |
| Runtime LLM calls | HTTP proxy intercepts API calls in VS Code terminals |

---

## First-time setup

On activation, PRISM will prompt you to set GitHub Copilot Chat's log level to **Trace**. This is required for development-time log capture.

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
2. Run **Developer: Set Log Level…**
3. Select **GitHub Copilot Chat** → **Trace**.

Everything else starts automatically — no further configuration needed.

---

## How to use

### Sidebar

The **PRISM** panel in the Activity Bar shows a timestamped log of all captured calls, grouped into the current session and an expandable archive. Each entry shows the model used and its estimated CO₂ cost.

### Status bar

The bottom status bar shows the carbon cost of the most recent call, colour-coded by percentile:

- **Green** — below the 50th percentile of your recorded calls
- **Amber** — 50th–90th percentile
- **Red** — above the 90th percentile
- **Grey** — fewer than 10 calls recorded (not enough data to classify)

### Dashboard

Open the full dashboard via the Command Palette:

```
PRISM: Open Carbon Dashboard
```

The dashboard shows a timeline graph, model breakdown, and cumulative session emissions. Colour thresholds and other preferences are configurable from the dashboard's settings panel.

### Runtime analysis

Open any terminal in VS Code — PRISM automatically injects the proxy env vars. Run your scripts as normal; LLM API calls are captured and appear in the sidebar in real time.

---

## Commands

| Command | Description |
|---|---|
| `PRISM: Open Carbon Dashboard` | Opens the dashboard |
| `PRISM: Reset budget window` | Clears current session data |
| `PRISM: Purge all stored logs` | Deletes all archived call history |

---

## Supported models

### GitHub Copilot
- raptor-mini (free tier)

### OpenAI
- o1, o3, o3-mini, o4, o4-mini (all effort levels)
- GPT-4o, GPT-4o Mini
- GPT-4 Turbo, GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano
- GPT-5 (all variants: high, medium, low, mini, nano)

### Anthropic
- Claude Haiku, Sonnet, Opus (3.x and 4.x families)

### Google
- Gemini 2.5 Flash, Gemini 2.5 Pro
- Gemini 3 Flash, Gemini 3.1 Pro

> Models not in the list return zero emissions. Open an issue to request support for a new model.

---

## Known issues

- **Images** — image API responses don't include token counts (pricing is by image size and quality), so image generation calls are not tracked.
- **Timeline zoom** — in some cases the zoom control on the timeline graph doesn't produce a scrollable view, limiting granular analysis.
- **Gemini / older GPT tokenisation** — text is tokenised client-side for Gemini and pre-GPT5 models; caching can prevent some calls (e.g. function calls) from being captured.
- **Water usage** — water consumption data is not yet in the model registry.

---

## Development setup

For full setup instructions see the [repository README](../README.md#devIn).

---

## Issues and feedback

PRISM is under active development. If you find a bug or want to request a feature, please open an issue on GitHub.
