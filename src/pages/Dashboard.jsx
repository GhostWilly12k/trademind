import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, Target, TrendingUp, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/api/supabaseClient";

import MetricCard from "../components/dashboard/MetricCard";
import RecentTradesTable from "../components/dashboard/RecentTradesTable";
import EquityCurveChart from "../components/dashboard/EquityCurveChart";

export default function Dashboard() {
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: () => api.entities.trade.list(),
  });

  const metrics = useMemo(() => {
    if (!trades.length) return {
      totalPnL: 0, winRate: 0, totalTrades: 0, profitFactor: 0,
      pnlChange: 0, winRateChange: 0, tradesChange: 0, pfChange: 0
    };

    // 1. Sort trades descending (newest first)
    const sortedTrades = [...trades].sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));

    // 2. Define Time Windows (30 days)
    const now = new Date();
    const periodLength = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
    const currentPeriodStart = new Date(now.getTime() - periodLength);
    const prevPeriodStart = new Date(now.getTime() - (periodLength * 2));

    // 3. Helper to calculate stats for a subset
    const getStats = (subset) => {
        if (!subset.length) return { pnl: 0, winRate: 0, count: 0, pf: 0 };
        
        const wins = subset.filter(t => (t.profit_loss || 0) > 0);
        const losses = subset.filter(t => (t.profit_loss || 0) < 0);
        const totalPnL = subset.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
        const winRate = (wins.length / subset.length) * 100;
        
        const grossProfit = wins.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
        const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.profit_loss || 0), 0));
        const pf = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;

        return { pnl: totalPnL, winRate, count: subset.length, pf };
    };

    // 4. Split Data
    const currentTrades = sortedTrades.filter(t => new Date(t.entry_date) >= currentPeriodStart);
    const prevTrades = sortedTrades.filter(t => {
        const d = new Date(t.entry_date);
        return d >= prevPeriodStart && d < currentPeriodStart;
    });

    const currentStats = getStats(currentTrades);
    const prevStats = getStats(prevTrades);
    const allTimeStats = getStats(sortedTrades);

    // 5. Calculate Percentage Changes (Current vs Previous)
    const calcChange = (curr, prev) => {
        if (prev === 0) return curr === 0 ? 0 : 100; // If prev was 0, any growth is 100%
        return ((curr - prev) / Math.abs(prev)) * 100;
    };

    return {
        // Main Display Values (All Time)
        totalPnL: allTimeStats.pnl,
        winRate: allTimeStats.winRate,
        totalTrades: allTimeStats.count,
        profitFactor: allTimeStats.pf,

        // Change Indicators (Last 30 Days vs Prior 30 Days)
        pnlChange: calcChange(currentStats.pnl, prevStats.pnl),
        // For Win Rate, we typically show absolute difference (e.g. +5%), not percent change
        winRateChange: currentStats.winRate - prevStats.winRate, 
        tradesChange: calcChange(currentStats.count, prevStats.count),
        pfChange: currentStats.pf - prevStats.pf // Absolute diff for PF is usually cleaner
    };
  }, [trades]);

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-12 w-64 bg-[#1A1A1A]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 bg-[#1A1A1A]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Trading Dashboard
          </h1>
          <p className="text-[#A0AEC0] font-medium">Track your performance and identify opportunities</p>
        </div>
        <Link to="/tradelog">
          <Button className="font-bold text-white transition-all duration-300 group" style={{ background: 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)', borderRadius: '12px', padding: '12px 24px', boxShadow: '0 8px 24px rgba(0, 117, 255, 0.4)' }}>
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Log New Trade
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total P&L"
          value={metrics.totalPnL.toFixed(2)}
          change={metrics.pnlChange}
          icon={DollarSign}
          isPositive={metrics.pnlChange >= 0} 
          format="currency"
        />
        <MetricCard
          title="Win Rate"
          value={metrics.winRate.toFixed(1)}
          change={metrics.winRateChange}
          icon={Target}
          isPositive={metrics.winRateChange >= 0}
          format="percentage"
        />
        <MetricCard
          title="Total Trades"
          value={metrics.totalTrades}
          change={metrics.tradesChange} // Growth in volume
          icon={TrendingUp}
          isPositive={metrics.tradesChange >= 0}
        />
        <MetricCard
          title="Profit Factor"
          value={metrics.profitFactor.toFixed(2)}
          change={metrics.pfChange}
          icon={Award}
          isPositive={metrics.pfChange >= 0}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <EquityCurveChart trades={trades} />
        <RecentTradesTable trades={trades} />
      </div>
    </div>
  );
}