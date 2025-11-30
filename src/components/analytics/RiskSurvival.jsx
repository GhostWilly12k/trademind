import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HelpCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(15, 18, 59, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' }}>
        <p className="text-xs font-semibold text-[#A0AEC0] mb-1">{label}</p>
        <p className="text-lg font-bold text-rose-400">
          {payload[0].value.toFixed(2)}%
        </p>
        <p className="text-xs text-[#A0AEC0] mt-1">below peak equity</p>
      </div>
    );
  }
  return null;
};

export default function RiskSurvival({ trades }) {
  const { underwaterData, maxDrawdown, riskOfRuin, isRuinCritical, currentDrawdown } = React.useMemo(() => {
    if (trades.length === 0) {
      return { underwaterData: [], maxDrawdown: 0, riskOfRuin: 0, isRuinCritical: false, currentDrawdown: 0 };
    }

    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.exit_date || a.entry_date) - new Date(b.exit_date || b.entry_date)
    );

    let runningEquity = 0;
    let peakEquity = 0;
    let maxDD = 0;

    const data = sortedTrades.map(trade => {
      runningEquity += trade.profit_loss || 0;
      peakEquity = Math.max(peakEquity, runningEquity);
      const drawdown = peakEquity > 0 ? ((runningEquity - peakEquity) / peakEquity) * 100 : 0;
      maxDD = Math.min(maxDD, drawdown);
      
      return {
        date: format(new Date(trade.exit_date || trade.entry_date), 'MMM d'),
        drawdown: Math.min(drawdown, 0),
        equity: runningEquity
      };
    });

    // Risk of Ruin calculation
    const wins = trades.filter(t => (t.profit_loss || 0) > 0);
    const losses = trades.filter(t => (t.profit_loss || 0) < 0);
    const winRate = trades.length > 0 ? wins.length / trades.length : 0;
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.profit_loss || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + (t.profit_loss || 0), 0) / losses.length) : 1;
    
    // Edge = (Win% * AvgWin - Loss% * AvgLoss) / AvgLoss
    const edge = avgLoss > 0 ? ((winRate * avgWin) - ((1 - winRate) * avgLoss)) / avgLoss : 0;
    const capitalUnits = 20; // Assuming 20 units of risk capital
    
    // Risk of Ruin = ((1 - Edge) / (1 + Edge)) ^ CapitalUnits
    let ror = 0;
    if (edge > -1 && edge < 1) {
      ror = Math.pow((1 - edge) / (1 + edge), capitalUnits);
    } else if (edge <= -1) {
      ror = 1; // Certain ruin
    }
    
    const currentDD = data.length > 0 ? data[data.length - 1].drawdown : 0;

    return { 
      underwaterData: data, 
      maxDrawdown: Math.abs(maxDD),
      riskOfRuin: ror * 100,
      isRuinCritical: ror > 0.01,
      currentDrawdown: Math.abs(currentDD)
    };
  }, [trades]);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Underwater Chart */}
        <Card className="glass-card border-none lg:col-span-2">
          <CardHeader className="border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white">Drawdown Analysis</CardTitle>
                <p className="text-sm text-[#A0AEC0] mt-1">Underwater equity curve</p>
              </div>
              <UITooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-[#A0AEC0] hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="glass-card border-white/20 text-white max-w-xs">
                  <p>Shows percentage decline from highest equity peak. Valleys represent drawdown periods.</p>
                </TooltipContent>
              </UITooltip>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={underwaterData}>
                <defs>
                  <linearGradient id="underwaterGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#A0AEC0"
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: '11px', fontWeight: 600 }}
                />
                <YAxis 
                  stroke="#A0AEC0"
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: '11px', fontWeight: 600 }}
                  tickFormatter={(v) => `${v}%`}
                  domain={['dataMin', 0]}
                  reversed
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="drawdown" 
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  fill="url(#underwaterGradient)"
                  dot={false}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.5))' }}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="glass-card rounded-xl p-4">
                <p className="text-xs text-[#A0AEC0] mb-1">Max Drawdown</p>
                <p className="text-2xl font-bold text-rose-400">-{maxDrawdown.toFixed(2)}%</p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <p className="text-xs text-[#A0AEC0] mb-1">Current Drawdown</p>
                <p className={`text-2xl font-bold ${currentDrawdown === 0 ? 'text-[#00C9FF]' : 'text-rose-400'}`}>
                  {currentDrawdown === 0 ? 'At Peak' : `-${currentDrawdown.toFixed(2)}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk of Ruin */}
        <Card className="glass-card border-none">
          <CardHeader className="border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-white">Risk of Ruin</CardTitle>
              <UITooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-[#A0AEC0] hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="glass-card border-white/20 text-white max-w-xs">
                  <p>Statistical probability of losing your trading capital based on current edge and risk per trade.</p>
                </TooltipContent>
              </UITooltip>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center mb-6">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${isRuinCritical ? 'bg-rose-500/20' : 'bg-[#00C9FF]/20'}`} style={{ border: `2px solid ${isRuinCritical ? 'rgba(244, 63, 94, 0.5)' : 'rgba(0, 201, 255, 0.5)'}`, boxShadow: isRuinCritical ? '0 0 30px rgba(244, 63, 94, 0.3)' : '0 0 30px rgba(0, 201, 255, 0.3)' }}>
                {isRuinCritical ? (
                  <AlertTriangle className="w-10 h-10 text-rose-400" />
                ) : (
                  <ShieldCheck className="w-10 h-10 text-[#00C9FF]" />
                )}
              </div>
              <p className={`text-4xl font-bold ${isRuinCritical ? 'text-rose-400' : 'text-[#00C9FF]'}`}>
                {riskOfRuin.toFixed(2)}%
              </p>
              <p className="text-sm text-[#A0AEC0] mt-1">probability</p>
            </div>

            <Alert className={`border-none ${isRuinCritical ? 'bg-rose-500/10' : 'bg-[#00C9FF]/10'}`}>
              {isRuinCritical ? (
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-[#00C9FF]" />
              )}
              <AlertTitle className={isRuinCritical ? 'text-rose-400' : 'text-[#00C9FF]'}>
                {isRuinCritical ? 'Critical Warning' : 'Mathematically Safe'}
              </AlertTitle>
              <AlertDescription className="text-[#A0AEC0] text-sm">
                {isRuinCritical 
                  ? 'Reduce position size or improve win rate to lower risk of ruin below 1%.'
                  : 'Your current edge and position sizing provide statistical safety.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}