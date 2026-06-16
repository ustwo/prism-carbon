[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](#)
[![Visual Studio Code](https://img.shields.io/badge/VS%20Code-0078d7?logo=visualstudiocode&logoColor=white)](#)
[![GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-000?logo=githubcopilot&logoColor=fff)](#)

# PRISM — AI Carbon Tracker

PRISM is a VS Code extension that estimates the carbon footprint of AI interactions in your IDE. It captures token usage from GitHub Copilot Chat, Claude Code, and runtime LLM API calls, then calculates CO₂ equivalents and surfaces them in the sidebar, status bar, and a live dashboard.

## What PRISM tracks

| Source | How it's captured |
|---|---|
| GitHub Copilot Chat | Reads Copilot's log file (requires Trace log level — see setup below) |
| Claude Code | Reads Claude Code's log file automatically |
| Runtime LLM calls | HTTP proxy intercepts API calls in VS Code terminals |

## Contents

- [How it works](#how-it-works)
- [First-time setup](#first-time-setup)
- [How to use](#how-to-use)
- [Commands](#commands)
- [Supported models](#supported-models)
- [Known issues](#known-issues)
- [How to run](#devIn)
- [Project structure](#structure)
- [Documents](#documents)

---

<h2 id="how-it-works">How it works</h2>

PRISM captures AI token usage from two sources:

- **Development-time** — reads log files from GitHub Copilot Chat and Claude Code automatically on every file save.
- **Runtime** — an HTTP proxy intercepts outbound LLM API calls; proxy environment variables are injected into every new VS Code terminal so scripts run without any manual configuration.

Results appear immediately in the sidebar tree, status bar, and dashboard.

---

<h2 id="first-time-setup">First-time setup</h2>

On activation, PRISM will prompt you to set GitHub Copilot Chat's log level to **Trace**. This is required for development-time log capture.

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
2. Run **Developer: Set Log Level…**
3. Select **GitHub Copilot Chat** → **Trace**.

Everything else starts automatically — no further configuration needed.

---

<h2 id="how-to-use">How to use</h2>

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

Open any terminal in VS Code — PRISM automatically injects the proxy environment variables. Run your scripts as normal; LLM API calls are captured and appear in the sidebar in real time.

---

<h2 id="commands">Commands</h2>

| Command | Description |
|---|---|
| `PRISM: Open Carbon Dashboard` | Opens the dashboard |
| `PRISM: Reset budget window` | Clears current session data |
| `PRISM: Purge all stored logs` | Deletes all archived call history |

---

<h2 id="supported-models">Supported models</h2>

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

<h2 id="known-issues">Known issues</h2>

- **Images** — image API responses don't include token counts (pricing is by image size and quality), so image generation calls are not tracked.
- **Timeline zoom** — in some cases the zoom control on the timeline graph doesn't produce a scrollable view, limiting granular analysis.
- **Gemini / older GPT tokenisation** — text is tokenised client-side for Gemini and pre-GPT5 models; caching can prevent some calls (e.g. function calls) from being captured.
- **Water usage** — water consumption data is not yet in the model registry.

---

<h2 id="devIn">How to run PRISM</h2>

There are two ways to run the extension: directly from source (for development and contributing), or by building and installing a `.vsix` package.

---

### Option A — Run from source (development)

Use this when you have cloned the repository and want to develop or test the extension.

#### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Visual Studio Code](https://code.visualstudio.com/) v1.74 or later

#### 1. Install dependencies

From the repository root:

```bash
npm run setup
```

This runs `npm install` and compiles the TypeScript source in one step.

#### 2. Launch the extension

Open the repository folder in VS Code, then press **F5** (or go to **Run → Start Debugging**).

This opens a new **Extension Development Host** window with PRISM loaded. Changes to the source require restarting the host (`Ctrl+Shift+F5` / `Cmd+Shift+F5`) to take effect.

#### 3. Watch mode (optional)

To rebuild automatically on every file save:

```bash
npm run watch
```

Restart the Extension Development Host after each rebuild to pick up changes.

#### 4. Run tests

```bash
npm test
```

---

### Option B — Build and install a VSIX package

Use this to produce a self-contained `.vsix` file you can install on any machine without cloning the repo.

#### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Visual Studio Code](https://code.visualstudio.com/) v1.74 or later (or [Cursor](https://www.cursor.com/))

#### 1. Build the VSIX

From the repository root:

```bash
npm run release
```

This compiles the source and produces `PRISM-CARBON.vsix` inside `distExtension/`.

#### 2. Install the VSIX

**Via VS Code UI:**

1. Open VS Code.
2. Go to the **Extensions** panel (`Cmd+Shift+X` / `Ctrl+Shift+X`).
3. Click the **`···`** menu (top-right of the panel).
4. Select **Install from VSIX…**
5. Choose `PRISM-CARBON.vsix`.
6. Reload VS Code when prompted.

**Via terminal:**

```bash
code --install-extension "distExtension/PRISM-CARBON.vsix"
```

For Cursor, replace `code` with `cursor`.

#### After installing

- The **PRISM** icon appears in the Activity Bar (left sidebar).
- No build step or Node.js required on the target machine — the extension is fully bundled.

---

<h2 id="structure">Project structure</h2>

```
├── README.md                  # this file
├── package.json               # extension manifest and scripts
├── models.json                # emissions rates per model
├── esbuild.js                 # build script
├── tsconfig.json
├── distExtension/             # packaged .vsix output (git-tracked folder, contents ignored)
├── public/                    # static frontend assets (served in webviews)
│   ├── dashboard/             # carbon dashboard UI
│   │   ├── dashboard.html
│   │   ├── dashboard.js
│   │   ├── graph.js           # timeline graph logic
│   │   └── style.css
│   └── miniview/              # compact emissions miniview panel
│       ├── miniview.html
│       ├── miniview.js
│       └── miniview.css
└── src/                       # TypeScript source
    ├── extension.ts           # entry point — registers all commands and listeners
    ├── extensionState.ts      # shared mutable state across the extension
    ├── commands/              # VS Code command handlers
    │   ├── index.ts
    │   ├── menu.ts            # bottom-right menu
    │   ├── openDashboard.ts
    │   ├── clearStore.ts
    │   ├── purgeStore.ts
    │   ├── selectCall.ts
    │   ├── deleteCall.ts
    │   ├── copyCall.ts
    │   └── inputDisplay.ts
    ├── core/                  # business logic
    │   ├── budget.ts          # Call type definitions and usage calculations
    │   ├── callManager.ts     # session and archive call management
    │   ├── convert.ts         # token counts → carbon emissions
    │   ├── fileLogger.ts      # persistent file-based call logging
    │   ├── state.ts           # runtime interceptor flag
    │   └── capture/           # data capture layer
    │       ├── captureProvider.ts
    │       ├── sseParser.ts   # SSE stream parsing for intercepted calls
    │       └── adapters/
    │           ├── interceptor/   # runtime proxy capture
    │           │   ├── interceptorAdapter.ts
    │           │   └── providers/ # per-provider parsers (Anthropic, OpenAI, Gemini)
    │           └── log/           # development-time log capture
    │               ├── logAdapter.ts
    │               ├── logProvider.ts
    │               └── providers/ # Copilot and Claude Code log parsers
    ├── dashboard/             # dashboard webview host
    │   ├── dashboard.ts
    │   ├── dashboardData.ts
    │   └── webviewContent.ts
    ├── listeners/             # VS Code event listeners
    │   ├── index.ts
    │   ├── branchChangeListener.ts
    │   ├── launchButton.ts
    │   ├── logRefreshListener.ts
    │   └── saveListener.ts
    ├── proxy/                 # runtime HTTP proxy server
    │   ├── proxyServer.ts
    │   └── serverWorker.ts
    ├── ui/                    # VS Code UI components
    │   ├── treeView.ts        # sidebar call history tree
    │   ├── statusBar.ts       # status bar carbon indicator
    │   └── budgetMiniView.ts  # emissions miniview panel
    └── utils/
        ├── callId.ts
        ├── gitUtils.ts
        └── logger.ts
```

---

<h2 id="documents">Documents</h2>

- **Prism User Manual** — [`docs/Welcome to Prism.pdf`](docs/Welcome%20to%20Prism.pdf): overview of Prism and its features.
- **Methodology Report** — [`docs/Prism Emission Calculation Methodology.pdf`](docs/Prism%20Emission%20Calculation%20Methodology.pdf): detailed explanation of the carbon estimation approach.

---

## Issues and feedback

PRISM is under active development. If you find a bug or want to request a feature, please open an issue on GitHub.
