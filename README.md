[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](#)
[![Visual Studio Code](https://custom-icon-badges.demolab.com/badge/Visual%20Studio%20Code-0078d7.svg?logo=vsc&logoColor=white)](#)
[![Cursor](https://custom-icon-badges.demolab.com/badge/Cursor-000000?logo=cursor-ai-white)](#)
[![GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-000?logo=githubcopilot&logoColor=fff)](#)


<h1> Estimating Carbon in Digital Product Development</h1>


<h2>Contents:</h2>

- [Overview](#overview)
- [Building a Carbon-Aware Dev toolkit](#carbon-toolkit)
- [User Stories](#user-stories)
- [Stakeholders](#stakeholders)
- [How To Run](#devIn)
- [Installing on another machine](#installing-on-another-machine)
- [Project Structure](#structure)
- [Team Members](#team)


<h2 id="overview">Overview:</h2>
There are already tools and plugins that measure the carbon footprint of code builds, infrastructure usage, or web
performance. Some VS Code extensions even estimate the environmental cost of local development. However, none of
them track AI token usage in context, and certainly not in a way that separates:
<ul><li> Tokens sent to LLMs during app runtime inside the IDE (for example, while running and testing code).</li></ul>
<ul><li>Tokens sent to LLMs for development support (the behind-the-scenes calls that power Cursor’s chat and AI-assisted
features).</li></ul> 
This is the gap we want to explore. By focusing on these two AI-specific metrics, we can give developers and teams
visibility over both the carbon and cost of their AI usage, making it possible to make smarter, lower-impact choices earlier

<pre>
AI Users
    ↓
Tracking AI Usage
    ↓
Estimating the Carbon
    ↓
Visual Dashboard (Results)
</pre>

<h2>Level 1 C4 diagram</h2>

![C4 Level 1 Diagram](https://github.com/spe-uob/2025-EstimatingCarbon/blob/main/Images/Level1%20C4.png?raw=true)

<h2>Level 2 C4 diagram</h2>

![C4 Level 2 Diagram](https://github.com/spe-uob/2025-EstimatingCarbon/blob/main/Images/C4%20MODEL%20LEVEL%202.png)

<h2 id="carbon-toolkit">Building a Carbon-Aware Dev toolkit:</h2>

We aim to design a toolkit that:
<ul>
<li>Tracks AI token usage from two sources</li>
  <ul>
  <li>Runtime interactions</li>

  <li>AI assisted code</li>
  </ul>
  
<li>Estimates carbon footprint</li>

<li>Shows the results where they matter:</li>
  <ul>
  <li>IDE</li>
  <li>Pull requests</li>
  </ul>

  <li>Possible Features:</li>
  <ul>
    <li>An IDE overlay that shows tokens, model used, cost, and carbon for each AI call.</li>
    <li>A “scenario tester” to compare the carbon and cost impact of using different models and LLM providers.</li>
    
  </ul>
  <h2 id="stakeholders"> Stakeholders </h2>
  <h3> Developer </h3>
  <li><b> Who They Are: </b> Software engineers who write, test, and debug code on a daily basis, often using AI-assisted tools </li>
  <li> <b>Their Improvements: </b> They are the primary end-users. The toolkit provides them with real-time data within their IDE, allowing them to see the environmental impact of their code and make more carbon-efficient development choices</li>
  <h3> Project Managers</h3>
  <li><b>Who They Are:</b> Individuals who oversee project planning, resource allocation and reporting</li>
  <li><b>Their Involvement:</b> The toolkit allwos them to assess a projects overall environmental impact. They can use this data to identify carbon-heavy implementation, guide redesigns, and report on sustainability metrics</li>

<h3>AI Engineers</h3>
  <li><b>Who They Are: Specialists who design, build and optimise artificial intelligence models </b></li>
    <li><b>Their Involvement:</b> The toolkit helps them discover inefficiencies in their models by highlighting API calls with a disproportionately large carbon cost, enabling targeted optimistation</li>

 


  <h2 id="user-stories"> User Stories: </h2>
  <ul>
    <li>As a developer, I want to know what impact my code has on the envrionment so I can make better and more carbon efficient development choices.</li>
    <li>As a Project Manager, I want to know how impactful my project is, and which areas of a coded solution are the most environmentally costly so I can identify less carbon heavy implementations, and utilise this to re-design prototypes</li>
    <li>As an engineer at an Artifical Intelligence company, I can easily see and discover any massive inefficiencies in my AI model due to an overtly large relative carbon cost.</li>
  </ul>
<h2 id ="devIn">Dev instructions</h2>

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Visual Studio Code](https://code.visualstudio.com/) v1.74 or later

### 1. Install dependencies

From the `vsCodeExt/` directory:

```bash
npm run setup
```

This runs `npm install` and compiles the TypeScript source in one step.

### 2. Run the extension in development mode

Open the `vsCodeExt/` folder in VS Code, then press **F5** (or go to **Run → Start Debugging**).

This launches a new **Extension Development Host** window with the extension loaded. Any changes to the source require restarting the host (`Ctrl+Shift+F5` / `Cmd+Shift+F5`) to take effect — or run in watch mode (step 3) to rebuild automatically.

### 3. Watch mode (optional)

To rebuild automatically on file changes:

```bash
npm run watch
```

Then restart the Extension Development Host after each rebuild.

### 4. Test the extension manually

Inside the Extension Development Host:

- **Runtime analysis:** run **"Start Proxy Interceptor"** → **"Open Runtime Terminal"** → run your script in the terminal that opens. Carbon costs appear in the sidebar and status bar in real time.
- **Development-time analysis:** run **"Developer: Set Log Level"** → **"GitHub Copilot Chat"** → **"Trace"**, then use **"Refresh carbon data"** to pull the latest Copilot usage.
- **Dashboard:** run **"Open Carbon Dashboard"** to open the full visualisation.

### 5. Package the extension as a `.vsix` (optional)

```bash
npm run build:vsix
```

This compiles the source and produces `Estimating_Carbon.vsix` in `vsCodeExt/distExtension/`, ready to share with other developers.

### 6. Run tests

```bash
npm test
```

<br>

## Installing on another machine

If you have received a `Estimating_Carbon.vsix` file and want to install the extension without cloning the repo:

### Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/) v1.74 or later (or [Cursor](https://www.cursor.com/))

### Option A — VS Code UI

1. Open VS Code.
2. Go to the **Extensions** panel (`Cmd+Shift+X` / `Ctrl+Shift+X`).
3. Click the **`···`** menu (top-right of the panel).
4. Select **Install from VSIX…**
5. Choose the `.vsix` file.
6. Reload VS Code when prompted.

### Option B — Terminal

```bash
code --install-extension "Estimating_Carbon.vsix"
```

For Cursor, replace `code` with `cursor`.

### After installing

- The **Estimating Carbon** icon appears in the Activity Bar (left sidebar).
- No build step or Node.js required — the extension is fully bundled.

<br>

## User Instructions
Please reference the "How to Use" in the ReadMe of the Extension [here](vsCodeExt/README.md)


    
<h2 id="structure">Project Structure</h2>
<pre>
├── Images/                        # architecture diagrams
├── ProjectNotes/                  # meeting minutes, research, and documents
│   ├── Documents/                 # handover doc, methodology report
│   ├── Meetings/                  # client meeting notes
│   ├── Minutes/                   # weekly workshop minutes
│   └── Research/                  # background research
├── Releases/                      # packaged .vsix builds
├── RunTimeTests/                  # sample scripts for testing runtime analysis
│   ├── Gemini.py / Gemini.js
│   ├── OpenAI.py
│   └── WeatherAPI.py
├── README.md                      # this file
├── Methodology.md                 # carbon calculation documentation
└── vsCodeExt/                     # VS Code extension (main deliverable)
    ├── package.json               # extension manifest and scripts
    ├── models.json                # emissions rates per model
    ├── esbuild.js                 # build script
    ├── tsconfig.json
    ├── public/                    # static frontend assets (served in webviews)
    │   ├── dashboard/             # carbon dashboard UI
    │   │   ├── dashboard.html
    │   │   ├── dashboard.js
    │   │   ├── graph.js           # timeline graph logic
    │   │   └── style.css
    │   └── miniview/              # compact budget miniview panel
    │       ├── miniview.html
    │       ├── miniview.js
    │       └── miniview.css
    └── src/                       # TypeScript source
        ├── extension.ts           # entry point — registers all commands and listeners
        ├── extensionState.ts      # shared mutable state across the extension
        ├── commands/              # VS Code command handlers
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
        │   └── budgetMiniView.ts  # budget miniview panel
        └── utils/
            ├── callId.ts
            ├── gitUtils.ts
            └── logger.ts
</pre>

## Documents
1. Handover Document: Go to [`ProjectNotes/Documents/Handover Document.pdf`](ProjectNotes/Documents/Handover%20Document.pdf) for the handover document. This includes instructions, features, maintenance guidance, future development, and issues.
2. Methodology Report: Go to [`ProjectNotes/Documents/Emission Calculation Methodology.pdf`](ProjectNotes/Documents/Emission%20Calculation%20Methodology.pdf) for a detailed report on our methodology and our considerations when estimating carbon emissions.


  <h2>Client Names</h2>
  <ul>
    <li>Paolo Rizzi</li>
    <li>Nayan Jain</li>
    <li>Nick Hegarty</li>
  </ul>
  
  <h2 id="team"> Team Members </h2>
  <ul>
    <li>Hao Ni (wx24939) </li>
    <li>Iman Hadi (jp24368) </li>
    <li>Jacob Connor (gn24034)</li>
    <li>Max Davies (cg24012)</li>
    <li>Morgan Parry (vi24348)</li>
    <li>Aayush Bhalerao (in24486)</li>
  </ul>
  <h2> Supporting Mentor</h2>
  <ul> 
    <li>Murray Groves (ij22909)</li>
  </ul>
</ul>

