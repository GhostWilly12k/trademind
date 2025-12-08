import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Loader2,
  Play,
  HelpCircle,
  Zap,
  RotateCcw
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { SimulationService } from "@/api/simulationService";
import { Label } from "@/components/ui/label";

const COLORS = {
  best: "#22c55e",   // Green
  median: "#3b82f6", // Blue
  worst: "#ef4444"   // Red
};

// Simulation Result Card
function ResultCard({ label, value, subtext, color, icon: Icon }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 text-center border border-white/5">
      <div className="flex items-center justify-center gap-2 mb-1">
        {Icon && <Icon className={`w-4 h-4 ${color}`} />}
        <p className="text-xs text-[#A0AEC0] uppercase font-bold tracking-wider">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtext && <p className="text-xs text-[#A0AEC0] mt-1">{subtext}</p>}
    </div>
  );
}

export default function PredictiveModel() {
  // Default Params (Matches Python Backend Requirements)
  const [params, setParams] = useState({
    starting_equity: 10000,
    win_rate: 55,       // %
    avg_win: 200,       // $
    avg_loss: 100,      // $
    risk_per_trade: 2.0, // %
    num_trades: 50,
    num_simulations: 1000
  });

  const [results, setResults] = useState(null);

  // Connect to Python Backend
  const mutation = useMutation({
    mutationFn: (data) => SimulationService.runSimulation(data),
    onSuccess: (data) => setResults(data),
    onError: (err) => console.error("Sim Failed", err)
  });

  const runSimulation = () => {
    mutation.mutate(params);
  };

  // Run once on mount
  useEffect(() => {
    runSimulation();
  }, []);

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  // Transform Python Data for Recharts
  const chartData = useMemo(() => {
    if (!results?.chart_data) return [];
    const { best_case, median_case, worst_case } = results.chart_data;
    
    // Map arrays to objects
    return median_case.map((val, i) => ({
      trade: i,
      median: val,
      best: best_case[i],
      worst: worst_case[i]
    }));
  }, [results]);

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F123B]/95 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md">
          <p className="text-white font-bold mb-2">Trade #{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-400">Best Case: ${payload[0].value.toLocaleString()}</p>
            <p className="text-blue-400">Median: ${payload[1].value.toLocaleString()}</p>
            <p className="text-red-400">Worst Case: ${payload[2].value.toLocaleString()}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <TooltipProvider>
      <Card className="glass-card border-none">
        <CardHeader className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                <Brain className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">Simulation Sandbox</CardTitle>
                <p className="text-sm text-[#A0AEC0]">Monte Carlo prediction engine (Python Core)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                The Quant Agent
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 1. CONTROLS SIDEBAR */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Win Rate Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-white">Win Rate</label>
                  <span className="text-sm font-bold text-[#00C9FF]">{params.win_rate}%</span>
                </div>
                <Slider
                  value={[params.win_rate]}
                  onValueChange={(v) => updateParam("win_rate", v[0])}
                  min={10}
                  max={90}
                  step={1}
                  className="cursor-pointer"
                />
              </div>

              {/* Risk Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-white">Risk Per Trade</label>
                  <span className="text-sm font-bold text-rose-400">{params.risk_per_trade}%</span>
                </div>
                <Slider
                  value={[params.risk_per_trade]}
                  onValueChange={(v) => updateParam("risk_per_trade", v[0])}
                  min={0.1}
                  max={10.0}
                  step={0.1}
                  className="cursor-pointer"
                />
              </div>

              {/* Advanced Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-[#A0AEC0]">Avg Win ($)</Label>
                  <input 
                    type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    value={params.avg_win}
                    onChange={(e) => updateParam("avg_win", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#A0AEC0]">Avg Loss ($)</Label>
                  <input 
                    type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    value={params.avg_loss}
                    onChange={(e) => updateParam("avg_loss", Number(e.target.value))}
                  />
                </div>
              </div>

              <Button
                onClick={runSimulation}
                disabled={mutation.isPending}
                className="w-full font-bold text-white h-12"
                style={{ background: 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)', borderRadius: '12px' }}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Crunching Numbers...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run 1000 Simulations
                  </>
                )}
              </Button>
            </div>

            {/* 2. RESULTS & CHART */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                {results ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <ResultCard
                        label="Risk of Ruin"
                        value={`${results.metrics.risk_of_ruin}%`}
                        color={results.metrics.risk_of_ruin > 1 ? 'text-rose-400' : 'text-[#00C9FF]'}
                        icon={AlertTriangle}
                        subtext="Chance of losing 50%"
                      />
                      <ResultCard
                        label="Expected Equity"
                        value={`$${results.metrics.median_equity.toLocaleString()}`}
                        color="text-blue-400"
                        icon={Target}
                        subtext="Median Outcome"
                      />
                      <ResultCard
                        label="Max Potential"
                        value={`$${results.metrics.max_equity.toLocaleString()}`}
                        color="text-green-400"
                        icon={Zap}
                        subtext="Best Case Scenario"
                      />
                    </div>

                    {/* Chart Container */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS.median} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={COLORS.median} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis 
                            dataKey="trade" 
                            stroke="#A0AEC0" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            minTickGap={20}
                          />
                          <YAxis 
                            stroke="#A0AEC0" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(val) => `$${val/1000}k`}
                            width={40}
                          />
                          <RechartsTooltip content={<CustomChartTooltip />} />
                          
                          {/* Cone of Uncertainty */}
                          <Area 
                            type="monotone" 
                            dataKey="best" 
                            stroke={COLORS.best} 
                            fillOpacity={0} 
                            strokeWidth={1}
                            strokeDasharray="4 4"
                            name="Best Case"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="worst" 
                            stroke={COLORS.worst} 
                            fillOpacity={0} 
                            strokeWidth={1}
                            strokeDasharray="4 4"
                            name="Worst Case"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="median" 
                            stroke={COLORS.median} 
                            fill="url(#splitColor)" 
                            strokeWidth={3}
                            name="Median"
                          />
                          
                          {/* Starting Equity Line */}
                          <ReferenceLine y={params.starting_equity} stroke="#666" strokeDasharray="3 3" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-50">
                    <Brain className="w-16 h-16 text-[#A0AEC0] mb-4" />
                    <p className="text-[#A0AEC0]">Ready to simulate</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}