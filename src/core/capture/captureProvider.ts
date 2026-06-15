/****************************************************************
 *                      CAPTUREPROVIDER.TS                      *
 *  INTERFACE FOR LLM PROVIDERS. EACH PROVIDER KNOWS WHICH      *
 *  URLS IT HANDLES AND HOW TO EXTRACT TOKEN COUNTS FROM        *
 *  THE RESPONSE BODY. THE INTERCEPTORADAPTER IS THE SINGLE     *
 *  MECHANISM — PROVIDERS ARE PLUGGED IN TO ADD NEW TOOLS.      *
 ****************************************************************/

export interface TokenResult {
    model: string;
    totalTokens: number;
}

export interface CaptureProvider {
    readonly id: string;
    readonly displayName: string;
    matches(url: string): boolean;
    parseTokens(body: unknown): TokenResult | null;
    parseSSE(events: unknown[]): TokenResult | null;
}
