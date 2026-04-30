<h1>AI </h1>
<p>We declare that any and all AI usage within the project has been recorded and noted below. This includes (but is not limited to) usage of text generation methods incl. LLMs, text summarisation methods, or image generation methods. We understand that failing to divulge use of AI within our work counts as contract cheating and can result in a zero mark for SEP.</p>

<h2>Project AI</h2>
We used AI throughout the project to test our extension's token tracking ability (copilot and cursor). This consisted of using AI autocomplete in dummy code files to track tokens produced during these generations, and using basic python and java scripts that act as a basic AI interface and make API calls to varying AI models. None of the generations used in this testing were implemented within our codebase, but the metadata results from these tests (output logs and json formats) were used to refine our approach and help our data parsing.

In some cases during the testing day, testers used Copilot Chat to generate files that called openAI endpoints. These AI generated files were then run to test the runtime parsing. Some of these files are stored in the RunTimeTests folder as simple test files that are used to test runtime. They are not incooperated into our releases or functional codebase.

<h2>Jacob Connor</h2>
<p>I, Jacob Connor declare that this document is accurate to my AI usage throughout the course of SEP.</p>
<p>All models used have been  ChatGPT, Claude Sonnet 4.6</p> <br>

<h3>Development</h3>

Research into tracking tokens used inline when programming
  this work was eventually archived

Research into testing Development time 

> Prompt used - "How can I programatically invoke the copilot chat within vscode in order to test how my extension responds?"
  
 When conducting research into how to use and test the extensions response to copliot chat I found out that copilot does not allow for this. So I have since decided to research into testing options (without AI)

Research into estimating cached tokens for models which don't directly publishment

> Prompt used - "I am making a project which tracks tokens of various LLMs used when programming in vscode with copilot currently we are using the log files to catch all tokens revealed by the model Copilot and older GPT models don't reveal cached tokens which are a large portion of the overall tokens how could I best estimate this"
  
  When conducting research into how to estimate the cached tokens we could not find an appropriate solution in time. And have hence not solved this issue and notified the client as gemini and old GPT models were a stretch goal from the begining

> Prompt used - "What is a mathematical fucntion I can use where I can alter the constants to fit around 2 points and the origin which levels out after the second point"

  When conducting research into how best to convert our tokens into carbon emissions for calls which weren't the exact size of our data points.
  This research was not used as we could not ensure how the tokens to emissions curve grew and hence the most defensible method was to only use the data we have.

<h3>Debugging</h3>

Debugging time of each call

> Prompt used this is my code how can I change this to be in 24 hour format 
var lDate:string[] = (new Date(lastAccess).toLocaleString('us-GB', { 
  })).split(",");

  soltion found
  > var lDate:string[] = (new Date(lastAccess).toLocaleString('us-GB', { 
                hour12: false
            })).split(",");
<h3>Review</h3>

<h2>Iman</h2>
<p> I, Iman Hadi declare that this document is accurate to my AI usage throughout the course of SEP</p>
<p>All models used have been  Gemini</p> <br>

<h3>Development</h3>
Research into creating a dashboard and adding features

> Prompt used - "I will be creating a dashboard for a VsCode extension that will include a pie chart and heatmap what resources could I use to build this"

I found it a bit difficult finding clear ways of implementing this as examples when I was initially conducting research were too simple or complex, by doing so research time was also expedited. 

Research into getting more types of green for the pie chart

> Prompt used - " I am creating a pie chart and need to have all the sections as different types of greens how can i do this"

The result was an equation to reduce the opacity of the green for each slice in the pie chart

Needed to quickly implement a feature so I asked AI how to do it to reduce time spent 
> Prompt used - "I need to add a scrollable feature using CSS how can I do this"

Result was being told to add "scrollable-container" to the containers that needed them
<h3>Debugging</h3>

> Prompt used - " I am getting this error (Image was inserted of the error) what does it mean"

The error occured when I would run the webview when I was initially creating it for the dashboard. I was having issues finding a way to alleviate this problem using online resources so I used AI which gave me a reason for this and steps to fix the error.

I used copilot in VsCode
> Prompt used - "/explain Property 'asWebviewUri' does not exist on type 'Webview'."

I was given a series of possible causes as the method asWebviewUri was not available. I was told to fix this i should: 1. check my VSCode API version 2. Update VSCode dependency 3. Verify Object Type




<h3>Review</h3>

<h2>Max Davies</h2>
<p> I, Max Davies, declare that this document is accurate to my AI usage throughout the course of SEP</p>
<p>All models used have been  Gemini</p> <br>
<h3>Development</h3>
The LLM model I have exclusively used is Gemini
<h4>Test Development - trying to optimise test speed using caching</h4>

> Prompt used - "how do I add a caching section to my ci.yml file to make sure that the vscode-test folder isn't recreated every time I run my action? It is large and slows down my CI"

The resulting information told me how to implement the `actions/cache@v4` action and how it should be used within my action file to make the tests run faster. As a result, the code I had written benefitted from the caching, and the tests ran quicker, making the CI more responsive.

<h4>Initial prototyping of RunTime Analysis - Certificates</h4>
During research into the development of custom SSL certificates that allowed me to interact with https API endpoints, I used AI to research and create a prototype structure for the certificate generation and deployment at runtime. This has since been improved upon, and made more secure without the use of AI.

<h3>Debugging</h3>
In cases when I have run into errors, and cannot find information regarding the error online, I will provide an AI with some context of the project, and then the error message. I make sure not to expose the full workings of the project or any sensitive data when pasting the error message.

> Example Prompt Used - "I am writing a security certificate generating script in typescript. I am trying to assign a commonName variable to the signed CA, and I get this error. Please explain why this is caused. The line it refers to is below:
> {line}
> And this is the error message:
> "Object literal may only specify known properties, and 'commonName' does not exist in type '{ subject?: { [key: string]: string | undefined; commonName?: string | undefined; organizationName?: string | undefined; countryName?: string | undefined; } | undefined; bits?: number | undefined; nameConstraints?: { ...; } | undefined; }'"

This helped me to fix this error.

Failed Tests
Gemini 3.1 Pro was used to help me fix a bug within the testing. Code that had not been touched on our dev branch for 4 days and passed the CI when integrated, suddenly did not pass when run again. I used AI to help me understand the reason for this failure, after pinpointing it to a certain command using the debug logs and many `console.log` statements. 

> Prompt used - "Error starting Interceptor Proxy: Error: Worker exited with code 9" is the error code I get testing the activation of a proxy server within an async await statement in typescript. I want to make sure the proxy server activates and do this by utilising a flag that switches to true when the server is running. Within the test file, an await is used alongside a promise to ensure the tests don't hang, and then checks this flag. The promise waits for 500ms. Why is error code 9 appearing in my proxy server? I have checked and the extension activates fully. What does error code 9 mean?

This helped me to identify the problem was in fact with the environment surrounding the code, and not the code itself. The error was fixed by ensuring the proxy server span up using a clean instance of node, and not using any extra environment variables inherited from the main parent process.

 I only use AI as a last resort when common helpful resources such as geeksforgeeks or StackOverflow have no helpful solutions.



<h3>Review</h3>

I used AI to review the release.yml file to ensure that it worked before merging to main. I tested it briefly on a test repo, but it ended up failing on main anyway. To prevent this problem from occuring again when trying to fix it, I copied and pasted the file into gemini 3.1 pro and asked it to make sure the file would run. It said that it was happy for it to run, and so I merged the file.


<h2>Hao Ni</h2>
<p> I, Hao Ni declare that this document is accurate to my AI usage throughout the course of SEP</p>

<p>All models used have been  ChatGPT, Gemini, and Claude</p> <br>
<h3>Development</h3>
reseach into which papers to look into for carbon to emission formula

> Prompt used - " I am reasearching into how to calculate carbon emmissions per token in AI usage, can you find me some relevent papers I can look into"
I was having problem finding relevent papers online, because most of the materials I can find is from personal bloggs and reddit notes which is highly unprofessional and not releveant enough so I use AI to help find relevant papers.

<h3>Debugging</h3>
I use AI when my code can't run but I can't spot where's the problem

> Prompt used - " I am suppose to make the Dash board's color change to black now, why is it not working"
The problem occur when I finish the implementation of the mode toggle but the switch isn't working and I was having problem finding the bug. The reason is I can't put the .js file and the .css file outside Dashboard.ts and should keep all the js and css part inside getwebview.
> "Why there's always a Sunday block on the Heat Map even if it's not Sunday?"
The problem occur because I added a round:week in my code, it can helps round the data to the week, but I set the start of the week as Sunday so it will always show Sunday first.
> Prompt used - " I am planning to change the heat map yellow base color to #ef6c00 what do you think"
The problem occur when I try to make the yellow part of the heat map stands out in the dark mode and not seem muddy visually. 

<h3>Review</h3>

<h2>Morgan Parry</h2>
<p> I, Morgan Parry, declare that this document is accurate to my AI usage throughout the course of SEP</p>

<h3>Development</h3>
<p>All models used have been ChatGPT</p> <br>

> Prompt used - "Give an overview of regexes and how they work, in particular how they can be formatted to exclude lines of text based on a phrase they contain."

> Prompt used - "How can I use a regex to capture text between two characters?"

When conducting research into how I can use a regex to exclude the lines I need from the captured log files in development time analysis, I used ChatGPT to research how I can use them for the specific task I need (excluding lines containing unneeded levels of Copilot logging). I did this after conducting my own research which left me unsure of how to achieve this. I did not copy any regexes directly from ChatGPT's response, but I used them to start playing around with more specific regexes using a [regex sandbox website](https://regexr.com/).

> Prompt used - "How useful would the tiktoken library be for tokenising Gemini outputs? Is there a better option I can use in typescript if they are too dissimilar?"

While adding support for Gemini in DevTime, I was unable to find any clear research into the inner workings of LLM tokenisers. I opted to use ChatGPT to research whether I could use the tiktoken library, which I was already familiar with, to tokenise Gemini outputs. ChatGPT suggested using a rough mathematical calculation to tokenise the outputs. I initially planned on using this but was able to find a better [Gemini tokeniser](https://www.npmjs.com/package/@lenml/tokenizer-gemini) on the npm registry upon further research, so I ended up scrapping the AI solution.

> Prompt used - "Convert the data stored in the model registry to JSON and store it in the models.json file"

I used ChatGPT here to handle the brunt conversion of our original emissions data from the convert.ts model registry to a separate JSON file, as there were over 80 data points to convert. I did not use any logic from the LLM and solely used it to save time in copying the data over myself.

<h3>Debugging</h3>

> Prompt used - "ESLint: 10.0.2 TypeError: util.styleText is not a function at util.styleText.validateStream - what causes this error?"

I had a versioning error with ESLint when attempting to compile the project that I used ChatGPT to debug. No AI code was pasted as the error was simply me needing to upgrade Node.js.


<h3>Review</h3>


