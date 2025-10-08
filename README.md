<h1> Estimating  Carbon in Digital Product</h1>

<h2>Overview:</h2>
There are already tools and plugins that measure the carbon footprint of code builds, infrastructure usage, or web
performance. Some VS Code extensions even estimate the environmental cost of local development. However, none of
them track AI token usage in context, and certainly not in a way that separates:
<ul><li> Tokens sent to LLMs during app runtime inside the IDE (for example, while running and testing code).</li></ul>
<ul><li>Tokens sent to LLMs for development support (the behind-the-scenes calls that power Cursor’s chat and AI-assisted
features).</li></ul> 
This is the gap we want to explore. By focusing on these two AI-specific metrics, we can give developers and teams
visibility over both the carbon and cost of their AI usage, making it possible to make smarter, lower-impact choices earlier

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

