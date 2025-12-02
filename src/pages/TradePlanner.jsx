import React, { useState, useMemo } from "react";
import { api } from "@/api/supabaseClient";
import { MarketDataService } from "@/api/marketData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, BrainCircuit, Target, AlertTriangle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import PlanCard from "../components/watchlist/PlanCard"; // Renamed
import PlanForm from "../components/watchlist/PlanForm"; // Renamed

export default function TradePlanner() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showHighConvictionOnly, setShowHighConvictionOnly] = useState(false);

  const queryClient = useQueryClient();

  // 1. Fetch Plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => api.entities.watchlist.list(),
  });

  // 2. Poll Live Data (For "Distance to Entry" calculations)
  const symbols = useMemo(() => plans.map(p => p.symbol).filter(Boolean), [plans]);
  const { data: marketData } = useQuery({
    queryKey: ['marketData', symbols],
    queryFn: () => MarketDataService.getQuotes(symbols),
    enabled: symbols.length > 0,
    refetchInterval: 90000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.watchlist.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['watchlist'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.watchlist.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['watchlist'] }); setShowForm(false); setEditingItem(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.watchlist.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  // 3. Discipline Stats Logic
  const stats = useMemo(() => {
    let pendingR = 0;
    let highConviction = 0;
    let readyCount = 0;

    plans.forEach(plan => {
      // Calculate Total R-Multiple currently staged
      if (plan.take_profit && plan.stop_loss && plan.trigger_price) {
        const risk = Math.abs(plan.trigger_price - plan.stop_loss);
        const reward = Math.abs(plan.take_profit - plan.trigger_price);
        if (risk > 0) pendingR += (reward / risk);
      }
      
      // Count High Conviction
      if (plan.conviction >= 4) highConviction++;

      // Count "Ready to Execute" (Price is within 0.5% of entry)
      const current = marketData?.[plan.symbol]?.price || plan.current_price;
      if (current && plan.trigger_price) {
        const dist = Math.abs((current - plan.trigger_price) / plan.trigger_price * 100);
        if (dist < 0.5) readyCount++;
      }
    });

    return { pendingR: pendingR.toFixed(1), highConviction, readyCount };
  }, [plans, marketData]);

  // Filters
  const filteredPlans = plans.filter(item => {
    const matchesSearch = item.symbol?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesConviction = showHighConvictionOnly ? item.conviction >= 4 : true;
    return matchesSearch && matchesConviction;
  });

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="w-full max-w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pt-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
              <BrainCircuit className="text-[#00C9FF] w-8 h-8" />
              Trade Planner
            </h1>
            <p className="text-[#A0AEC0] font-medium">
              Staging area. Don't trade price action—trade your plans.
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="font-bold text-white transition-all duration-300"
            style={{ 
              background: 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)', 
              borderRadius: '12px', 
              padding: '12px 24px', 
              boxShadow: '0 8px 24px rgba(0, 117, 255, 0.4)' 
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Stage New Plan
          </Button>
        </div>

        {/* Stats Bar - Discipline Focused */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 rounded-xl border-l-4 border-blue-500">
            <p className="text-[#A0AEC0] text-sm">Staged Plans</p>
            <p className="text-2xl font-bold text-white">{plans.length}</p>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-emerald-500">
            <p className="text-[#A0AEC0] text-sm">Potential R</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.pendingR}R</p>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-purple-500">
            <p className="text-[#A0AEC0] text-sm">High Conviction</p>
            <p className="text-2xl font-bold text-purple-400">{stats.highConviction}</p>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-yellow-500">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <p className="text-[#A0AEC0] text-sm">Ready to Fire</p>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats.readyCount}</p>
          </div>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <PlanForm
                onSubmit={(data) => editingItem ? updateMutation.mutate({id: editingItem.id, data}) : createMutation.mutate(data)}
                onCancel={() => { setShowForm(false); setEditingItem(null); }}
                initialData={editingItem}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Symbol or Thesis..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-[#A0AEC0]"
            />
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowHighConvictionOnly(!showHighConvictionOnly)}
            className={`text-[#A0AEC0] hover:text-white ${showHighConvictionOnly ? 'bg-white/10 text-purple-400' : ''}`}
          >
            <Target className="w-4 h-4 mr-2" />
            {showHighConvictionOnly ? 'Top Ideas Only' : 'All Plans'}
          </Button>
        </div>

        {/* Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                livePrice={marketData?.[plan.symbol]?.price}
                onEdit={(item) => { setEditingItem(item); setShowForm(true); }}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredPlans.length === 0 && !isLoading && (
          <div className="text-center py-16 glass-card rounded-2xl">
            <BrainCircuit className="w-16 h-16 text-[#A0AEC0] mx-auto mb-4 opacity-50" />
            <p className="text-xl font-semibold text-white mb-2">No plans staged</p>
            <p className="text-[#A0AEC0] mb-6">Discipline starts with preparation. Stage your first trade.</p>
            <Button
              onClick={() => setShowForm(true)}
              className="font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Stage New Plan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}