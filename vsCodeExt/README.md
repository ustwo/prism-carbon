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

## Known Issues

Gemini runtime carbon conversions uses an average cost regardless of specific model.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

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
