import React from 'react';
import { motion } from 'framer-motion';

export default function CandleChart({ data = [], height = 40, width = 150 }) {
  if (!data || data.length === 0) return null;

  // 1. Calculate Scales
  const allHighs = data.map(d => d.high);
  const allLows = data.map(d => d.low);
  const maxPrice = Math.max(...allHighs);
  const minPrice = Math.min(...allLows);
  const priceRange = maxPrice - minPrice || 1;

  // 2. Dimensions
  const candleWidth = (width / data.length) * 0.6; // 60% bar width, 40% gap
  const gap = (width / data.length) * 0.4;

  const getY = (price) => {
    // Invert Y because SVG 0 is top
    return height - ((price - minPrice) / priceRange) * height;
  };

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {data.map((candle, i) => {
        const x = i * (width / data.length) + gap / 2;
        const isGreen = candle.close >= candle.open;
        const color = isGreen ? "#34d399" : "#ef4444"; // Emerald-400 : Red-500

        // Coordinates
        const yOpen = getY(candle.open);
        const yClose = getY(candle.close);
        const yHigh = getY(candle.high);
        const yLow = getY(candle.low);

        const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1); // Min 1px height
        const bodyY = Math.min(yOpen, yClose);

        return (
          <motion.g 
            key={i}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.3, delay: i * 0.02 }}
          >
            {/* Wick (Line) */}
            <line 
              x1={x + candleWidth / 2} 
              y1={yHigh} 
              x2={x + candleWidth / 2} 
              y2={yLow} 
              stroke={color} 
              strokeWidth="1" 
              opacity="0.6"
            />
            {/* Body (Rect) */}
            <rect
              x={x}
              y={bodyY}
              width={candleWidth}
              height={bodyHeight}
              fill={color}
              rx="1" // Slight rounded corners for modern look
            />
          </motion.g>
        );
      })}
    </svg>
  );
}
