# Technician Pattern Detection Flow

This document describes the high-level flow for detecting classical technical patterns (double top, head & shoulders, flags, wedges, etc.) and integrating them into the AI Insights module.

## Goals

- Produce deterministic, explainable pattern detections that can be surfaced to the trader in `TechnicalAnalysis.jsx`.
- Provide metadata around pattern confidence, start/end times, and supporting indicators.
- Allow human-in-the-loop (HITL) review before signals are used for automation.

## Pipeline

1. Data ingestion
   - Collect OHLCV time series from MarketDataService backend.
   - Normalize timeframes; resample higher/lower timeframe windows as needed.

2. Preprocessing
   - Smooth series with optional EMA or Savitzky-Golay filter to reduce noise.
   - Compute indicators used for validation: RSI, MACD, ATR, volume anomalies.

3. Candidate generation
   - Use rule-based heuristics (e.g., local tops, troughs) to define candidate pattern regions.
   - For each candidate, compute simple features (peak ratio, pullback size, duration).

4. Scoring & validation
   - Apply a scoring function combining structural match (shape) and supporting indicator checks.
   - Score outputs include: `confidence`, `pattern_type`, `start_ts`, `end_ts`, `parts`.

5. Hitl and explainability
   - Present candidates in `TechnicalAnalysis.jsx` with details and the scoring breakdown.
   - Allow traders to approve/reject patterns per `TradingSignals.jsx` process before using triggers.

6. Persistence & feedback
   - Store validated patterns in the backend and collect feedback to retrain scoring heuristics.

## Implementation notes

- Start with deterministic, open rules (no black-box) so traders can trust outputs.
- Integrate with the `PredictiveModel.jsx` monte-carlo and risk systems to quantify how a given pattern + trade idea affects risk.
- Optimize for speed: downsample when scanning wide ranges; only analyze active instruments.

## Next steps

- Implement a pattern detector module in Python or Node.js using the shape/peak approach.
- Add tests and recorded examples of pattern detections for review.
