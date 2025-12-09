import "jsr:@supabase/functions-js/edge-runtime.d.ts"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MarketRequest {
    type: 'crypto' | 'fx' | 'stock';
    symbol: string;
}

interface CorsHeaders {
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Headers': string;
}

interface ErrorResponse {
    error: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { type, symbol }: MarketRequest = await req.json()
        const apiKey: string | undefined = Deno.env.get('TIINGO_API_KEY')
        
        if (!apiKey) throw new Error("Missing TIINGO_API_KEY secret")

        // 2. Route to correct Tiingo Endpoint
        let url: string = '';
        
        if (type === 'crypto') {
            url = `https://api.tiingo.com/tiingo/crypto/top?tickers=${symbol}&token=${apiKey}`;
        } else if (type === 'fx') {
            url = `https://api.tiingo.com/tiingo/fx/top?tickers=${symbol}&token=${apiKey}`;
        } else {
            // Default to Stock (IEX)
            url = `https://api.tiingo.com/iex/?tickers=${symbol}&token=${apiKey}`;
        }

        // 3. Fetch from Tiingo
        const response: Response = await fetch(url, {
            headers: { 'Content-Type': 'application/json' }
        })
        
        if (!response.ok) {
             throw new Error(`Tiingo API Error: ${response.statusText}`)
        }

        const data: unknown = await response.json()

        // 4. Return to Frontend
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Market Proxy Error:", error)
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})