/**
 * MARKET DATA SERVICE - Frontend Integration Layer
 * 
 * This service connects to the backend MarketDataInterface and handles:
 * - REST API calls for on-demand data
 * - WebSocket subscriptions for real-time updates
 * - Local caching to reduce API calls
 * 
 * Backend Python Implementation Reference: See docs/market_data_backend.py
 */

// In-memory LRU Cache for frontend
class LRUCache {
  constructor(maxSize = 100, ttlMs = 60000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Delete oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttlMs
    });
  }

  clear() {
    this.cache.clear();
  }
}

// Singleton cache instance
const marketDataCache = new LRUCache(100, 60000); // 1 minute TTL

// Symbol validation and correction
const SYMBOL_CORRECTIONS = {
  'BTC': 'BTC-USD',
  'ETH': 'ETH-USD',
  'BITCOIN': 'BTC-USD',
  'ETHEREUM': 'ETH-USD',
  'SP500': 'SPY',
  'S&P500': 'SPY',
  'GOLD': 'GLD',
  'OIL': 'USO',
};

function validateAndCorrectSymbol(ticker) {
  const upper = ticker.toUpperCase().trim();
  if (SYMBOL_CORRECTIONS[upper]) {
    return {
      corrected: true,
      original: ticker,
      symbol: SYMBOL_CORRECTIONS[upper],
      message: `Symbol corrected: "${ticker}" → "${SYMBOL_CORRECTIONS[upper]}"`
    };
  }
  return { corrected: false, symbol: upper };
}

/**
 * MarketDataService - Frontend API for market data
 * Mirrors the backend MarketDataInterface
 */
export const MarketDataService = {
  // WebSocket connection for real-time updates
  _ws: null,
  _subscriptions: new Map(),
  _reconnectAttempts: 0,
  _maxReconnectAttempts: 5,

  /**
   * Get current price for a ticker
   * Used by: Risk Manager, Supervisor
   */
  async getCurrentPrice(ticker) {
    const validation = validateAndCorrectSymbol(ticker);
    const symbol = validation.symbol;
    
    // Check cache first
    const cacheKey = `price:${symbol}`;
    const cached = marketDataCache.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true, ...validation };
    }

    try {
      // In production, this calls your backend API
      // For now, simulate with mock data
      const response = await this._fetchFromBackend(`/api/market/price/${symbol}`);
      
      const result = {
        symbol,
        price: response.price,
        change_percent: response.change_percent,
        volume: response.volume,
        timestamp: new Date().toISOString(),
        ...validation
      };

      marketDataCache.set(cacheKey, result);
      return result;
    } catch (error) {
      if (error.message.includes('not found')) {
        return {
          error: true,
          message: `Symbol not found: "${ticker}". Did you mean ${this._suggestSymbol(ticker)}?`,
          suggestions: this._getSuggestions(ticker)
        };
      }
      throw error;
    }
  },

  /**
   * Get OHLCV history for technical analysis
   * Used by: Technician Agent
   */
  async getOHLCVHistory(ticker, timeframe = '1h', limit = 100) {
    const validation = validateAndCorrectSymbol(ticker);
    const symbol = validation.symbol;

    const cacheKey = `ohlcv:${symbol}:${timeframe}:${limit}`;
    const cached = marketDataCache.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      const response = await this._fetchFromBackend(
        `/api/market/ohlcv/${symbol}?timeframe=${timeframe}&limit=${limit}`
      );

      const result = {
        symbol,
        timeframe,
        candles: response.candles, // Array of {timestamp, open, high, low, close, volume}
        ...validation
      };

      marketDataCache.set(cacheKey, result);
      return result;
    } catch (error) {
      return { error: true, message: error.message };
    }
  },

  /**
   * Get market news with sentiment
   * Used by: Fundamentalist Agent
   */
  async getMarketNews(ticker, limit = 3) {
    const validation = validateAndCorrectSymbol(ticker);
    const symbol = validation.symbol;

    const cacheKey = `news:${symbol}:${limit}`;
    const cached = marketDataCache.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      const response = await this._fetchFromBackend(
        `/api/market/news/${symbol}?limit=${limit}`
      );

      const result = {
        symbol,
        headlines: response.headlines, // Array of {title, source, sentiment, url, published_at}
        overall_sentiment: response.overall_sentiment,
        ...validation
      };

      marketDataCache.set(cacheKey, result);
      return result;
    } catch (error) {
      return { error: true, message: error.message };
    }
  },

  /**
   * Get volatility index (VIX)
   * Used by: Quant Agent
   */
  async getVolatilityIndex() {
    const cacheKey = 'vix';
    const cached = marketDataCache.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      const response = await this._fetchFromBackend('/api/market/vix');

      const result = {
        vix: response.vix,
        vix_change: response.change,
        fear_greed_index: response.fear_greed,
        market_regime: this._classifyVolatility(response.vix),
        timestamp: new Date().toISOString()
      };

      marketDataCache.set(cacheKey, result);
      return result;
    } catch (error) {
      return { error: true, message: error.message };
    }
  },

  /**
   * Subscribe to real-time price updates via WebSocket
   * Returns unsubscribe function
   */
  subscribeToPrice(ticker, callback) {
    const validation = validateAndCorrectSymbol(ticker);
    const symbol = validation.symbol;

    // Initialize WebSocket if not connected
    this._ensureWebSocketConnection();

    // Add subscription
    if (!this._subscriptions.has(symbol)) {
      this._subscriptions.set(symbol, new Set());
      this._sendWebSocketMessage({ action: 'subscribe', symbol });
    }
    this._subscriptions.get(symbol).add(callback);

    // Return unsubscribe function
    return () => {
      const subs = this._subscriptions.get(symbol);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this._subscriptions.delete(symbol);
          this._sendWebSocketMessage({ action: 'unsubscribe', symbol });
        }
      }
    };
  },

  // Private methods
  _ensureWebSocketConnection() {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) return;

    // In production, connect to your WebSocket server
    const wsUrl = process.env.REACT_APP_WS_URL || 'wss://api.yourbackend.com/ws/market';
    
    try {
      this._ws = new WebSocket(wsUrl);

      this._ws.onopen = () => {
        console.log('[MarketData] WebSocket connected');
        this._reconnectAttempts = 0;
        // Resubscribe to all symbols
        this._subscriptions.forEach((_, symbol) => {
          this._sendWebSocketMessage({ action: 'subscribe', symbol });
        });
      };

      this._ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const callbacks = this._subscriptions.get(data.symbol);
        if (callbacks) {
          callbacks.forEach(cb => cb(data));
        }
      };

      this._ws.onclose = () => {
        console.log('[MarketData] WebSocket disconnected');
        this._attemptReconnect();
      };

      this._ws.onerror = (error) => {
        console.error('[MarketData] WebSocket error:', error);
      };
    } catch (error) {
      console.error('[MarketData] Failed to create WebSocket:', error);
    }
  },

  _attemptReconnect() {
    if (this._reconnectAttempts < this._maxReconnectAttempts) {
      this._reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this._reconnectAttempts), 30000);
      setTimeout(() => this._ensureWebSocketConnection(), delay);
    }
  },

  _sendWebSocketMessage(message) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(message));
    }
  },

  async _fetchFromBackend(endpoint) {
    // In production, this calls your actual backend
    // For demo, return simulated data
    return this._simulateBackendResponse(endpoint);
  },

  _simulateBackendResponse(endpoint) {
    // Simulated responses for demo purposes
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint.includes('/price/')) {
          resolve({
            price: 150 + Math.random() * 10,
            change_percent: (Math.random() - 0.5) * 5,
            volume: Math.floor(Math.random() * 10000000)
          });
        } else if (endpoint.includes('/ohlcv/')) {
          const candles = [];
          let price = 150;
          for (let i = 0; i < 100; i++) {
            const open = price;
            const change = (Math.random() - 0.5) * 3;
            const close = open + change;
            const high = Math.max(open, close) + Math.random() * 1;
            const low = Math.min(open, close) - Math.random() * 1;
            candles.push({
              timestamp: Date.now() - (100 - i) * 3600000,
              open, high, low, close,
              volume: Math.floor(Math.random() * 1000000)
            });
            price = close;
          }
          resolve({ candles });
        } else if (endpoint.includes('/news/')) {
          resolve({
            headlines: [
              { title: 'Market rallies on strong earnings', sentiment: 0.7, source: 'Reuters' },
              { title: 'Fed signals rate decision next week', sentiment: 0.1, source: 'Bloomberg' },
              { title: 'Tech sector leads gains', sentiment: 0.5, source: 'CNBC' }
            ],
            overall_sentiment: 0.43
          });
        } else if (endpoint.includes('/vix')) {
          resolve({
            vix: 15 + Math.random() * 10,
            change: (Math.random() - 0.5) * 2,
            fear_greed: Math.floor(Math.random() * 100)
          });
        }
      }, 100);
    });
  },

  _classifyVolatility(vix) {
    if (vix < 12) return 'low';
    if (vix < 20) return 'normal';
    if (vix < 30) return 'elevated';
    return 'extreme';
  },

  _suggestSymbol(ticker) {
    const upper = ticker.toUpperCase();
    if (upper.length <= 4 && !upper.includes('-')) {
      return `${upper}-USD (for crypto) or check the exact stock ticker`;
    }
    return 'a valid ticker symbol';
  },

  _getSuggestions(ticker) {
    const upper = ticker.toUpperCase();
    const suggestions = [];
    if (['BTC', 'ETH', 'SOL', 'ADA'].some(c => upper.includes(c))) {
      suggestions.push(`${upper}-USD`);
    }
    return suggestions;
  }
};

export default MarketDataService;