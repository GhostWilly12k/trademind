/**
 * Market Data Service (Tiingo Implementation with Proxy)
 * * FIXES:
 * 1. CORS: Uses '/api-tiingo' proxy instead of direct URL.
 * 2. Forex: Routes 'eurusd' to /fx/ endpoint.
 * 3. Crypto: Routes 'btcusd' to /crypto/ endpoint.
 */

const API_KEY = import.meta.env.VITE_TIINGO_API_KEY;
const USE_MOCK_DATA = !API_KEY; 

// Normalize user inputs to Tiingo tickers
const SYMBOL_MAP = {
  // Crypto
  'BTC': 'btcusd',
  'ETH': 'ethusd',
  'SOL': 'solusd',
  'BINANCE:BTCUSDT': 'btcusd',
  'BINANCE:ETHUSDT': 'ethusd',
  
  // Forex
  'EUR/USD': 'eurusd',
  'OANDA:EUR_USD': 'eurusd',
  'GBP/USD': 'gbpusd',
  'USD/JPY': 'usdjpy'
};

export const MarketDataService = {
  
  /**
   * 1. Search (Local filtered list + basic pass-through)
   */
  async searchSymbols(query) {
    if (!query) return [];
    const q = query.toLowerCase();
    
    // Quick local matches for instant feedback
    const common = [
      { symbol: 'btcusd', name: 'Bitcoin', type: 'Crypto' },
      { symbol: 'ethusd', name: 'Ethereum', type: 'Crypto' },
      { symbol: 'solusd', name: 'Solana', type: 'Crypto' },
      { symbol: 'eurusd', name: 'EUR/USD', type: 'Forex' },
      { symbol: 'gbpusd', name: 'GBP/USD', type: 'Forex' },
      { symbol: 'usdjpy', name: 'USD/JPY', type: 'Forex' },
      { symbol: 'SPY', name: 'S&P 500 ETF', type: 'Stock' },
      { symbol: 'QQQ', name: 'Nasdaq 100', type: 'Stock' },
      { symbol: 'NVDA', name: 'NVIDIA', type: 'Stock' },
      { symbol: 'TSLA', name: 'Tesla', type: 'Stock' },
      { symbol: 'AAPL', name: 'Apple', type: 'Stock' },
    ];
    
    return common.filter(c => 
      c.symbol.includes(q) || c.name.toLowerCase().includes(q)
    );
  },

  /**
   * 2. Get Quotes (The Engine)
   */
  async getQuotes(symbols) {
    if (!symbols.length) return {};

    // --- MOCK MODE ---
    if (USE_MOCK_DATA) {
        // console.warn("Using Mock Data (No API Key)");
        const mockData = {};
        symbols.forEach(sym => {
            const base = 100 + (sym.length * 10);
            mockData[sym] = { symbol: sym, price: base, changePercent: 0.5 };
        });
        return mockData;
    }

    // --- REAL DATA (VIA PROXY) ---
    const quotes = {};

    await Promise.all(symbols.map(async (rawSym) => {
        try {
            const sym = SYMBOL_MAP[rawSym] || rawSym.toLowerCase(); 
            let endpoint = '';
            
            // --- ROUTING LOGIC ---
            
            // 1. Crypto: Explicit list or common crypto tickers
            const isCrypto = ['btcusd', 'ethusd', 'solusd'].includes(sym) || sym.includes('binance');
            
            // 2. Forex: 6 characters, not a known stock like 'google' or 'nvidia'
            // (Simple heuristic: most 6-letter tickers users type here are forex)
            const isForex = !isCrypto && sym.length === 6 && !['googl', 'nvidia', 'amazon'].includes(sym);

            if (isCrypto) {
                // Endpoint: Crypto Top-of-Book
                endpoint = `/api-tiingo/tiingo/crypto/top?tickers=${sym}&token=${API_KEY}`;
            } else if (isForex) {
                // Endpoint: Forex Top-of-Book
                endpoint = `/api-tiingo/tiingo/fx/top?tickers=${sym}&token=${API_KEY}`;
            } else {
                // Endpoint: IEX (Stocks)
                endpoint = `/api-tiingo/iex/?tickers=${sym}&token=${API_KEY}`;
            }

            // --- FETCH ---
            const res = await fetch(endpoint, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!res.ok) {
                 // console.warn(`Fetch failed for ${sym}: ${res.status}`);
                 return;
            }

            const data = await res.json();
            
            // --- PARSE ---
            let price = null;
            
            // Tiingo returns arrays for all these endpoints
            if (Array.isArray(data) && data.length > 0) {
                const item = data[0];
                // Different endpoints use different keys for price
                price = item.last || item.lastPrice || item.midPrice || item.tngoLast;
            }

            if (price) {
                quotes[rawSym] = {
                    symbol: rawSym,
                    price: parseFloat(price),
                    changePercent: 0 // Real-time IEX/FX endpoints optimize for speed, not 24h stats
                };
            }

        } catch (e) {
            console.warn(`Tiingo error for ${rawSym}`, e);
        }
    }));

    return quotes;
  }
};