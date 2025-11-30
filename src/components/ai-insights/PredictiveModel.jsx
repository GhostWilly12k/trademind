import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Loader2,
  Play,
  RefreshCw,
  HelpCircle,
  Zap
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

// Monte Carlo Histogram
function SimulationHistogram({ distribution }) {
  if (!distribution || distribution.length === 0) return null;
  
  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={distribution} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <XAxis 
          dataKey="range" 
          tick={{ fill: '#A0AEC0', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {distribution.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.range?.includes('-') ? '#ef4444' : '#00C9FF'}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Simulation Result Card
function ResultCard({ label, value, subtext, color, icon: Icon }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 text-center">
      <div className="flex items-center justify-center gap-2 mb-1">
        {Icon && <Icon className={`w-4 h-4 ${color}`} />}
        <p className="text-xs text-[#A0AEC0]">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtext && <p className="text-xs text-[#A0AEC0] mt-1">{subtext}</p>}
    </div>
  );
}

export default function PredictiveModel({ predictions, onRunSimulation }) {
  const [volatilityMultiplier, setVolatilityMultiplier] = useState([1.0]);
  const [stopLossWidth, setStopLossWidth] = useState([2.0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationResults, setSimulationResults] = useState(null);

  // Simulated Monte Carlo (in production, this streams from the Quant agent)
  const runSimulation = async () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    
    // Simulate streaming progress
    const interval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    // Simulate 1000 iterations result
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const baseWinRate = 0.55;
    const volAdjustment = (volatilityMultiplier[0] - 1) * -0.1;
    const slAdjustment = (stopLossWidth[0] - 2) * 0.02;
    const adjustedWinRate = Math.min(0.85, Math.max(0.25, baseWinRate + volAdjustment + slAdjustment));

    setSimulationResults({
      win_probability: adjustedWinRate * 100,
      expected_value: (adjustedWinRate * 150 - (1 - adjustedWinRate) * 100).toFixed(2),
      risk_of_ruin: Math.max(0.5, (1 - adjustedWinRate) * 20).toFixed(1),
      kelly_size: (adjustedWinRate - (1 - adjustedWinRate) / 1.5).toFixed(2),
      iterations: 1000,
      distribution: [
        { range: '-50%', count: Math.floor((1 - adjustedWinRate) * 150) },
        { range: '-25%', count: Math.floor((1 - adjustedWinRate) * 200) },
        { range: '0%', count: 100 },
        { range: '+25%', count: Math.floor(adjustedWinRate * 200) },
        { range: '+50%', count: Math.floor(adjustedWinRate * 150) },
        { range: '+100%', count: Math.floor(adjustedWinRate * 80) },
      ]
    });
    
    clearInterval(interval);
    setSimulationProgress(100);
    setIsSimulating(false);
    
    onRunSimulation?.({
      volatility: volatilityMultiplier[0],
      stopLoss: stopLossWidth[0]
    });
  };

  // Auto-run when sliders change
  useEffect(() => {
    if (simulationResults) {
      const debounce = setTimeout(() => {
        runSimulation();
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [volatilityMultiplier[0], stopLossWidth[0]]);

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
                <p className="text-sm text-[#A0AEC0]">Monte Carlo prediction engine</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                The Quant Agent
              </Badge>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-[#A0AEC0]" />
                </TooltipTrigger>
                <TooltipContent className="glass-card border-white/20 text-white max-w-xs">
                  <p>Runs 1000 Monte Carlo simulations using Geometric Brownian Motion. Adjust parameters to see how outcomes change.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-white">Volatility Multiplier</label>
                  <span className="text-sm font-bold text-[#00C9FF]">{volatilityMultiplier[0].toFixed(1)}x</span>
                </div>
                <Slider
                  value={volatilityMultiplier}
                  onValueChange={setVolatilityMultiplier}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[#A0AEC0] mt-1">
                  <span>Low (0.5x)</span>
                  <span>High (2.0x)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-white">Stop Loss Width</label>
                  <span className="text-sm font-bold text-rose-400">{stopLossWidth[0].toFixed(1)}%</span>
                </div>
                <Slider
                  value={stopLossWidth}
                  onValueChange={setStopLossWidth}
                  min={0.5}
                  max={5.0}
                  step={0.25}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[#A0AEC0] mt-1">
                  <span>Tight (0.5%)</span>
                  <span>Wide (5.0%)</span>
                </div>
              </div>

              <Button
                onClick={runSimulation}
                disabled={isSimulating}
                className="w-full font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)', borderRadius: '12px' }}
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running {Math.min(100, Math.floor(simulationProgress))}% ({Math.floor(simulationProgress * 10)} iterations)
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run 1000 Simulations
                  </>
                )}
              </Button>

              {isSimulating && (
                <Progress value={simulationProgress} className="h-2" />
              )}
            </div>

            {/* Results */}
            <div>
              <AnimatePresence mode="wait">
                {simulationResults ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <ResultCard
                        label="Win Probability"
                        value={`${simulationResults.win_probability.toFixed(1)}%`}
                        color={simulationResults.win_probability >= 55 ? 'text-[#00C9FF]' : 'text-rose-400'}
                        icon={Target}
                      />
                      <ResultCard
                        label="Expected Value"
                        value={`$${simulationResults.expected_value}`}
                        color={parseFloat(simulationResults.expected_value) >= 0 ? 'text-[#00C9FF]' : 'text-rose-400'}
                        icon={TrendingUp}
                      />
                      <ResultCard
                        label="Risk of Ruin"
                        value={`${simulationResults.risk_of_ruin}%`}
                        color={parseFloat(simulationResults.risk_of_ruin) <= 5 ? 'text-[#00C9FF]' : 'text-rose-400'}
                        icon={AlertTriangle}
                      />
                      <ResultCard
                        label="Kelly Size"
                        value={`${(parseFloat(simulationResults.kelly_size) * 100).toFixed(0)}%`}
                        subtext="of capital"
                        color="text-purple-400"
                        icon={Zap}
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-xs text-[#A0AEC0] mb-2">Outcome Distribution (1000 iterations)</p>
                      <SimulationHistogram distribution={simulationResults.distribution} />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center p-8"
                  >
                    <Brain className="w-16 h-16 text-[#A0AEC0] mb-4 opacity-50" />
                    <p className="text-[#A0AEC0]">Adjust parameters and run simulation</p>
                    <p className="text-xs text-[#A0AEC0]/70 mt-1">The Quant Agent will model 1000 possible outcomes</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Market Outlook from predictions prop */}
          {predictions?.market_outlook && (
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-yellow-400" />
                <p className="text-sm font-semibold text-white">Market Outlook</p>
                <Badge className={`ml-auto ${predictions.market_sentiment === 'bullish' ? 'bg-[#00C9FF]/20 text-[#00C9FF]' : predictions.market_sentiment === 'bearish' ? 'bg-rose-500/20 text-rose-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {predictions.market_sentiment}
                </Badge>
              </div>
              <p className="text-sm text-[#A0AEC0]">{predictions.market_outlook}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}