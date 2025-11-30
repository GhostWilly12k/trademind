import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PerformanceCharts({ trades }) {
  const winLossData = React.useMemo(() => {
    const wins = trades.filter(t => (t.profit_loss || 0) > 0).length;
    const losses = trades.filter(t => (t.profit_loss || 0) < 0).length;
    return [
      { name: 'Wins', value: wins, color: '#10B981' },
      { name: 'Losses', value: losses, color: '#EF4444' },
    ];
  }, [trades]);

  const strategyPerformance = React.useMemo(() => {
    const strategyStats = {};
    trades.forEach(trade => {
      const strategy = trade.strategy || 'Unspecified';
      if (!strategyStats[strategy]) {
        strategyStats[strategy] = { wins: 0, losses: 0, total: 0 };
      }
      if ((trade.profit_loss || 0) > 0) strategyStats[strategy].wins++;
      else strategyStats[strategy].losses++;
      strategyStats[strategy].total += trade.profit_loss || 0;
    });

    return Object.entries(strategyStats).map(([name, stats]) => ({
      name,
      wins: stats.wins,
      losses: stats.losses,
      total: stats.total,
    }));
  }, [trades]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="glass-card glass-hover border-none">
        <CardHeader className="border-b border-white/10 p-6">
          <CardTitle className="text-xl font-bold text-white">Win/Loss Distribution</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={winLossData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {winLossData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(17, 25, 40, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.125)', borderRadius: '12px', color: '#FFFFFF' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="glass-card glass-hover border-none">
        <CardHeader className="border-b border-white/10 p-6">
          <CardTitle className="text-xl font-bold text-white">Strategy Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={strategyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="name" stroke="#A0AEC0" style={{ fontSize: '12px', fontWeight: 500 }} />
              <YAxis stroke="#A0AEC0" style={{ fontSize: '12px', fontWeight: 500 }} />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(17, 25, 40, 0.95)', 
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.125)',
                  borderRadius: '12px',
                  color: '#FFFFFF'
                }}
              />
              <Legend wrapperStyle={{ color: '#A0AEC0' }} />
              <Bar dataKey="wins" fill="#10B981" name="Wins" radius={[8, 8, 0, 0]} />
              <Bar dataKey="losses" fill="#EF4444" name="Losses" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}