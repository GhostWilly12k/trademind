import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, AlertCircle } from "lucide-react";

const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(15, 18, 59, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' }}>
        <p className="text-sm font-bold text-white mb-1">{payload[0].payload.name}</p>
        <p className={`text-lg font-bold ${payload[0].value >= 0 ? 'text-[#00C9FF]' : 'text-rose-400'}`}>
          ${payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export default function BehavioralAnalytics({ trades = [] }) {
  const { costData, costOfMistakes, disciplineData, disciplineScore } = React.useMemo(() => {
    // Identify mistakes: impulsive, greedy, fearful emotions OR is_mistake flag OR poor setup
    const mistakeTrades = trades.filter(t => 
      t.is_mistake || 
      ['impulsive', 'greedy', 'fearful'].includes(t.emotion) ||
      t.setup_quality === 'poor'
    );
    
    const planTrades = trades.filter(t => 
      !t.is_mistake && 
      !['impulsive', 'greedy', 'fearful'].includes(t.emotion) &&
      t.setup_quality !== 'poor'
    );

    const actualPnL = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const mistakePnL = mistakeTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const theoreticalPnL = actualPnL - mistakePnL;
    const costDelta = theoreticalPnL - actualPnL;

    const barData = [
      { name: 'Theoretical P&L', value: theoreticalPnL, fill: '#00C9FF' },
      { name: 'Actual P&L', value: actualPnL, fill: actualPnL >= 0 ? '#0075FF' : '#ef4444' }
    ];

    // Discipline calculation
    const disciplinedCount = planTrades.length;
    const impulsiveCount = mistakeTrades.length;
    const total = trades.length;
    const score = total > 0 ? (disciplinedCount / total) * 100 : 100;

    const pieData = [
      { name: 'Plan Trades', value: disciplinedCount, color: '#00C9FF' },
      { name: 'Impulse/Tilt', value: impulsiveCount, color: '#ef4444' }
    ];

    return {
      costData: barData,
      costOfMistakes: Math.abs(costDelta),
      disciplineData: pieData,
      disciplineScore: score
    };
  }, [trades]);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost of Mistakes */}
        <Card className="glass-card border-none">
          <CardHeader className="border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white">Cost of Mistakes</CardTitle>
                <p className="text-sm text-[#A0AEC0] mt-1">Impact of emotional & rule-breaking trades</p>
              </div>
              <UITooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-[#A0AEC0] hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="glass-card border-white/20 text-white max-w-xs">
                  <p>Compares your actual P&L vs theoretical P&L if mistake trades were excluded.</p>
                </TooltipContent>
              </UITooltip>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* FIX: Explicit wrapper div with fixed height handles the chart sizing */}
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    stroke="#A0AEC0"
                    axisLine={false}
                    tickLine={false}
                    style={{ fontSize: '11px', fontWeight: 600 }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#A0AEC0"
                    axisLine={false}
                    tickLine={false}
                    style={{ fontSize: '11px', fontWeight: 600 }}
                    width={100}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={35}>
                    {costData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {costOfMistakes > 0 && (
                <div className="absolute bottom-0 right-0 p-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-yellow-500">Cost of Errors</p>
                    <p className="text-lg font-bold text-yellow-400">${costOfMistakes.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Discipline Score */}
        <Card className="glass-card border-none">
          <CardHeader className="border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white">Discipline Score</CardTitle>
                <p className="text-sm text-[#A0AEC0] mt-1">Plan adherence vs impulsive trades</p>
              </div>
              <UITooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-[#A0AEC0] hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="glass-card border-white/20 text-white max-w-xs">
                  <p>Percentage of trades that followed your trading plan vs emotional/impulsive trades.</p>
                </TooltipContent>
              </UITooltip>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center">
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={disciplineData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {disciplineData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        style={{ filter: `drop-shadow(0 0 8px ${entry.color}40)` }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${disciplineScore >= 80 ? 'text-[#00C9FF]' : disciplineScore >= 60 ? 'text-yellow-400' : 'text-rose-400'}`}>
                  {disciplineScore.toFixed(0)}%
                </span>
                <span className="text-xs text-[#A0AEC0]">Disciplined</span>
              </div>
            </div>

            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00C9FF]" />
                <span className="text-sm text-[#A0AEC0]">Plan Trades ({disciplineData[0].value})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-[#A0AEC0]">Impulse/Tilt ({disciplineData[1].value})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}