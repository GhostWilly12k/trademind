import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, Activity, Shield, HelpCircle } from "lucide-react";

export default function SystemViability({ trades }) {
  const metrics = React.useMemo(() => {
    if (trades.length < 2) {
      return { expectancy: 0, sqn: 0, sortino: 0, sqnRating: 'insufficient' };
    }

    const wins = trades.filter(t => (t.profit_loss || 0) > 0);
    const losses = trades.filter(t => (t.profit_loss || 0) < 0);
    
    const winRate = trades.length > 0 ? wins.length / trades.length : 0;
    const lossRate = 1 - winRate;
    
    const avgWin = wins.length > 0 
      ? wins.reduce((sum, t) => sum + (t.profit_loss || 0), 0) / wins.length 
      : 0;
    const avgLoss = losses.length > 0 
      ? Math.abs(losses.reduce((sum, t) => sum + (t.profit_loss || 0), 0) / losses.length)
      : 0;

    // Expectancy = (Win% * AvgWin$) - (Loss% * AvgLoss$)
    const expectancy = (winRate * avgWin) - (lossRate * avgLoss);

    // R-Multiples (profit/initial risk, default to 1 if no initial_risk)
    const rMultiples = trades.map(t => {
      const initialRisk = t.initial_risk || Math.abs(avgLoss) || 1;
      return (t.profit_loss || 0) / initialRisk;
    });

    const avgR = rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length;
    const variance = rMultiples.reduce((sum, r) => sum + Math.pow(r - avgR, 2), 0) / rMultiples.length;
    const stdDev = Math.sqrt(variance) || 1;

    // SQN = (Expectancy / StdDev of R-Multiples) * sqrt(N)
    const sqn = (avgR / stdDev) * Math.sqrt(Math.min(trades.length, 100));

    // Sortino Ratio = (CAGR - RiskFreeRate) / Downside Deviation
    const totalReturn = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const initialCapital = 10000; // Assumed starting capital
    const daySpan = trades.length > 1 
      ? (new Date(trades[0].exit_date || trades[0].entry_date) - new Date(trades[trades.length - 1].exit_date || trades[trades.length - 1].entry_date)) / (1000 * 60 * 60 * 24)
      : 365;
    const years = Math.abs(daySpan) / 365 || 1;
    const cagr = (Math.pow((initialCapital + totalReturn) / initialCapital, 1 / years) - 1) * 100;
    const riskFreeRate = 5; // 5% assumed

    // Downside deviation (only negative returns)
    const negativeReturns = trades.filter(t => (t.profit_loss || 0) < 0).map(t => t.profit_loss_percentage || 0);
    const downsideVariance = negativeReturns.length > 0
      ? negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
      : 1;
    const downsideDeviation = Math.sqrt(downsideVariance) || 1;
    
    const sortino = (cagr - riskFreeRate) / downsideDeviation;

    // SQN Rating
    let sqnRating = 'hard';
    if (sqn >= 3) sqnRating = 'holy_grail';
    else if (sqn >= 1.6) sqnRating = 'average';

    return { expectancy, sqn, sortino, sqnRating };
  }, [trades]);

  const sqnColors = {
    hard: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)', text: '#ef4444', label: 'Hard to Trade' },
    average: { bg: 'rgba(234, 179, 8, 0.2)', border: 'rgba(234, 179, 8, 0.5)', text: '#eab308', label: 'Average' },
    holy_grail: { bg: 'rgba(0, 201, 255, 0.2)', border: 'rgba(0, 201, 255, 0.5)', text: '#00C9FF', label: 'Holy Grail' },
    insufficient: { bg: 'rgba(107, 114, 128, 0.2)', border: 'rgba(107, 114, 128, 0.5)', text: '#6b7280', label: 'Need More Data' }
  };

  const currentSqn = sqnColors[metrics.sqnRating];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Expectancy Card */}
        <Card className="glass-card border-none relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0075FF]/10 to-transparent" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0, 117, 255, 0.2) 0%, rgba(0, 201, 255, 0.2) 100%)', border: '1px solid rgba(0, 117, 255, 0.3)' }}>
                <TrendingUp className="w-6 h-6 text-[#0075FF]" />
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-[#A0AEC0] hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="glass-card border-white/20 text-white max-w-xs">
                  <p>The mathematical value of every trade you take, regardless of the immediate result.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm font-medium text-[#A0AEC0] mb-1">Expectancy</p>
            <p className={`text-3xl font-bold ${metrics.expectancy >= 0 ? 'text-[#00C9FF]' : 'text-red-400'}`}>
              ${metrics.expectancy.toFixed(2)}
            </p>
            <p className="text-xs text-[#A0AEC0] mt-2">per trade</p>
          </CardContent>
        </Card>

        {/* SQN Card */}
        <Card className="glass-card border-none relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${currentSqn.bg} 0%, transparent 100%)` }} />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: currentSqn.bg, border: `1px solid ${currentSqn.border}` }}>
                <Activity className="w-6 h-6" style={{ color: currentSqn.text }} />
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-[#A0AEC0] hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="glass-card border-white/20 text-white max-w-xs">
                  <p>System Quality Number measures the smoothness and trade-ability of your equity curve.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm font-medium text-[#A0AEC0] mb-1">SQN Score</p>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold text-white">{metrics.sqn.toFixed(2)}</p>
              <Badge style={{ background: currentSqn.bg, border: `1px solid ${currentSqn.border}`, color: currentSqn.text }}>
                {currentSqn.label}
              </Badge>
            </div>
            <p className="text-xs text-[#A0AEC0] mt-2">based on {trades.length} trades</p>
          </CardContent>
        </Card>

        {/* Sortino Ratio Card */}
        <Card className="glass-card border-none relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-[#A0AEC0] hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="glass-card border-white/20 text-white max-w-xs">
                  <p>Risk-adjusted return that only penalizes downside volatility. Higher is better.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm font-medium text-[#A0AEC0] mb-1">Sortino Ratio</p>
            <p className={`text-3xl font-bold ${metrics.sortino >= 1 ? 'text-purple-400' : 'text-[#A0AEC0]'}`}>
              {metrics.sortino.toFixed(2)}
            </p>
            <p className="text-xs text-[#A0AEC0] mt-2">risk-adjusted return</p>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}