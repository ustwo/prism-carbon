# Ecode README

This is the README for Ecode - the extension that monitors carbon costs associated with LLM and AI inputs and presents statistics on this data.

<!-- ## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow. -->

## Requirements

Dependencies are specified in the `package.json` file and can easily be installed by running 
`npm install`
in the extension root.

## Extension Settings

This extension contributes the following settings:

* `ecode.openDashboard`: Opens the Carbon Dashboard to show carbon impact statistics
* `ecode.clearStore`: Resets the stored carbon impact statistics for the session
* `ecode.interceptorStart`: Start the runtime listener
* `ecode.interceptorStop`: Stop the runtime listener
* `ecode.interceptorOpenTerminal`: Open the runtime analysis terminal 
* `ecode.refreshLogs`: Fetches the latest calls made during development time

## Menu

The menu on the bottom right is the main access interface for the Ecode extension. On launch, the user is prompted to set their GitHub Copilot Chat debug level to "Trace" to enable development time analysis functionality.

## Known Issues

Gemini runtime carbon conversions uses an average cost regardless of specific model.
Lack of custom budget setting.
Images don't produce a carbon cost - image json response doesn't give tokens, since pricing is done
  by image size, quality, model used for generation, and quality. These fields have all been parsed,
  but the research and implementation for carbon measuring is in progress.


## Release Notes


### 1.0.0

Initial release of ecode, supports all Claude models.



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
