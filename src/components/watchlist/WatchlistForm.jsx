import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Star, ArrowUp, ArrowDown, Search, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MarketDataService } from "@/api/marketData";

const assetTypes = [
  { value: "stock", label: "Stock" },
  { value: "crypto", label: "Crypto" },
  { value: "forex", label: "Forex" },
  { value: "commodity", label: "Commodity" },
  { value: "index", label: "Index" },
  { value: "etf", label: "ETF" },
];

const setupTypes = [
  "Breakout", "Bull Flag", "Bear Flag", "Support Bounce", "Resistance Rejection",
  "Earnings Play", "Gap Fill", "Trend Continuation", "Reversal", "Range Trade"
];

// Helper: Convert string input to DB-safe number or null (prevents NaN)
const safeFloat = (val) => {
  if (val === "" || val === null || val === undefined) return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

// Helper: Convert DB nulls to empty strings for Inputs
const safeString = (val) => (val === null || val === undefined ? "" : val);

export default function WatchlistForm({ onSubmit, onCancel, initialData }) {
  const [formData, setFormData] = useState({
    symbol: "",
    company_name: "",
    asset_type: "stock",
    direction: "long",
    setup_type: "",
    conviction: 3,
    trigger_price: "",
    stop_loss: "",
    take_profit: "",
    current_price: "",
    price_change_percent: "",
    thesis: "",
    chart_url: "",
    alert_active: true,
    is_active: true,
  });

  const [errors, setErrors] = useState({});
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
        // Normalize numbers to strings for inputs
        trigger_price: safeString(initialData.trigger_price),
        stop_loss: safeString(initialData.stop_loss),
        take_profit: safeString(initialData.take_profit),
        current_price: safeString(initialData.current_price),
        price_change_percent: safeString(initialData.price_change_percent),
      });
      setSearchQuery(initialData.symbol || "");
    }
  }, [initialData]);

  // Debounced Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 1 && !initialData) { 
        setIsSearching(true);
        try {
          const results = await MarketDataService.searchSymbols(searchQuery);
          setSearchResults(results);
          setShowResults(results.length > 0);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, initialData]);

  const handleSelectSymbol = async (result) => {
    let type = "stock";
    if (result.type?.includes("Crypto")) type = "crypto";
    if (result.type?.includes("Forex")) type = "forex";
    if (result.type?.includes("ETF")) type = "etf";

    // 1. Update Basic Info Immediately
    setFormData(prev => ({
      ...prev,
      symbol: result.symbol,
      company_name: result.description,
      asset_type: type
    }));
    setSearchQuery(result.symbol);
    setShowResults(false);
    if (errors.symbol) setErrors(prev => ({ ...prev, symbol: null }));

    // 2. Auto-Fetch Current Price
    try {
      const quotes = await MarketDataService.getQuotes([result.symbol]);
      const quote = quotes[result.symbol];
      
      if (quote && quote.price) {
        // Use functional update to ensure we don't overwrite state if user typed fast
        setFormData(prev => ({
          ...prev,
          current_price: quote.price, 
          price_change_percent: quote.changePercent
        }));
      }
    } catch (error) {
      console.warn("Could not auto-fetch price for symbol:", result.symbol);
    }
  };

  const validate = () => {
    const newErrors = {};
    const symbol = formData.symbol || searchQuery.toUpperCase();
    
    if (!symbol || symbol.trim() === "") newErrors.symbol = "Symbol is required";
    if (!formData.direction) newErrors.direction = "Direction is required";
    
    // Logic Check: Ensure prices are positive if entered
    if (formData.trigger_price && parseFloat(formData.trigger_price) < 0) newErrors.trigger_price = "Price must be positive";
    if (formData.stop_loss && parseFloat(formData.stop_loss) < 0) newErrors.stop_loss = "Price must be positive";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const finalSymbol = formData.symbol || searchQuery.toUpperCase();
    
    // Clean Payload for Database
    const submitData = {
      ...formData,
      symbol: finalSymbol,
      // Ensure strict types (Numbers or Nulls)
      trigger_price: safeFloat(formData.trigger_price),
      stop_loss: safeFloat(formData.stop_loss),
      take_profit: safeFloat(formData.take_profit),
      current_price: safeFloat(formData.current_price),
      price_change_percent: safeFloat(formData.price_change_percent),
      // Ensure integers
      conviction: parseInt(formData.conviction, 10) || 3,
    };

    onSubmit(submitData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErr = { ...prev };
        delete newErr[field];
        return newErr;
      });
    }
  };

  // R:R Calculation (Safe)
  const entry = safeFloat(formData.trigger_price);
  const stop = safeFloat(formData.stop_loss);
  const target = safeFloat(formData.take_profit);
  
  let riskReward = null;
  if (entry && stop && target && entry !== stop) {
     riskReward = Math.abs((target - entry) / (entry - stop));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="glass-card border-none">
        <CardHeader className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white">
              {initialData ? 'Edit Watchlist Item' : 'Add to Watchlist'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel} className="text-[#A0AEC0] hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* --- SMART SEARCH ROW --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 relative">
                <Label className="text-white">Symbol Search *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#A0AEC0]" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value.toUpperCase());
                      handleChange("symbol", e.target.value.toUpperCase());
                    }}
                    placeholder="Type to search (e.g. AAPL)"
                    className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-[#A0AEC0] focus:border-[#0075FF] transition-colors ${errors.symbol ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    autoComplete="off"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 text-[#0075FF] animate-spin" />
                    </div>
                  )}
                </div>
                {errors.symbol && <p className="text-xs text-red-400 mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> {errors.symbol}</p>}

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {showResults && searchResults.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute z-50 w-full mt-2 bg-[#0F123B] border border-white/10 rounded-lg shadow-2xl overflow-hidden max-h-60 overflow-y-auto backdrop-blur-xl"
                    >
                      {searchResults.map((result) => (
                        <div
                          key={result.symbol}
                          onClick={() => handleSelectSymbol(result)}
                          className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-none group"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white group-hover:text-[#00C9FF]">{result.symbol}</span>
                            <span className="text-xs text-[#A0AEC0] bg-white/5 px-2 py-0.5 rounded">{result.type}</span>
                          </div>
                          <p className="text-xs text-[#A0AEC0] truncate">{result.description}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Company Name</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  placeholder="Auto-filled..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-[#A0AEC0]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Asset Type</Label>
                <Select value={formData.asset_type} onValueChange={(v) => handleChange("asset_type", v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f4d] border-white/10">
                    {assetTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-white hover:bg-white/10">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* --- STRATEGY & DIRECTION --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Direction *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => handleChange("direction", "long")}
                    className={`flex-1 ${formData.direction === "long" ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-[#A0AEC0] border-white/10'} border`}
                  >
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Long
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleChange("direction", "short")}
                    className={`flex-1 ${formData.direction === "short" ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-white/5 text-[#A0AEC0] border-white/10'} border`}
                  >
                    <ArrowDown className="w-4 h-4 mr-2" />
                    Short
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Setup Type</Label>
                <Select value={formData.setup_type} onValueChange={(v) => handleChange("setup_type", v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select setup..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f4d] border-white/10">
                    {setupTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-white hover:bg-white/10">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Conviction (1-5)</Label>
                <div className="flex gap-1 pt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleChange("conviction", star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= formData.conviction ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* --- PRICE LEVELS --- */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Planning Levels</h3>
                {riskReward !== null && isFinite(riskReward) && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#A0AEC0]">R:R</span>
                    <span className={`text-sm font-bold ${riskReward < 1.5 ? 'text-yellow-400' : 'text-[#00C9FF]'}`}>
                      {riskReward.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#A0AEC0]">Current Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.current_price}
                    onChange={(e) => handleChange("current_price", e.target.value)}
                    placeholder="0.00"
                    className="bg-white/5 border-white/10 text-white placeholder:text-[#A0AEC0]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#00C9FF]">Entry / Trigger</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.trigger_price}
                    onChange={(e) => handleChange("trigger_price", e.target.value)}
                    placeholder="0.00"
                    className={`bg-white/5 border-[#00C9FF]/30 text-white placeholder:text-[#A0AEC0] ${errors.trigger_price ? 'border-red-500' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-rose-400">Stop Loss</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.stop_loss}
                    onChange={(e) => handleChange("stop_loss", e.target.value)}
                    placeholder="0.00"
                    className="bg-white/5 border-rose-500/30 text-white placeholder:text-[#A0AEC0]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-emerald-400">Take Profit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.take_profit}
                    onChange={(e) => handleChange("take_profit", e.target.value)}
                    placeholder="0.00"
                    className="bg-white/5 border-emerald-500/30 text-white placeholder:text-[#A0AEC0]"
                  />
                </div>
              </div>
            </div>

            {/* --- THESIS --- */}
            <div className="space-y-2">
              <Label className="text-white">Thesis & Notes</Label>
              <Textarea
                value={formData.thesis}
                onChange={(e) => handleChange("thesis", e.target.value)}
                placeholder="Why are we taking this trade? What is the invalidation point?"
                className="bg-white/5 border-white/10 text-white placeholder:text-[#A0AEC0] min-h-[80px]"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={onCancel} className="text-[#A0AEC0] hover:text-white">
                Cancel
              </Button>
              <Button
                type="submit"
                className="font-bold text-white px-8"
                style={{ background: 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)' }}
              >
                {initialData ? 'Update Plan' : 'Add to Watchlist'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}