import { supabase } from './supabaseClient';

const API_KEY = import.meta.env.VITE_TIINGO_API_KEY; // Kept for reference or local dev if needed, but Edge Function uses env var.
// Actually, if we use Edge Function, the key stays on server.
// But user might want to toggle mock data.
const USE_MOCK_DATA = false; 

// Normalize user inputs to Tiingo tickers
const SYMBOL_MAP = {
  'BTC': 'btcusd',
  'ETH': 'ethusd',
  'SOL': 'solusd',
  'BINANCE:BTCUSDT': 'btcusd',
  'BINANCE:ETHUSDT': 'ethusd',
  'EUR/USD': 'eurusd',
  'OANDA:EUR_USD': 'eurusd',
  'GBP/USD': 'gbpusd',
  'USD/JPY': 'usdjpy'
};

export const MarketDataService = {
  
  async searchSymbols(query) {
    if (!query) return [];
    const q = query.toLowerCase();
    
    // Quick local matches (Search API is heavy/expensive, keep this local for now)
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

  async getQuotes(symbols) {
    if (!symbols.length) return {};

    if (USE_MOCK_DATA) {
        const mockData = {};
        symbols.forEach(sym => {
            const base = 100 + (sym.length * 10);
            mockData[sym] = { symbol: sym, price: base, changePercent: 0.5 };
        });
        return mockData;
    }

    const quotes = {};
    const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-proxy`;
    
    // We need the anon key for authorization headers if RLS/Function security is on
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    await Promise.all(symbols.map(async (rawSym) => {
        try {
            const sym = SYMBOL_MAP[rawSym] || rawSym.toLowerCase(); 
            
            // Determine type for routing
            let type = 'stock';
            const isCrypto = ['btcusd', 'ethusd', 'solusd'].includes(sym) || sym.includes('binance');
            const isForex = !isCrypto && sym.length === 6 && !['googl', 'nvidia', 'amazon'].includes(sym);
            
            if (isCrypto) type = 'crypto';
            else if (isForex) type = 'fx';

            // Call Supabase Edge Function
            const res = await fetch(FUNCTION_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${anonKey}`
                },
                body: JSON.stringify({ type, symbol: sym })
            });
            
            if (!res.ok) {
                 console.warn(`Proxy Fetch failed for ${sym}: ${res.status}`);
                 return;
            }

            const data = await res.json();
            
            // Parse Tiingo Response (array)
            let price = null;
            if (Array.isArray(data) && data.length > 0) {
                const item = data[0];
                // Different endpoints use different keys for price
                price = item.last || item.lastPrice || item.midPrice || item.tngoLast;
            }

            if (price) {
                quotes[rawSym] = {
                    symbol: rawSym,
                    price: parseFloat(price),
                    changePercent: 0 // Real-time IEX/FX endpoints optimize for speed
                };
            }

        } catch (e) {
            console.warn(`Proxy error for ${rawSym}`, e);
        }
    }));

    return quotes;
  }
};