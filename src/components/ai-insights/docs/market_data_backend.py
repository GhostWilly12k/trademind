"""
market_data_backend.py

Documentation / example implementation for a simple market data backend that can
serve symbol quotes and small historical series to the frontend MarketDataService.

This file is intended as a reference/example — not a production-ready server.

Features covered:
- A simple HTTP API using Flask
- Endpoints: /quote, /history
- Rate limiting and basic caching notes
- Deployment notes and authentication suggestions

Requirements (example):
pip install flask requests cachetools

Example usage:
    python market_data_backend.py

"""

from flask import Flask, request, jsonify
from cachetools import TTLCache
import requests
import time

app = Flask(__name__)

# Example in-memory cache: 100 entries, TTL 10 seconds
cache = TTLCache(maxsize=100, ttl=10)


def fetch_market_quote_from_provider(symbol: str):
    """Replace this function with real data provider integration (Polygon, Alpaca, IEX, etc.)."""
    # Here we mock an external call:
    return {
        "symbol": symbol,
        "price": round(100 + (time.time() % 10) + (hash(symbol) % 4), 2),
        "timestamp": time.strftime('%Y-%m-%d %H:%M:%S')
    }


@app.route('/quote')
def quote():
    symbol = request.args.get('symbol')
    if not symbol:
        return jsonify({"error": "symbol query required"}), 400

    cache_key = f"quote:{symbol}"
    if cache_key in cache:
        return jsonify(cache[cache_key])

    # Real implementation would call external provider with auth
    data = fetch_market_quote_from_provider(symbol)
    cache[cache_key] = data
    return jsonify(data)


@app.route('/history')
def history():
    symbol = request.args.get('symbol', 'AAPL')
    days = int(request.args.get('days', '30'))

    # Mock: return a sequence of daily close prices
    now = int(time.time())
    results = []
    price = 100.0
    for d in range(days):
        price += (hash(symbol) % 3 - 1) + (d % 5 - 2) * 0.1
        results.append({"ts": now - (days - d) * 86400, "close": round(price, 2)})

    return jsonify({"symbol": symbol, "series": results})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
