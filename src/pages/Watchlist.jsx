import React, { useState, useMemo } from "react";
import { api } from "@/api/supabaseClient";
import { MarketDataService } from "@/api/marketData"; // <-- Import Service
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  List,
  AlertTriangle
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import WatchlistCard from "../components/watchlist/WatchlistCard";
import WatchlistForm from "../components/watchlist/WatchlistForm";

export default function Watchlist() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const queryClient = useQueryClient();

  // 1. Fetch Watchlist Items
  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => api.entities.watchlist.list(),
  });

  // 2. Extract Symbols for Market Data
  const symbols = useMemo(() => {
    return watchlist.map(item => item.symbol).filter(Boolean);
  }, [watchlist]);

  // 3. Poll Market Data (Every 5s)
  const { data: marketData } = useQuery({
    queryKey: ['marketData', symbols],
    queryFn: () => MarketDataService.getQuotes(symbols),
    enabled: symbols.length > 0,
    refetchInterval: 5000, // Live ticks every 5s
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.watchlist.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.watchlist.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.watchlist.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleToggleAlert = (item) => {
    updateMutation.mutate({
      id: item.id,
      data: { ...item, alert_active: !item.alert_active }
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  // Filter watchlist
  const filteredWatchlist = watchlist.filter((item) => {
    const matchesSearch = item.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDirection = directionFilter === "all" || item.direction === directionFilter;
    const matchesActive = showInactive || item.is_active !== false;
    return matchesSearch && matchesDirection && matchesActive;
  });

  // Stats (Using live data if available, falling back to manual entry)
  const longCount = watchlist.filter(w => w.direction === "long" && w.is_active !== false).length;
  const shortCount = watchlist.filter(w => w.direction === "short" && w.is_active !== false).length;
  const nearTriggerCount = watchlist.filter(w => {
    if (!w.trigger_price) return false;
    // Use live price if available, otherwise manual price
    const current = marketData?.[w.symbol]?.price || w.current_price;
    if (!current) return false;
    
    const dist = Math.abs((w.trigger_price - current) / current * 100);
    return dist < 1;
  }).length;

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="w-full max-w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pt-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
              Watchlist
            </h1>
            <p className="text-[#A0AEC0] font-medium">
              Pre-trade staging area — plan before you execute
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
            Add Symbol
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 rounded-xl">
            <p className="text-[#A0AEC0] text-sm">Total Watching</p>
            <p className="text-2xl font-bold text-white">{watchlist.length}</p>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-emerald-400" />
              <p className="text-[#A0AEC0] text-sm">Long Setups</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{longCount}</p>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-rose-400" />
              <p className="text-[#A0AEC0] text-sm">Short Setups</p>
            </div>
            <p className="text-2xl font-bold text-rose-400">{shortCount}</p>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <p className="text-[#A0AEC0] text-sm">Near Trigger</p>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{nearTriggerCount}</p>
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
              <WatchlistForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
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
              placeholder="Search symbols..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-[#A0AEC0]"
            />
          </div>
          <Select value={directionFilter} onValueChange={setDirectionFilter}>
            <SelectTrigger className="w-full md:w-40 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1f4d] border-white/10">
              <SelectItem value="all" className="text-white hover:bg-white/10">All Directions</SelectItem>
              <SelectItem value="long" className="text-white hover:bg-white/10">Long Only</SelectItem>
              <SelectItem value="short" className="text-white hover:bg-white/10">Short Only</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            onClick={() => setShowInactive(!showInactive)}
            className={`text-[#A0AEC0] hover:text-white ${showInactive ? 'bg-white/10' : ''}`}
          >
            {showInactive ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {showInactive ? 'Showing All' : 'Active Only'}
          </Button>
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-white/10 text-white" : "text-[#A0AEC0]"}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-white/10 text-white" : "text-[#A0AEC0]"}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Watchlist Grid */}
        <div className={`grid gap-6 ${viewMode === "grid" ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          <AnimatePresence>
            {filteredWatchlist.map((item) => (
              <WatchlistCard
                key={item.id}
                item={item}
                // FIX: Pass live quote if available
                quote={marketData?.[item.symbol]}
                onEdit={handleEdit}
                onDelete={deleteMutation.mutate}
                onToggleAlert={handleToggleAlert}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredWatchlist.length === 0 && !isLoading && (
          <div className="text-center py-16 glass-card rounded-2xl">
            <Eye className="w-16 h-16 text-[#A0AEC0] mx-auto mb-4 opacity-50" />
            <p className="text-xl font-semibold text-white mb-2">No symbols in watchlist</p>
            <p className="text-[#A0AEC0] mb-6">Start adding symbols to track potential trades</p>
            <Button
              onClick={() => setShowForm(true)}
              className="font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Symbol
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}