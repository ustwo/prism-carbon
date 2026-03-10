<h1>Parsing log files</h1>

<h2>Model</h2>
Regex command for accessing the model used for the call 
<br><br>  
<code>(?<=chat request received from extension host(((\s|\S))*)\[debug\] chat model )(.*(\..*))</code> 


<h2>Anthropic Tokens</h2>
Regex command for accessing the tokens used by an anthropic model: 
<br><br>
<code>(?<="stop_reason":"end_turn"(.*):{"cache_creation_input_tokens":)(\d+)|((?<=stop_reason":"*):{"cache_creation_input_tokens":(.*),"cache_read_input_tokens":)(\d+))|(?<=stop_reason":"end_turn"(.*):{"cache_creation_input_tokens":(.*),"cache_read_input_tokens":(.*),"input_tokens":)(\d+)|(?<=stop_reason":"end_turn"(.*):{"cache_creation_input_tokens":(.*),"cache_read_input_tokens":(.*),"input_tokens":(.*),"output_tokens":)(\d+)
</code>

<h2>OpenAI Tokens</h2>

<h2>Gemini Tokens<h2>