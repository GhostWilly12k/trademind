import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-4 py-3 rounded-xl border border-white/10 shadow-xl"
        style={{
          background: 'rgba(15, 18, 59, 0.95)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
        <p className="text-lg font-bold text-white">
          ${payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export default function EquityCurveChart({ trades = [] }) {
  const { data, currentEquity } = useMemo(() => {
    if (!trades || trades.length === 0) return { data: [], currentEquity: 0 };

    // 1. Sort by date (oldest to newest)
    const sortedTrades = [...trades].sort((a, b) =>
      new Date(a.exit_date || a.entry_date) - new Date(b.exit_date || b.entry_date)
    );

    let runningTotal = 0;
    
    // 2. Map to chart format
    const chartData = sortedTrades.map(trade => {
      runningTotal += (trade.profit_loss || 0);
      return {
        date: format(new Date(trade.exit_date || trade.entry_date), 'MMM d'),
        fullDate: format(new Date(trade.exit_date || trade.entry_date), 'PPP'), // For tooltip if needed
        equity: runningTotal,
      };
    });

    return { data: chartData, currentEquity: runningTotal };
  }, [trades]);

  return (
    <Card className="glass-card border-none flex flex-col h-full">
      <CardHeader className="border-b border-white/10 p-6 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-white">Equity Curve</CardTitle>
          <p className="text-sm text-slate-400">Cumulative P&L over time</p>
        </div>
        {/* Live Equity Badge */}
        {data.length > 0 && (
          <div className={`px-3 py-1 rounded-lg border flex items-center gap-2 ${currentEquity >= 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <TrendingUp size={16} />
            <span className="font-mono font-bold">${currentEquity.toFixed(2)}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-6 flex-1 min-h-[300px]">
        {data.length > 0 ? (
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2CD9FF" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#0075FF" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#0075FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255, 255, 255, 0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#A0AEC0"
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: '11px', fontWeight: 600, fill: '#A0AEC0' }}
                  dy={10}
                  minTickGap={30}
                />
                <YAxis
                  stroke="#A0AEC0"
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: '11px', fontWeight: 600, fill: '#A0AEC0' }}
                  dx={-10}
                  tickFormatter={(value) => `$${value}`}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#2CD9FF"
                  strokeWidth={3}
                  fill="url(#equityGradient)"
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: '#fff',
                    stroke: '#0075FF',
                    strokeWidth: 3,
                    filter: 'drop-shadow(0 0 8px #0075FF)'
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 space-y-2">
            <TrendingUp size={48} className="opacity-20" />
            <p>No trades logged yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}