# Change in method for tracking tokens during development time
> Updated 28/01/2026
---

After conducting research into the way Cursor and Copilot handle requests and any returned metadata, we have concluded that we will have to pivot to a different method.

## Original plan - Cursor

Our original plan for tracking development time request tokens using Cursor stemmed from research into other VSCode extensions which claim to track tokens sent to/received from LLMs through Cursor/Copilot. In particular, [this](https://github.com/Ittipong/cursor-price-tracking) extension seemed to do exactly what we were after in terms of getting tokens directly from Cursor via an API. Upon further inspection however, this extension and others like it are just querying the endpoints of the Cursor dashboard, leaving the extension subject to breaking whenever Cursor make changes to their dashboard and making it difficult to actually associate a given request with its token count.

## Original plan - Copilot 

With Copilot, we managed to get a method working which overrode keybindings for LLM requests, checked when Copilot was no longer active and then parsed any text pasted into the document via a tokeniser. This worked better than what we had for Cursor, however there is no guarantee that any pasted text actually came from a Copilot suggestion (as opposed to, say, just copying and pasting), and we could not find any reliable way of getting the model used to parse the request (meaning it would be difficult to run it through a tokeniser for a specific model).

## The new plan

We have now discovered that if the internal logging for Copilot and Cursor is set to "trace" (i.e. creating more verbose logs), we are able to capture the model used (both set by the user and for any internal requests made by Copilot), the input text and the output text. It won't reliably give us exact token counts, but this means we can pass any input/output text through a tokeniser to get estimated token counts. Throughout the development process, we will be thoroughly testing this method to ensure the estimated token counts are as close as possible to the actual token counts seen in a given request. 


## Archiving 

All development done for the previous method is archived under the branch "ARCHIVE-CopilotChat" for documentation purposes. 