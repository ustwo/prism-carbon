import * as mockttp from 'mockttp';
import * as fs from 'fs';
import * as path from 'path';
import { RawBodyIncludesMatcher } from 'mockttp/dist/rules/matchers';
import * as convert from './convert';

// Clean Environment: Ensure this process ignores the VS Code proxy settings
// process.env.HTTP_PROXY = '';
// process.env.HTTPS_PROXY = '';
// process.env.NO_PROXY = '*';
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let server: mockttp.Mockttp | null = null;



process.on('message', async (msg: any) => {
    if (msg.command === 'start') {
        await startServer(msg.port, msg.storagePath);
    } else if (msg.command === 'stop') {
        if (server) { await server.stop(); };
        process.exit(0);
    }
});

async function startServer(port: number, storagePath: string) {
    try {
        if (!fs.existsSync(storagePath)) { fs.mkdirSync(storagePath, { recursive: true }); };

        // generate certificate of authorisation
        // const https = await mockttp.generateCACertificate();
        const certPath = path.join(storagePath, "local-ca.pem");
        const keyPath = path.join(storagePath, "local-ca.key");

        let httpsConfig;

        if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
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

            fs.writeFileSync(keyPath, generated.key);
            fs.writeFileSync(certPath, generated.cert);

            httpsConfig = {
                key: generated.key,
                cert: generated.cert,
            };
        }
        // fs.writeFileSync(certPath, https.cert);

        server = mockttp.getLocal({ https: httpsConfig, debug: true });
        await server.enableDebug();

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

                //     sendLog(`parsed data:   ${JSON.parse(body)}`)
                // }

                if (body) { sendLog(`Body: ${body.substring(0, 200)}...`); };
                sendLog('------------------------------------------------');
            },
            beforeResponse: async (res) => {
                const status = res.statusCode;

                try {
                    const body = await res.body.getText() || "";
                    const preview = RawBodyIncludesMatcher.length > 2000
                        ? body.substring(0, 2000) + "... (Shortened to 2000 chars)"
                        : body;
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

        await server.start(port);

        // notify parent that worker has started and certificate location
        if (process.send) { process.send({ type: 'started', certPath }); };

    } catch (error: any) {
        if (process.send) { process.send({ type: 'error', message: error.toString() }); };
    }
}

function sendLog(message: string) {
    if (process.send) { process.send({ type: 'log', message }); };
}

// token detection
function detectTokens(headers: mockttp.Headers, body: string) {
    const TOKEN_KEYS = ['authorization', 'x-api-key', 'api-key', 'token', 'access_token'];

    // see if headers contain apikey. if so then must be ai call
    Object.keys(headers).forEach(key => {
        if (TOKEN_KEYS.includes(key.toLowerCase())) {
            sendLog(`🔥🔥 TOKENS DETECTED `);
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
    const TOKEN_MATCHERS = [/token/i, /key/i, /auth/i, /secret/i];
    if (!obj || typeof obj !== 'object') { return; };

    Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (TOKEN_MATCHERS.some(m => m.test(key)) && typeof value === 'string' && value.length > 8) {
            sendLog(`🔥🔥 TOKEN DETECTED `);
        }
        if (typeof value === 'object') { scanJsonForTokens(value); };
    });
}

interface ModelData {
    inputTokens: number,
    ouputTokens: number,
    totalTokens: number,
    modelName: string
};

function getJsonTokenCount(body: string) {
    const jsonBody = JSON.parse(body);
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;
    let modelName = "Unknown Model";
    let imageSize = "No size";
    let imageNumber = 0;
    let imageQuality = "No Quality";
    let imageCost = 0

    // OpenAI and claude use this format in response
    if (
        (jsonBody.usage && jsonBody.model) //|| // basic text
        // (jsonBody.usage && jsonBody.quality && jsonBody.size && jsonBody.output_format) // image models
    ) {
        inputTokens = jsonBody.usage.input_tokens;
        outputTokens = jsonBody.usage.output_tokens;
        // totalTokens = jsonBody.usage.total_tokens;
        totalTokens = inputTokens + outputTokens;
        console.log(`input tokens: ${inputTokens}, output tokens: ${outputTokens}, total tokens: ${jsonBody.usage.total_tokens}`);
        modelName = jsonBody.model;
        console.log(`model name: ${modelName}`);
    }
    // Gemini uses this format in response
    else if (jsonBody.quality && jsonBody.size) {
        modelName = jsonBody.model;
        imageSize = jsonBody.size;
        imageNumber = jsonBody.n;
        imageQuality = jsonBody.quality;
        totalTokens = jsonBody.usage.total_tokens;
        if (imageSize != "No size" && totalTokens == 0 && modelName != "Unknown Model" && imageQuality != "No Quality" && imageNumber != 0) {
            sendLog("Image detected!");
            sendLog(`Model: ${modelName}`);
            sendLog(`Size: ${imageSize}`);
            sendLog(`Quality: ${imageQuality}`);
            sendLog(`Quantity: ${imageNumber}`);
        }

    }
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
    // const emission = calculateEmission(modelName, totalTokens);
    const emission = convert.calculateEmission(modelName, totalTokens);

    let dateTime = new Date();
    // sendLog(`{ID: ${dateTime}, Model: ${modelName}, Emissions: ${emission.toFixed(8)} gCO2e}🔥`)
    sendLog(`   >> DateTime: ${dateTime.toLocaleString()}`);
    sendLog(`   >> Model: ${modelName}`);
    sendLog(`   >> Tokens: ${totalTokens}`);
    sendLog(`   >> Emissions: ${emission.toFixed(8)}`);
    return { "Tokens": totalTokens, "Model": modelName };
}


// convert tokens to carbon
// function calculateEmission(model: string, token: number) {
//     const chatgpt4oshort = 0.000000370125;
//     const chatgpt4omedium = 0.000000212625;
//     const chatgpt4olong = 0.0000000875;
//     const chatgpt4ominishort = 0.000504875;
//     const chatgpt4ominimedium = 0.000331975;
//     const chatgpt4ominilong = 0.000094286;
//     const chatgpt4point5 = 0.0003;

//     let carbon = 0;
//     const lowerModel = model.toLowerCase();

//     if (lowerModel.includes("gpt-4o-mini")) {
//         if (token <= 400) {
//             carbon = chatgpt4ominishort * token;
//         } else if (token <= 2000) {
//             carbon = chatgpt4ominimedium * token;
//         } else if (token <= 11500) {
//             carbon = chatgpt4ominilong * token;
//         }
//     } else if (lowerModel.includes("gpt-4o")) {
//         if (token <= 400) {
//             carbon = chatgpt4oshort * token;
//         } else if (token <= 2000) {
//             carbon = chatgpt4omedium * token;
//         } else if (token <= 11500) {
//             carbon = chatgpt4olong * token;
//         }
//     } else if (lowerModel.includes("gpt-4.5")) {
//         carbon = chatgpt4point5 * token;
//     }
//     return carbon;
// }
