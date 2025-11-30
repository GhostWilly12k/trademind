import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Activity, 
  TrendingUp, 
  Clock,
  Eye,
  Crosshair,
  HelpCircle,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

// Pattern Card with Hover Overlay Trigger
function PatternCard({ pattern, onHover, onLeave, isActive }) {
  return (
    <motion.div
      onMouseEnter={() => onHover?.(pattern)}
      onMouseLeave={() => onLeave?.()}
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-xl cursor-pointer transition-all ${
        isActive 
          ? 'bg-[#00C9FF]/20 border border-[#00C9FF]/50 shadow-lg shadow-[#00C9FF]/20' 
          : 'bg-white/5 hover:bg-white/10 border border-transparent'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-[#00C9FF]/30' : 'bg-white/10'}`}>
            <Crosshair className={`w-4 h-4 ${isActive ? 'text-[#00C9FF]' : 'text-[#A0AEC0]'}`} />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{pattern.name}</p>
            <p className="text-xs text-[#A0AEC0]">{pattern.trades} trades</p>
          </div>
        </div>
        <Badge className={`${pattern.win_rate >= 65 ? 'bg-[#00C9FF]/20 text-[#00C9FF]' : pattern.win_rate >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
          {pattern.win_rate}% win
        </Badge>
      </div>
      
      <p className="text-xs text-[#A0AEC0] mb-2">{pattern.insight}</p>
      
      {isActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-white/10"
        >
          <div className="flex items-center gap-2 text-xs text-[#00C9FF]">
            <Eye className="w-3 h-3" />
            <span>Pattern overlay active on chart</span>
          </div>
          {pattern.coordinates && (
            <div className="mt-2 p-2 rounded bg-black/20 text-xs font-mono text-[#A0AEC0]">
              Entry: ${pattern.coordinates?.breakout_target?.toFixed(2) || 'N/A'}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Indicator Card
function IndicatorCard({ indicator }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold text-white text-sm">{indicator.name}</p>
        <span className={`text-sm font-bold ${indicator.success_rate >= 65 ? 'text-[#00C9FF]' : 'text-[#A0AEC0]'}`}>
          {indicator.success_rate}%
        </span>
      </div>
      <Progress 
        value={indicator.success_rate} 
        className="h-1.5 bg-white/10"
      />
      <p className="text-xs text-[#A0AEC0] mt-2">{indicator.description}</p>
    </div>
  );
}

// Timeframe Performance
function TimeframeBar({ timeframe, winRate, maxWinRate }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#A0AEC0] w-12">{timeframe}</span>
      <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(winRate / maxWinRate) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full rounded-lg"
          style={{ 
            background: `linear-gradient(90deg, #0075FF ${winRate}%, #00C9FF 100%)`,
            boxShadow: '0 0 10px rgba(0, 117, 255, 0.5)'
          }}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
          {winRate}%
        </span>
      </div>
    </div>
  );
}

export default function TechnicalAnalysis({ technicalData, onPatternHover }) {
  const [activePattern, setActivePattern] = useState(null);

  const handlePatternHover = (pattern) => {
    setActivePattern(pattern.name);
    onPatternHover?.(pattern);
  };

  const handlePatternLeave = () => {
    setActivePattern(null);
    onPatternHover?.(null);
  };

  const maxWinRate = Math.max(
    ...(technicalData?.timeframe_performance?.map(t => t.win_rate) || [50]),
    50
  );

  return (
    <TooltipProvider>
      <Card className="glass-card border-none">
        <CardHeader className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">Technical Analysis</CardTitle>
                <p className="text-sm text-[#A0AEC0]">Pattern recognition & indicator insights</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                The Technician Agent
              </Badge>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-[#A0AEC0]" />
                </TooltipTrigger>
                <TooltipContent className="glass-card border-white/20 text-white max-w-xs">
                  <p>Hover over patterns to overlay them on your chart. The Technician uses vision capabilities to identify and validate chart patterns.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Effective Indicators */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00C9FF]" />
                Effective Indicators
              </h3>
              <div className="space-y-3">
                {technicalData?.effective_indicators?.map((indicator, index) => (
                  <IndicatorCard key={index} indicator={indicator} />
                )) || (
                  <p className="text-sm text-[#A0AEC0]">No indicator data available</p>
                )}
              </div>
            </div>

            {/* Successful Patterns */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-purple-400" />
                Successful Patterns
                <span className="text-xs text-[#A0AEC0] font-normal">(hover to overlay)</span>
              </h3>
              <div className="space-y-3">
                {technicalData?.successful_patterns?.map((pattern, index) => (
                  <PatternCard 
                    key={index} 
                    pattern={pattern}
                    onHover={handlePatternHover}
                    onLeave={handlePatternLeave}
                    isActive={activePattern === pattern.name}
                  />
                )) || (
                  <p className="text-sm text-[#A0AEC0]">No pattern data available</p>
                )}
              </div>
            </div>

            {/* Timeframe Performance */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                Timeframe Performance
              </h3>
              <div className="space-y-3 p-4 rounded-xl bg-white/5">
                {technicalData?.timeframe_performance?.map((tf, index) => (
                  <TimeframeBar 
                    key={index} 
                    timeframe={tf.timeframe} 
                    winRate={tf.win_rate}
                    maxWinRate={maxWinRate}
                  />
                )) || (
                  <p className="text-sm text-[#A0AEC0]">No timeframe data available</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}