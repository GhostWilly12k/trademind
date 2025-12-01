/**
 * Market Data Service
 * Handles fetching live price data and searching symbols.
 */

// 1. Get your free key from https://finnhub.io/
const API_KEY = import.meta.env.VITE_FINN_API; 

// 2. Toggle this to FALSE to use Real Data
const USE_MOCK_DATA = false;

const generateNextCandle = (prevClose, volatility = 0.02) => {
  const change = (Math.random() - 0.5) * (prevClose * volatility);
  const close = prevClose + change;
  const open = prevClose;
  const high = Math.max(open, close) + (Math.random() * (prevClose * 0.005));
  const low = Math.min(open, close) - (Math.random() * (prevClose * 0.005));
  return { open, high, low, close };
};

export const MarketDataService = {
  /**
   * Search for symbols using Finnhub or Mock Data
   * @param {string} query 
   */
  async searchSymbols(query) {
    if (!query || query.length < 1) return [];

    // --- MOCK SEARCH ---
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate lag
      const mockDb = [
        { symbol: 'AAPL', description: 'APPLE INC', type: 'Common Stock' },
        { symbol: 'MSFT', description: 'MICROSOFT CORP', type: 'Common Stock' },
        { symbol: 'TSLA', description: 'TESLA INC', type: 'Common Stock' },
        { symbol: 'NVDA', description: 'NVIDIA CORP', type: 'Common Stock' },
        { symbol: 'AMZN', description: 'AMAZON.COM INC', type: 'Common Stock' },
        { symbol: 'GOOGL', description: 'ALPHABET INC-CL A', type: 'Common Stock' },
        { symbol: 'BTC-USD', description: 'BITCOIN/USD', type: 'Crypto' },
        { symbol: 'ETH-USD', description: 'ETHEREUM/USD', type: 'Crypto' },
        { symbol: 'SOL-USD', description: 'SOLANA/USD', type: 'Crypto' },
        { symbol: 'EURUSD', description: 'EUR/USD', type: 'Forex' },
        { symbol: 'GBPUSD', description: 'GBP/USD', type: 'Forex' },
        { symbol: 'XAUUSD', description: 'GOLD/USD', type: 'Commodity' },
        { symbol: 'SPY', description: 'SPDR S&P 500 ETF TRUST', type: 'ETF' },
        { symbol: 'QQQ', description: 'INVESCO QQQ TRUST', type: 'ETF' },
      ];
      
      const q = query.toUpperCase();
      return mockDb.filter(item => 
        item.symbol.includes(q) || item.description.includes(q)
      );
    }

    // --- REAL SEARCH (Finnhub) ---
    try {
      const response = await fetch(`https://finnhub.io/api/v1/search?q=${query}&token=${API_KEY}`);
      const data = await response.json();
      // Finnhub returns { count: 10, result: [...] }
      return data.result || [];
    } catch (error) {
      console.error("Symbol Search Error:", error);
      return [];
    }
  },

  /**
   * Fetches current quotes for a list of symbols
   */
  async getQuotes(symbols) {
    if (!symbols || symbols.length === 0) return {};

    // --- MOCK DATA MODE ---
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const mockQuotes = {};
      
      symbols.forEach(sym => {
        let seed = sym.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        let basePrice = (seed * 1.5) % 500; 
        if (sym.includes('BTC') || sym.includes('ETH')) basePrice *= 100;

        const candles = [];
        let currentPrice = basePrice;
        
        for(let i = 0; i < 20; i++) {
          const candle = generateNextCandle(currentPrice);
          candles.push(candle);
          currentPrice = candle.close;
        }

        const lastCandle = candles[candles.length - 1];
        const prevCandle = candles[candles.length - 2];
        const change = lastCandle.close - prevCandle.close;
        const changePercent = (change / prevCandle.close) * 100;
        
        mockQuotes[sym] = {
          symbol: sym,
          price: parseFloat(lastCandle.close.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
          candles: candles
        };
      });
      // console.log("📊 [Mock] Market Data Generated:", mockQuotes);
      return mockQuotes;
    }

    // --- REAL DATA MODE (Finnhub) ---
    try {
      const quotes = {};
      const promises = symbols.map(async (sym) => {
        // Simple normalization for Finnhub
        const querySymbol = sym.replace('/', '').replace('-', ''); 
        
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${querySymbol}&token=${API_KEY}`);
        const data = await response.json();

        if (data.c) {
          // Synthetic candles for sparkline
          const syntheticCandles = [
            { open: data.o, close: data.o, high: data.o, low: data.o },
            { open: data.o, close: (data.o + data.c)/2, high: data.h, low: data.l },
            { open: (data.o + data.c)/2, close: data.c, high: data.h, low: data.l }
          ];

          quotes[sym] = {
            symbol: sym,
            price: data.c,
            change: data.d,
            changePercent: data.dp,
            candles: syntheticCandles
          };
        }
      });

      await Promise.all(promises);
      return quotes;

    } catch (error) {
      console.error("Market Data Error:", error);
      return {};
    }
  }
};