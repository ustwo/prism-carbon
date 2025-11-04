<h1> Estimating  Carbon in Digital Product</h1>

<h2>Contents:</h2>

to be implemented in the future!!!

<h2>Overview:</h2>
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

![C4 Level 1 Diagram](https://github.com/spe-uob/2025-EstimatingCarbon/blob/ReadMe-Edits/Images/Level1%20C4.png?raw=true)

<h2>Building a Carbon-Aware Dev toolkit:</h2>

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
  <h2> Stakeholders </h2>
  <h3> Developer </h3>
  <li><b> Who They Are: </b> Software engineers who write, test, and debug code on a daily basis, often using AI-assisted tools </li>
  <li> <b>Their Improvements: </b> They are the primary end-users. The toolkit provides them with real-time data within their IDE, allowing them to see the environmental impact of their code and make more carbon-efficient development choices</li>
  <h3> Project Managers</h3>
  <li><b>Who They Are:</b> Individuals who oversee project planning, resource allocation and reporting</li>
  <li><b>Their Involvement:</b> The toolkit allwos them to assess a projects overall environmental impact. They can use this data to identify carbon-heavy implementation, guide redesigns, and report on sustainability metrics</li>

<h3>AI Engineers</h3>
  <li><b>Who They Are: Specialists who design, build and optimise artificial intelligence models </b></li>
    <li><b>Their Involvement:</b> The toolkit helps them discover inefficiencies in their models by highlighting API calls with a disproportionately large carbon cost, enabling targeted optimistation</li>

 


  <h2> User Stories: </h2>
  <ul>
    <li>As a developer, I want to know what impact my code has on the envrionment so I can make better and more carbon efficient development choices.</li>
    <li>As a Project Manager, I want to know how impactful my project is, and which areas of a coded solution are the most environmentally costly so I can identify less carbon heavy implementations, and utilise this to re-design prototypes</li>
    <li>As an engineer at an Artifical Intelligence company, I can easily see and discover any massive inefficiencies in my AI model due to an overtly large relative carbon cost.</li>
  </ul>

  <h2>Client Names</h2>
  <ul>
    <li>Paolo Rizzi</li>
    <li>Nayan Jain</li>
  </ul>
  
  <h2> Team Members </h2>
  <ul>
   <li> Hao Ni (wx24939) </li>
    <li>Iman Hadi (jp24368) </li>
    <li>Jacob Connor (gn24034)</li>
   <li>  Max Davies (cg24012)</li>
  </ul>
  <h2> Supporting Mentor</h2>
  <ul> 
    <li>Murray Groves (ij22909)</li>
  </ul>
</ul>

