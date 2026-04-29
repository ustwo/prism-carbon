# Ecode README

This is the README for Ecode - the extension that monitors carbon costs associated with LLM and AI inputs and presents statistics on this data.

## How To Use:

On installation, you will be prompted to set the `Github Copilot Chat` log level to `Trace`. This is shown below:
<video controls src="SetTraceLevel.mp4" title="Set Trace Level"></video>

The main way to use the extension is with the Ecode Menu at the right hand side of the taskbar (yellow circle). Average Carbon Cost for a session is shown at the left hand side of the taskbar (green circle)
![alt text](<Interface Explanation.png>)

Carbon emissions are tracked during development when using copilot chat, or inline copilot generations (ctrl+i) with claude models. Tab autocompletes are not yet supported. 

To track emissions when running a file, use the menu to start runtime analysis. Within the terminal that opens, run your files as normal. The carbon cost is calculated in real time.

A dashboard that shows information on the emissions produced and models used is openable through the menu and updates in real time.

A history of all carbon calls made within a session can be found using the Estimating Carbon view in the left hand panel. This shows a comprehensive dated log of carbon emissions and models used.

<!-- ## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow. -->

<!-- ## Requirements

Dependencies are specified in the `package.json` file and can easily be installed by running 
`npm install`
in the extension root. -->

## Extension Settings

The below settings can be used to manually force behaviours of the extension. They can be run using Ctrl+Shift+P and then typing in one of the below commands

This extension contributes the following settings:

* `ecode.openDashboard`: Opens the Carbon Dashboard to show carbon impact statistics
* `ecode.clearStore`: Resets the stored carbon impact statistics for the session
* `ecode.interceptorStart`: Start the runtime listener
* `ecode.interceptorStop`: Stop the runtime listener
* `ecode.interceptorOpenTerminal`: Open the runtime analysis terminal 
* `ecode.refreshLogs`: Fetches the latest calls made during development time

<!-- ## Menu

The menu on the bottom right is the main access interface for the Ecode extension. On launch, the user is prompted to set their GitHub Copilot Chat debug level to "Trace" to enable development time analysis functionality. -->

## Known Issues

Gemini runtime carbon conversions uses an average cost regardless of specific model.
Lack of custom budget setting.
Images don't produce a carbon cost - image json response doesn't give tokens, since pricing is done
  by image size, quality, model used for generation, and quality. These fields have all been parsed,
  but the research and implementation for carbon measuring is in progress.


- In some cases, the zoom functionality on the timeline graph doesn't present the user with a scrollable interface. This results in the lack of granular analysis of data outside the view window


## Supported Models:

### Open AI
- GPT4o
- GPT4o Mini
- GPT4.5
- GPT5

### Anthropic
- Claude Haiku 4.5
- Claude Sonnet 4.5
- Claude Opus 4.5

### Gemini
 - All gemini emissions are currently calculated using a constant rate regardless of model


### All other Claude, Gemini, and GPT models
 - Currently unsupported models are calculated using an average rate to reflect an estimation of emissions.


## Release Notes


### 0.0.1

Initial release of ecode, supports all Claude models.

### 0.0.2

Updated support for generic models
Fixed issue with dashboard not loading correctly


### 0.0.3
Updated release readme.md to provide more comprehensive usage instructions



## In case of error!

This is still a project in development, and we encourage the discovery of issues, errors, and requests for improvements. Please reach out using the Bristol University x Ustwo Slack channel or by emailing cg24012@bristol.ac.uk . Thank you!

<!-- ## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines) -->
<!-- 
## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!** -->
