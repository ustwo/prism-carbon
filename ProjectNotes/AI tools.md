<h1>AI </h1>
<p>We declare that any and all AI usage within the project has been recorded and noted below. This includes (but is not limited to) usage of text generation methods incl. LLMs, text summarisation methods, or image generation methods. We understand that failing to divulge use of AI within our work counts as contract cheating and can result in a zero mark for SEP.</p>

<h2>Project AI</h2>
We used AI throughout the project to test our extension's token tracking ability (copilot and cursor). This consisted of using AI autocomplete in dummy code files to track tokens produced during these generations, and using basic python and java scripts that act as a basic AI interface and make API calls to varying AI models. None of the generations used in this testing were implemented within our codebase, but the metadata results from these tests (output logs and json formats) were used to refine our approach and help our data parsing.

<h2>Jacob Connor</h2>
<p>I, Jacob Connor declare that this document is accurate to my AI usage throughout the course of SEP.</p>

<h3>Development</h3>
Research into testing Development time 

> Prompt used - "How can I programatically invoke the copilot chat within vscode in order to test how my extension responds?"
  
 When conducting research into how to use and test the extensions response to copliot chat I found out that copilot does not allow for this. So I have since decided to research into testing options (without AI)


<h3>Debugging</h3>

<h3>Review</h3>

<h2>Iman</h2>
<p> I, Iman Hadi declare that this document is accurate to my AI usage throughout the course of SEP</p>

<h3>Development</h3>
Research into creating a dashboard and adding features

> Prompt used - "I will be creating a dashboard for a VsCode extension that will include a pie chart and heatmap what resources could I use to build this"
I found it a bit difficult finding clear ways of implementing this as examples when I was initially conducting research were too simple or complex, by doing so research time was also expedited. 

<h3>Debugging</h3>

> Prompt used - " I am getting this error (Image was inserted of the error) what does it mean"
The error occured when I would run the webview when I was initially creating it for the dashboard. I was having issues finding a way to alleviate this problem using online resources so I used AI which gave me a reason for this and steps to fix the error.

<h3>Review</h3>

<h2>Max Davies</h2>
<p> I, Max Davies, declare that this document is accurate to my AI usage throughout the course of SEP</p>
<h3>Development</h3>
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

This helped me to fix this error. I only use AI as a last resort when common helpful resources such as geeksforgeeks or StackOverflow have no helpful solutions.

<h3>Review</h3>
I don't use AI to review my code, I have only used it for small excerpts, prototyping and error analysis.

<h2>Hao Ni</h2>
<p> I, Hao Ni declare that this document is accurate to my AI usage throughout the course of SEP</p>

<h3>Development</h3>
reseach into which papers to look into for carbon to emission formula

> Prompt used - " I am reasearching into how to calculate carbon emmissions per token in AI usage, can you find me some relevent papers I can look into"
I was having problem finding relevent papers online, because most of the materials I can find is from personal bloggs and reddit notes which is highly unprofessional and not releveant enough so I use AI to help find relevant papers.

<h3>Debugging</h3>
I use AI when my code can't run but I can't spot where's the problem

> Prompt used - " I am suppose to the Dash board's color change to black now, why is it not working"
The problem occur when I finish the implementation of the mode toggle but the switch isn't working and I was having problem finding the bug. The reason is I can't put the .js file and the .css file outside Dashboard.ts and should keep all the js and css part inside getwebview.

<h3>Review</h3>

<h2>Morgan Parry</h2>

<h3>Development</h3>

<h3>Debugging</h3>

<h3>Review</h3>


after this point will be deleted so delete when you use it


<h2>AI Generated code<h2>



Find code here:



How this code works:


<h2>Why AI was used:</h2>

These are small scripts that are hard to remember all of the details for. AI is helpful for ensuring that the scripts are correct.
<h3>Research with AI</h3>
<ul>
<li>1. We use AI to find the papers that got the data we need in them, but we read the papers and gets the data manually so that AI won't be making up data</li>
<li>2. AI was used to research about the auto complete tokens </li>
<li>3. AI was used to understand how to implement a graph in the panel section of vscode.</li>
<li>4. We used AI when deciding how to approach tracking tokens during dev time as we found the published documentation to be quite reserved</li>
  <li> Used AI to help me break down the steps to creating the dashboard. Broke it down, which makes it easier to delegate tasks and track progress  Prompt: 'I will be creating a dashboard for a VsCode extension that will include a pie chart and heatmap what are the steps and resources I could use to build this'</li>
</ul>
<h3>Debugging with AI</h3>
<ul>
<li> When finishing parts of out code AI was used to debug as our whole implementation is seperated into different parts, so we can't connect and test if everything is running fine, so we always use AI to debug first.</li>
<li> When encountering error messages chatGPT was used to quickly explain the solution in a more clear manner and give possible solutions. I used this when my graph panel implementation had an error ' view Extension 'undefined_publisher.vsCodeExt' not found' to find a solution to this quickly </li>
  <li> Used Ai to help figure out why my webview was not running, gave me steps on what needed to be refreshed and how I needed to change my code so that it would work.  Prompt: i am getting this error ( image was inserted of the error), what does it mean? </li>
</ul>

<h3>Other AI uses</h3>



