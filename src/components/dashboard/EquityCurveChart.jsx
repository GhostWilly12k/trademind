import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-4 py-3 rounded-xl"
        style={{
          background: 'rgba(15, 18, 59, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }}
      >
        <p className="text-xs font-semibold text-[#A0AEC0] mb-1">{label}</p>
        <p className="text-lg font-bold text-white">
          ${payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export default function EquityCurveChart({ trades }) {
  const equityData = React.useMemo(() => {
    const sortedTrades = [...trades].sort((a, b) =>
      new Date(a.exit_date || a.entry_date) - new Date(b.exit_date || b.entry_date)
    );

    let runningTotal = 0;
    return sortedTrades.map(trade => {
      runningTotal += trade.profit_loss || 0;
      return {
        date: format(new Date(trade.exit_date || trade.entry_date), 'MMM d'),
        equity: runningTotal,
      };
    });
  }, [trades]);

  return (
    <Card className="glass-card glass-hover border-none">
      <CardHeader className="border-b border-white/10 p-6">
        <CardTitle className="text-xl font-bold text-white">Equity Curve</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height={300} debounce={200}>
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2CD9FF" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#0075FF" stopOpacity={0.2} />
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
              />
              <YAxis
                stroke="#A0AEC0"
                axisLine={false}
                tickLine={false}
                style={{ fontSize: '11px', fontWeight: 600, fill: '#A0AEC0' }}
                dx={-10}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
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
                style={{ filter: 'drop-shadow(0 0 8px rgba(44, 217, 255, 0.6))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}