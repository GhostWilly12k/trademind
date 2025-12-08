import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HelpCircle, AlertTriangle, ShieldCheck, Trophy } from "lucide-react";
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

export default function RiskSurvival({ trades = [] }) {
  const { underwaterData, maxDrawdown, riskOfRuin, status, currentDrawdown } = useMemo(() => {
    if (!trades || trades.length === 0) {
      return { underwaterData: [], maxDrawdown: 0, riskOfRuin: 0, status: 'nodata', currentDrawdown: 0 };
    }

    // 1. Prepare Drawdown Data
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.exit_date || a.entry_date) - new Date(b.exit_date || b.entry_date)
    );

    let runningEquity = 0;
    let peakEquity = 0;
    let maxDD = 0;

    const data = sortedTrades.map(trade => {
      runningEquity += (trade.profit_loss || 0);
      
      if (runningEquity > peakEquity) peakEquity = runningEquity;
      
      let drawdown = 0;
      if (peakEquity > 0) {
         drawdown = ((peakEquity - runningEquity) / peakEquity) * 100;
      } else if (peakEquity === 0 && runningEquity < 0) {
         drawdown = 100;
      }

      const chartDrawdown = -Math.abs(drawdown);
      maxDD = Math.min(maxDD, chartDrawdown); 
      
      return {
        date: format(new Date(trade.exit_date || trade.entry_date), 'MMM d'),
        drawdown: chartDrawdown,
        equity: runningEquity
      };
    });

    // 2. Risk of Ruin Calculation
    const wins = trades.filter(t => (t.profit_loss || 0) > 0);
    const losses = trades.filter(t => (t.profit_loss || 0) <= 0);
    
    const winRate = trades.length > 0 ? wins.length / trades.length : 0;
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.profit_loss, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.profit_loss, 0) / losses.length) : 0;
    
    let ror = 0;
    
    if (avgLoss > 0) {
        const winProb = winRate;
        const lossProb = 1 - winRate;
        const payoffRatio = avgWin / avgLoss;
        
        // Edge calculation
        const edge = (winProb * payoffRatio) - lossProb;
        
        if (edge <= 0) {
            ror = 1.0; 
        } else {
            const capitalUnits = 20; 
            ror = Math.pow((1 - edge) / (1 + edge), capitalUnits);
        }
    } 

    const currentDD = data.length > 0 ? data[data.length - 1].drawdown : 0;
    const calculatedRoR = Math.min(ror * 100, 100);
    const isRuinCritical = calculatedRoR > 1;

    // 3. Determine Status
    let calcStatus = 'safe';
    if (trades.length === 0) {
        calcStatus = 'nodata';
    } else if (losses.length === 0 && wins.length > 0) {
        calcStatus = 'perfect'; // No losses yet
    } else if (isRuinCritical) {
        calcStatus = 'critical';
    } else {
        calcStatus = 'safe';
    }

    return { 
      underwaterData: data, 
      maxDrawdown: Math.abs(maxDD),
      riskOfRuin: calculatedRoR,
      status: calcStatus,
      currentDrawdown: Math.abs(currentDD)
    };
  }, [trades]);

  // Helper for UI colors/icons based on status
  const getStatusUI = () => {
    switch(status) {
        case 'critical':
            return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: AlertTriangle, shadow: 'rgba(244, 63, 94, 0.2)' };
        case 'perfect':
            return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Trophy, shadow: 'rgba(52, 211, 153, 0.2)' };
        case 'nodata':
            return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: HelpCircle, shadow: 'rgba(148, 163, 184, 0.2)' };
        case 'safe':
        default:
            return { color: 'text-[#00C9FF]', bg: 'bg-[#00C9FF]/10', border: 'border-[#00C9FF]/20', icon: ShieldCheck, shadow: 'rgba(0, 201, 255, 0.2)' };
    }
  };

  const ui = getStatusUI();
  const StatusIcon = ui.icon;

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
            <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
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
                    minTickGap={30}
                    />
                    <YAxis 
                    stroke="#A0AEC0" 
                    axisLine={false} 
                    tickLine={false} 
                    style={{ fontSize: '11px', fontWeight: 600 }}
                    tickFormatter={(v) => `${v}%`}
                    domain={['auto', 0]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                    type="monotone" 
                    dataKey="drawdown" 
                    stroke="#f43f5e" 
                    strokeWidth={2}
                    fill="url(#underwaterGradient)" 
                    dot={false}
                    />
                </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="glass-card rounded-xl p-4 bg-white/5 border border-white/10">
                <p className="text-xs text-[#A0AEC0] mb-1">Max Drawdown</p>
                <p className="text-2xl font-bold text-rose-400">-{maxDrawdown.toFixed(2)}%</p>
              </div>
              <div className="glass-card rounded-xl p-4 bg-white/5 border border-white/10">
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
            <div className="flex flex-col items-center justify-center mb-6 py-8">
              <div 
                className={`w-32 h-32 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${ui.bg.replace('/10', '/20')}`} 
                style={{ 
                    border: `4px solid ${ui.color === 'text-rose-400' ? 'rgba(244, 63, 94, 0.5)' : ui.color === 'text-emerald-400' ? 'rgba(52, 211, 153, 0.5)' : 'rgba(0, 201, 255, 0.5)'}`, 
                    boxShadow: `0 0 40px ${ui.shadow}` 
                }}
              >
                <StatusIcon className={`w-12 h-12 ${ui.color}`} />
              </div>
              
              <p className={`text-5xl font-bold tracking-tighter ${ui.color}`}>
                {riskOfRuin.toFixed(1)}<span className="text-2xl">%</span>
              </p>
              <p className="text-sm text-[#A0AEC0] mt-2 font-medium uppercase tracking-widest">Probability</p>
            </div>

            <Alert className={`border-none ${ui.bg}`}>
              <StatusIcon className={`h-4 w-4 ${ui.color}`} />
              <AlertTitle className={`mb-1 font-bold ${ui.color}`}>
                {status === 'critical' && 'Critical Warning'}
                {status === 'safe' && 'Mathematically Safe'}
                {status === 'perfect' && 'Perfect Record'}
                {status === 'nodata' && 'Insufficient Data'}
              </AlertTitle>
              <AlertDescription className="text-[#A0AEC0] text-xs leading-relaxed">
                {status === 'critical' && 'Your current edge is negative or inconsistent. Reduce position size immediately.'}
                {status === 'safe' && 'Your current edge and position sizing provide a statistical safety net against ruin.'}
                {status === 'perfect' && 'No losses recorded yet. Risk of Ruin requires loss data to calculate a statistical probability.'}
                {status === 'nodata' && 'Not enough trade data to calculate risk probability.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}