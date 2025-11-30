import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EmotionalAnalysis({ trades }) {
  const emotionData = React.useMemo(() => {
    const emotionStats = {};
    trades.forEach(trade => {
      const emotion = trade.emotion || 'neutral';
      if (!emotionStats[emotion]) {
        emotionStats[emotion] = { count: 0, totalPnL: 0, wins: 0 };
      }
      emotionStats[emotion].count++;
      emotionStats[emotion].totalPnL += trade.profit_loss || 0;
      if ((trade.profit_loss || 0) > 0) emotionStats[emotion].wins++;
    });

    return Object.entries(emotionStats).map(([emotion, stats]) => ({
      emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      avgPnL: stats.totalPnL / stats.count,
      winRate: (stats.wins / stats.count) * 100,
    }));
  }, [trades]);

  return (
    <Card className="glass-card glass-hover border-none">
      <CardHeader className="border-b border-white/10 p-6">
        <CardTitle className="text-xl font-bold text-white">Emotional State Analysis</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={emotionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="emotion" stroke="#A0AEC0" style={{ fontSize: '12px', fontWeight: 500 }} />
            <YAxis stroke="#A0AEC0" style={{ fontSize: '12px', fontWeight: 500 }} />
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(17, 25, 40, 0.95)', 
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.125)',
                borderRadius: '12px',
                color: '#FFFFFF'
              }}
              formatter={(value, name) => [
                name === 'avgPnL' ? `$${value.toFixed(2)}` : `${value.toFixed(1)}%`,
                name === 'avgPnL' ? 'Avg P&L' : 'Win Rate'
              ]}
            />
            <Bar dataKey="avgPnL" fill="#0075FF" name="Avg P&L" radius={[8, 8, 0, 0]} />
            <Bar dataKey="winRate" fill="#00C9FF" name="Win Rate" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}