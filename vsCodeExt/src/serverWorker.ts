/**************************************************************************
 *                            SERVERWORKER.TS                             *
 *    A SERVER WORKER PROCESS THAT USES THE MOCKTTP LIBRARY TO CREATE     *
 *     A LOCAL PROXY SERVER THAT CAN INTERCEPT AND LOG HTTP REQUESTS      *
 *     AND RESPONSES, LOOKING FOR POTENTIAL AUTHORISATION TOKENS AND      *
 *     EXTRACTING TOKEN AND MODEL DATA FROM AI PROVIDER RESPONSES TO      *
 *     CALCULATE EMISSIONS. COMMUNICATES WITH PARENT PROCESS VIA IPC      *
 *       MESSAGES TO RECEIVE COMMANDS AND SEND LOGS AND DATA BACK.        *
 * DESIGNED TO BE FORKED AS A CHILD PROCESS FROM THE MAIN EXTENSION CODE. *
 **************************************************************************/

import * as mockttp from 'mockttp';
import * as fs from 'fs';
import * as path from 'path';
import { RawBodyIncludesMatcher } from 'mockttp/dist/rules/matchers';
import * as convert from './convert';

// server instance to be controlled
let server: mockttp.Mockttp | null = null;

// Listen for messages from parent process and boots up / stops proxy server as told
process.on('message', async (msg: any) => {
    if (msg.command === 'start') {
        await startServer(msg.port, msg.storagePath);
    } else if (msg.command === 'stop') {
        if (server) { await server.stop(); };
        process.exit(0);
    }
});


// startes the proxy server on the given port and with given certificate storage paths
// returns a promise that resolves when the server is running and rejects if there is an error starting up
async function startServer(port: number, storagePath: string) {
    try {
        if (!fs.existsSync(storagePath)) { fs.mkdirSync(storagePath, { recursive: true }); };

        const certPath = path.join(storagePath, "local-ca.pem");
        const keyPath = path.join(storagePath, "local-ca.key");

        let httpsConfig;
        if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
            // loads existing certificates and keys from storage path if they exist
            httpsConfig = {
                key: fs.readFileSync(keyPath, "utf-8"),
                cert: fs.readFileSync(certPath, "utf-8"),
            };
        } else {
            // generate new certificates and keys
            const generated = await mockttp.generateCACertificate({
                subject: {
                    commonName: "Ecode Proxy CA"
                },
                bits: 2048,
            }); 
            // save cerificates to disk
            fs.writeFileSync(keyPath, generated.key);
            fs.writeFileSync(certPath, generated.cert);

            httpsConfig = {
                key: generated.key,
                cert: generated.cert,
            };
        }

        // use mockttp to create a local proxy server with the certificates
        // logs requests and responses
        server = mockttp.getLocal({ https: httpsConfig, debug: true });
        await server.enableDebug();

        // Intercepts everything, logs, checks for tokens, passes through
        await server.forAnyRequest().thenPassThrough({
            ignoreHostHttpsErrors: true,
            beforeRequest: async (req) => {
                const body = await req.body.getText() || '';

                // log if request message
                sendLog(`[REQUEST] ${req.method} ${req.url}`);

                // check tokens
                detectTokens(req.headers, body);

                // checking prompts to see if image is being asked to be generated
                // if (body.includes('"quality":') && body.includes('"size":') && body.includes('"n":') && body.includes('"model":')) {

                if (body) { sendLog(`Body: ${body.substring(0, 200)}...`); };
                sendLog('------------------------------------------------');
            },
            // for incoming requests, log response and check tokens
            beforeResponse: async (res) => {
                const status = res.statusCode;

                try {
                    const body = await res.body.getText() || "";
                    const preview = RawBodyIncludesMatcher.length > 2000
                        ? body.substring(0, 2000) + "... (Shortened to 2000 chars)"
                        : body;
                    
                        // parse response body and extract token data
                    getJsonTokenCount(body);

                    sendLog(` << status: ${status}`);
                    sendLog(` << body: ${preview}`);
                } catch (error) {
                    sendLog(` << status: ${status}`);
                    sendLog(` << body could not interpreted as text?!?!?`);
                }
                sendLog('='.repeat(40));
            }
        });

        // start listening on port
        await server.start(port);

        // notify parent that worker has started and certificate location
        if (process.send) { process.send({ type: 'started', certPath }); };

    } catch (error: any) {
        if (process.send) { process.send({ type: 'error', message: error.toString() }); };
    }
}

// sends log messages to parent process
function sendLog(message: string) {
    if (process.send) { process.send({ type: 'log', message }); };
}

// scans http headers and json bodies for potential authorisation tokens
function detectTokens(headers: mockttp.Headers, body: string) {
    const TOKEN_KEYS = ['authorization', 'x-api-key', 'api-key', 'token', 'access_token'];

    // see if headers contain apikey. if so then must be ai call
    Object.keys(headers).forEach(key => {
        if (TOKEN_KEYS.includes(key.toLowerCase())) {
            sendLog(`TOKENS DETECTED`);
        }
    });

    // check body of json message
    if (body && (body.startsWith('{') || body.startsWith('['))) {
        try {
            scanJsonForTokens(JSON.parse(body));
        } catch (e) { /* ignore non-json */ }
    }
}

function scanJsonForTokens(obj: any) {
    //regex patterns for token keys
    const TOKEN_MATCHERS = [/token/i, /key/i, /auth/i, /secret/i];
    if (!obj || typeof obj !== 'object') { return; };

    Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (TOKEN_MATCHERS.some(m => m.test(key)) && typeof value === 'string' && value.length > 8) {
            sendLog(`TOKEN DETECTED`);
        }
        if (typeof value === 'object') { scanJsonForTokens(value); };
    });
}

// parses the response from AI providers
// extracts model, token data and calculates emissions
// logs these results and sends to be recorded as a call
function getJsonTokenCount(body: string) {
    const jsonBody = JSON.parse(body);
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;
    let modelName = "Unknown Model";
    let imageSize = "No size";
    let imageNumber = 0;
    let imageQuality = "No Quality";

    // OpenAI and claude use this format in response
    if (
        (jsonBody.usage && jsonBody.model) //|| // basic text
    ) {
        // for future support, takes input and output differently
        inputTokens = jsonBody.usage.input_tokens??jsonBody.usage.prompt_tokens??0;
        outputTokens = jsonBody.usage.output_tokens??jsonBody.usage.completion_tokens??0;
        totalTokens = inputTokens + outputTokens;
        console.log(`input tokens: ${inputTokens}, output tokens: ${outputTokens}, total tokens: ${jsonBody.usage.total_tokens}`);
        modelName = jsonBody.model;
        console.log(`model name: ${modelName}`);
    }
    // For image generations - to be used for image tracking
    else if (jsonBody.quality && jsonBody.size) {
        modelName = jsonBody.model;
        imageSize = jsonBody.size;
        imageNumber = jsonBody.n;
        imageQuality = jsonBody.quality;
        totalTokens = jsonBody.usage.total_tokens; // note images might not return this field!
        if (imageSize !== "No size" && totalTokens === 0 && modelName !== "Unknown Model" && imageQuality !== "No Quality" && imageNumber !== 0) {
            sendLog("Image detected!");
            sendLog(`Model: ${modelName}`);
            sendLog(`Size: ${imageSize}`);
            sendLog(`Quality: ${imageQuality}`);
            sendLog(`Quantity: ${imageNumber}`);
        }

    }
    // gemini responses have a different format, with usageMetadata and modelVersion fields
    else if (jsonBody.usageMetadata) {
        totalTokens = jsonBody.usageMetadata.totalTokenCount;
        // gemini gives model version directly
        if (jsonBody.modelVersion) {
            modelName = jsonBody.modelVersion;
        } else {
            modelName = "Unknown Gemini Model";
        }
    } else {
        return "UNKNOWN AI USED";
    }
    // calculate emissions
    const emission = convert.calculateEmission(modelName, totalTokens);

    // log final metrics to parent process
    let dateTime = new Date();
    sendLog(`   >> DateTime: ${dateTime.toLocaleString()}`);
    sendLog(`   >> Model: ${modelName}`);
    sendLog(`   >> Tokens: ${totalTokens}`);
    sendLog(`   >> Emissions: ${emission.toFixed(8)}`);
    return { "Tokens": totalTokens, "Model": modelName };
}
