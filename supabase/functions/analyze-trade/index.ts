import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// FIX: Tell TypeScript that Deno exists
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- AGENT PERSONAS (FULL ROSTER) ---
const AGENTS = {
  supervisor: `You are the Trading Supervisor, the central coordinator. 
  - Manage risk (ensure signals respect 2% risk).
  - Synthesize insights from all other agents.
  - Ensure the final report is cohesive and actionable.`,

  analyst: `You are The Analyst (SWOT). 
  - Scan the last 50 trades for patterns.
  - Identify Strengths (>65% win rate) and Weaknesses (<40% win rate).
  - Highlight Opportunities (new markets) and Threats (bad habits).`,

  technician: `You are The Technician. 
  - Focus on Price Action, Support/Resistance, and Volume. 
  - Identify specific setups (Breakout, Reversal) for the Watchlist items using LIVE MARKET DATA.`,

  quant: `You are The Quant.
  - Provide a Market Outlook (Bullish/Bearish) based on data.
  - Estimate probabilities for specific setups.
  - Calculate model accuracy based on past trade performance.`,

  psychologist: `You are The Psychologist.
  - Monitor behavioral patterns (e.g., "Revenge Trading", "FOMO").
  - Assign a Maturity Level (Novice -> Master) based on trade count and discipline.
  - Identify specific "Learned Behaviors" (e.g., "You tend to overtrade after a loss").`
};

// --- HELPER: Fetch Live Data ---
async function fetchLiveMarketData(watchlistString: string, apiKey: string) {
  if (!watchlistString || !apiKey) return "No live market data available.";

  // Limit to top 5 to save execution time/tokens
  const symbols = watchlistString.split(',').map(s => s.trim()).filter(s => s.length > 0).slice(0, 5); 
  
  console.log(`Fetching live data for: ${symbols.join(', ')}`);

  const promises = symbols.map(async (sym) => {
    try {
      let querySymbol = sym;
      // Finnhub format handling
      if (!sym.includes(':')) querySymbol = sym.replace('/', '').replace('-', '');

      const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${querySymbol}&token=${apiKey}`);
      
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data.c) {
        return `${sym}: Price $${data.c} (${data.dp > 0 ? '+' : ''}${data.dp}%) | Volatility Range: $${data.l} - $${data.h}`;
      }
    } catch (e) {
      console.error(`Failed to fetch ${sym}:`, e);
    }
    return null;
  });

  const results = await Promise.all(promises);
  return results.filter(Boolean).join('\n');
}

// --- TYPES ---
interface TradeData {
    [key: string]: any;
}

interface GeminiModel {
    name: string;
    supportedGenerationMethods: string[];
}

interface GeminiModelsResponse {
    models: GeminiModel[];
}

interface RequestBody {
    action: string;
    model?: string;
    trades?: TradeData[];
    watchlist?: string;
}

// --- HANDLER ---
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action, model, trades, watchlist }: RequestBody = await req.json()
        const aiKey: string | undefined = Deno.env.get('GEMINI_API_KEY')
        const finnKey: string | undefined = Deno.env.get('FINN_API_KEY')
        
        if (!aiKey) throw new Error("Missing GEMINI_API_KEY secret")

        // --- ACTION: LIST MODELS ---
        if (action === 'list_models') {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${aiKey}`,
                { method: 'GET' }
            )
            const data: GeminiModelsResponse = await response.json()
            const models: string[] = (data.models || [])
                .filter((m: GeminiModel) => m.supportedGenerationMethods.includes("generateContent"))
                .map((m: GeminiModel) => m.name.replace('models/', ''))
            return new Response(JSON.stringify({ models }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // --- ACTION: ANALYZE (Default) ---
        
        // 1. Fetch Real-Time Data
        let liveMarketContext: string = "Market Data Unavailable (Check API Key)";
        if (finnKey && watchlist) {
                liveMarketContext = await fetchLiveMarketData(watchlist, finnKey);
        }

        // Default to Flash for speed/cost if not specified
        const selectedModel: string = model || 'gemini-1.5-flash';

        const systemPrompt: string = `
        You are TradeMind, a real-time AI Trading System running a multi-agent analysis session.
        
        --- AGENT ROLES ---
        ${Object.entries(AGENTS).map(([role, desc]) => `${role.toUpperCase()}: ${desc}`).join('\n')}

        --- TASK ---
        Analyze the TRADES history and the LIVE MARKET DATA for the watchlist.
        Act as ALL FIVE agents working together to produce a comprehensive report.
        
        Generate a SINGLE JSON object matching this exact schema:
        {
            "swot": { 
                "strengths": ["string"], 
                "weaknesses": ["string"], 
                "opportunities": ["string"], 
                "threats": ["string"] 
            },
            "technical_analysis": { 
                "effective_indicators": [{ "name": "string", "success_rate": number, "description": "string" }], 
                "successful_patterns": [{ "name": "string", "trades": number, "win_rate": number, "insight": "string" }],
                "timeframe_performance": [{ "timeframe": "string", "win_rate": number }]
            },
            "signals": [{ 
                "symbol": "string", 
                "type": "LONG/SHORT", 
                "entry_price": number, 
                "stop_loss": number, 
                "take_profit": number, 
                "confidence": number, 
                "technical_setup": "string", 
                "rationale": "string" 
            }],
            "predictions": { 
                "market_outlook": "string", 
                "market_sentiment": "Bullish/Bearish/Neutral", 
                "model_accuracy": number, 
                "opportunities": [{ "symbol": "string", "setup_type": "string", "probability": number }] 
            },
            "learning": { 
                "maturity_level": "Novice/Apprentice/Journeyman/Expert/Master", 
                "trades_analyzed": number,
                "learned_patterns": [{ "aspect": "string", "insight": "string", "confidence": number }],
                "next_goals": ["string"]
            }
        }
        
        IMPORTANT: Output ONLY valid JSON.
        `

        const userContent: string = `
        --- HISTORICAL DATA ---
        TRADES (Last 50): ${JSON.stringify(trades).slice(0, 15000)}
        
        --- LIVE MARKET DATA (RIGHT NOW) ---
        ${liveMarketContext}
        
        --- WATCHLIST SYMBOLS ---
        ${watchlist}
        `

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${aiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: systemPrompt + "\n\nDATA:\n" + userContent }]
                    }],
                    generationConfig: {
                        response_mime_type: selectedModel.includes('1.5') ? "application/json" : "text/plain"
                    }
                }),
            }
        )

        const data = await response.json()

        if (data.error) {
            console.error("Gemini API Error:", JSON.stringify(data.error))
            throw new Error(data.error.message || "Gemini API Error")
        }

        const textResponse: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!textResponse) throw new Error("No content returned from Gemini")

        const cleanJson: string = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const content = JSON.parse(cleanJson)
            return new Response(JSON.stringify(content), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError)
            throw new Error("AI returned invalid JSON")
        }

    } catch (error) {
        console.error("Edge Function Error:", error)
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})