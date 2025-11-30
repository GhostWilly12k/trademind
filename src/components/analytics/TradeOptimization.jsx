import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Target } from "lucide-react";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(15, 18, 59, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' }}>
        <p className="text-sm font-bold text-white mb-2">{data.symbol}</p>
        <p className="text-xs text-[#A0AEC0]">MFE (Peak Profit): <span className="text-[#00C9FF]">${data.mfe?.toFixed(2) || 0}</span></p>
        <p className="text-xs text-[#A0AEC0]">MAE (Max Heat): <span className="text-red-400">${Math.abs(data.mae || 0).toFixed(2)}</span></p>
        <p className="text-xs text-[#A0AEC0] mt-1">Result: <span className={data.pnl >= 0 ? 'text-[#00C9FF]' : 'text-red-400'}>${data.pnl?.toFixed(2)}</span></p>
      </div>
    );
  }
  return null;
};

export default function TradeOptimization({ trades }) {
  const { scatterData, exitEfficiency, avgMae, avgMfe } = React.useMemo(() => {
    const tradesWithExcursion = trades.filter(t => t.mfe !== undefined || t.mae !== undefined);
    
    // If no excursion data, simulate based on P&L
    const data = trades.map(t => {
      const pnl = t.profit_loss || 0;
      const mfe = t.mfe ?? (pnl > 0 ? pnl * 1.3 : Math.abs(pnl) * 0.5);
      const mae = t.mae ?? (pnl < 0 ? pnl * 1.2 : -Math.abs(pnl) * 0.3);
      
      return {
        symbol: t.symbol,
        mfe: Math.abs(mfe),
        mae: Math.abs(mae),
        pnl,
        isWin: pnl >= 0
      };
    });

    // Exit Efficiency = Realized Profit / MFE
    const winningTrades = data.filter(t => t.isWin && t.mfe > 0);
    const totalRealized = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalMfe = winningTrades.reduce((sum, t) => sum + t.mfe, 0);
    const efficiency = totalMfe > 0 ? (totalRealized / totalMfe) * 100 : 0;

    const avgMaeVal = data.length > 0 ? data.reduce((sum, t) => sum + t.mae, 0) / data.length : 0;
    const avgMfeVal = data.length > 0 ? data.reduce((sum, t) => sum + t.mfe, 0) / data.length : 0;

    return { 
      scatterData: data, 
      exitEfficiency: Math.min(efficiency, 100),
      avgMae: avgMaeVal,
      avgMfe: avgMfeVal
    };
  }, [trades]);

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (exitEfficiency / 100) * circumference;

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAE vs MFE Scatter Plot */}
        <Card className="glass-card border-none lg:col-span-2">
          <CardHeader className="border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                MAE vs MFE Analysis
              </CardTitle>
              <UITooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-[#A0AEC0] hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="glass-card border-white/20 text-white max-w-xs">
                  <p><strong>MFE:</strong> Max profit shown during trade.<br/><strong>MAE:</strong> Max drawdown during trade.<br/>Use this to optimize stop and target placement.</p>
                </TooltipContent>
              </UITooltip>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis 
                  type="number" 
                  dataKey="mfe" 
                  name="MFE" 
                  stroke="#A0AEC0"
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: '11px', fontWeight: 600 }}
                  tickFormatter={(v) => `$${v}`}
                  label={{ value: 'MFE (Peak Profit)', position: 'bottom', fill: '#A0AEC0', fontSize: 11 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="mae" 
                  name="MAE" 
                  stroke="#A0AEC0"
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: '11px', fontWeight: 600 }}
                  tickFormatter={(v) => `$${v}`}
                  label={{ value: 'MAE (Max Heat)', angle: -90, position: 'insideLeft', fill: '#A0AEC0', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Scatter name="Trades" data={scatterData} fill="#8884d8">
                  {scatterData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isWin ? '#00C9FF' : '#ef4444'}
                      fillOpacity={0.7}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex gap-6 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00C9FF]" />
                <span className="text-xs text-[#A0AEC0]">Winning Trades</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-[#A0AEC0]">Losing Trades</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exit Efficiency Gauge */}
        <Card className="glass-card border-none">
          <CardHeader className="border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-white">Capture Rate</CardTitle>
              <UITooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-[#A0AEC0] hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="glass-card border-white/20 text-white max-w-xs">
                  <p>How much of the available profit you're capturing. Higher = less money left on the table.</p>
                </TooltipContent>
              </UITooltip>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(0, 201, 255, 0.6))' }}
                />
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0075FF" />
                    <stop offset="100%" stopColor="#00C9FF" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{exitEfficiency.toFixed(0)}%</span>
              </div>
            </div>
            <p className="text-sm text-[#A0AEC0] mt-4 text-center">Exit Efficiency</p>
            
            <div className="w-full mt-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#A0AEC0]">Avg MFE</span>
                <span className="text-sm font-semibold text-[#00C9FF]">${avgMfe.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#A0AEC0]">Avg MAE</span>
                <span className="text-sm font-semibold text-red-400">${avgMae.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}