Architecture

    listens to workspace.onDidChangeTextDocument
        specifically looking for edits of more than one character (i.e not typing copy and paste or AI generated)

        watches for inline suggestion accept commands  
            for example
                editor.action.inline


        pass the newly generated code into tiktokeniser 


Issues currently being faced
    cannot programatically test copilot because as copilot dont let you programatically call the model when testing.
    

Issues been faced
    intercepting the message and sending it to the model ourselves seems to breach ToS under privacy
    Copilot seems to keep the model used hidden and is unable to access
    Unable to access inline code generation which is not accepted as it is "Ghost text"

Possible solutions
    instead of making it model specific find a mean number of tokens by tokenising the message under multiple different models

Solutions Tried
    overriding the AI commands to add my functionality then calling the original 
    checking every interval to see if copilot has suggested a change
    setting up a new command and overriding the keypress to accept
