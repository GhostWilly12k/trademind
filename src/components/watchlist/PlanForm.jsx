import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, X, ArrowRight, Activity, Loader2, Search } from "lucide-react";
// FIX: Use relative path to avoid alias resolution issues in some build environments
import { MarketDataService } from "../../api/marketData";
import { motion, AnimatePresence } from "framer-motion";

export default function PlanForm({ onSubmit, onCancel, initialData }) {
  const [formData, setFormData] = useState({
    symbol: "",
    direction: "long",
    setup_type: "",
    conviction: 3,
    trigger_price: "",
    stop_loss: "",
    take_profit: "",
    thesis: "",
    ...initialData
  });

  const [rr, setRR] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Search State
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  // 1. R:R Calculation Effect
  useEffect(() => {
    const entry = parseFloat(formData.trigger_price);
    const stop = parseFloat(formData.stop_loss);
    const target = parseFloat(formData.take_profit);

    if (entry && stop && target && entry !== stop) {
      const risk = Math.abs(entry - stop);
      const reward = Math.abs(target - entry);
      setRR((reward / risk).toFixed(2));
    } else {
      setRR(0);
    }
  }, [formData.trigger_price, formData.stop_loss, formData.take_profit]);

  // 2. Search Debounce Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (formData.symbol && formData.symbol.length > 1 && showResults) {
        try {
          const results = await MarketDataService.searchSymbols(formData.symbol);
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.symbol, showResults]);

  // 3. Click Outside to Close Search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  // --- AUTOFILL HANDLER ---
  const handleSelectSymbol = async (item) => {
    // 1. Set Symbol & Close Search
    handleChange("symbol", item.symbol);
    setShowResults(false);
    
    // 2. Fetch Live Price for Autofill
    setLoading(true);
    try {
        const quotes = await MarketDataService.getQuotes([item.symbol]);
        const quote = quotes[item.symbol];
        
        if (quote && quote.price) {
            // Autofill Entry Price if empty or if user explicitly clicked a new symbol
            handleChange("trigger_price", quote.price);
        }
    } catch (e) {
        console.error("Autofill failed", e);
    }
    setLoading(false);
  };

  // --- SUBMISSION HANDLER (SANITIZATION) ---
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Helper: Convert empty strings/NaN to NULL for Database
    const safeFloat = (val) => {
        if (val === "" || val === null || val === undefined) return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
    };

    // Helper: Convert empty text to NULL
    const safeString = (val) => (!val || val.trim() === "") ? null : val.trim();

    // Prepare Payload
    const cleanData = {
        ...formData,
        symbol: formData.symbol.toUpperCase().trim(), // Force Uppercase
        setup_type: safeString(formData.setup_type),
        thesis: safeString(formData.thesis),
        trigger_price: safeFloat(formData.trigger_price),
        stop_loss: safeFloat(formData.stop_loss),
        take_profit: safeFloat(formData.take_profit),
        conviction: parseInt(formData.conviction) || 3,
        // Ensure we don't send ID for creation, but keep it for updates
        ...(initialData?.id ? { id: initialData.id } : {})
    };

    // Validations (Prevent Edge Cases)
    if (!cleanData.symbol) {
        // You could add toast error here
        alert("Symbol is required");
        return;
    }

    if (cleanData.trigger_price === null) {
         // It's okay to save without price, but maybe warn?
         // For now, we allow it to support "Idea generation" phase
    }

    onSubmit(cleanData);
  };

  return (
    <Card className="glass-card border-none overflow-visible">
        <CardHeader className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
               <Activity className="text-[#00C9FF]" />
               {initialData ? "Refine Trade Plan" : "Stage New Plan"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel} className="text-[#A0AEC0] hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Top Row: Symbol Search, Direction, Setup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Symbol Search Input */}
                <div className="space-y-2 relative" ref={searchRef}>
                    <Label className="text-white">Symbol</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#A0AEC0]" />
                        <Input 
                            value={formData.symbol} 
                            onChange={e => {
                                handleChange("symbol", e.target.value.toUpperCase());
                                setShowResults(true);
                            }} 
                            onFocus={() => setShowResults(true)}
                            placeholder="e.g. BTCUSD"
                            className="pl-9 bg-white/5 border-white/10 text-white font-bold placeholder:text-[#A0AEC0]"
                            autoComplete="off"
                        />
                        {loading && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-[#00C9FF]" />}
                    </div>

                    {/* Search Results Dropdown */}
                    <AnimatePresence>
                        {showResults && searchResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute z-50 w-full mt-1 bg-[#0F1218] border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                            >
                                {searchResults.map((item) => (
                                    <div 
                                        key={item.symbol}
                                        className="px-4 py-3 hover:bg-white/10 cursor-pointer flex justify-between items-center transition-colors group"
                                        onClick={() => handleSelectSymbol(item)}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white group-hover:text-[#00C9FF]">{item.symbol}</span>
                                            <span className="text-xs text-[#A0AEC0]">{item.name || item.description}</span>
                                        </div>
                                        <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-[#A0AEC0]">{item.type}</span>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                <div className="space-y-2">
                    <Label className="text-white">Direction</Label>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            onClick={() => handleChange("direction", "long")}
                            className={`flex-1 ${formData.direction === "long" ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-[#A0AEC0] border-white/10'} border`}
                        >
                            Long
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handleChange("direction", "short")}
                            className={`flex-1 ${formData.direction === "short" ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-white/5 text-[#A0AEC0] border-white/10'} border`}
                        >
                            Short
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-white">Setup Pattern</Label>
                    <Input 
                        value={formData.setup_type} 
                        onChange={e => handleChange("setup_type", e.target.value)} 
                        placeholder="e.g. Bull Flag"
                        className="bg-white/5 border-white/10 text-white placeholder:text-[#A0AEC0]"
                    />
                </div>
            </div>

            {/* Execution Logic Box */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex justify-between items-center">
                     <Label className="text-[#00C9FF] font-semibold">Execution Plan</Label>
                     {rr > 0 && (
                         <span className={`text-sm font-mono font-bold ${rr < 1.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                             {rr}R Projected
                         </span>
                     )}
                </div>
                <div className="flex items-end gap-2">
                     <div className="flex-1 space-y-1">
                         <span className="text-[10px] uppercase text-rose-400">Stop Loss</span>
                         <Input 
                            type="number" 
                            step="any" 
                            value={formData.stop_loss} 
                            onChange={e => handleChange("stop_loss", e.target.value)} 
                            className="bg-white/5 border-rose-500/30 text-white text-right font-mono" 
                            placeholder="0.00" 
                         />
                     </div>
                     <ArrowRight className="w-4 h-4 text-[#A0AEC0] mb-3" />
                     <div className="flex-1 space-y-1">
                         <span className="text-[10px] uppercase text-[#00C9FF]">Entry</span>
                         <Input 
                            type="number" 
                            step="any" 
                            value={formData.trigger_price} 
                            onChange={e => handleChange("trigger_price", e.target.value)} 
                            className="bg-white/5 border-[#00C9FF]/30 text-white text-right font-mono" 
                            placeholder="0.00" 
                         />
                     </div>
                     <ArrowRight className="w-4 h-4 text-[#A0AEC0] mb-3" />
                     <div className="flex-1 space-y-1">
                         <span className="text-[10px] uppercase text-emerald-400">Target</span>
                         <Input 
                            type="number" 
                            step="any" 
                            value={formData.take_profit} 
                            onChange={e => handleChange("take_profit", e.target.value)} 
                            className="bg-white/5 border-emerald-500/30 text-white text-right font-mono" 
                            placeholder="0.00" 
                         />
                     </div>
                </div>
            </div>

            {/* Thesis & Conviction */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="md:col-span-3 space-y-2">
                     <Label className="text-white">Thesis (Why?)</Label>
                     <Textarea 
                        value={formData.thesis} 
                        onChange={e => handleChange("thesis", e.target.value)} 
                        placeholder="Validate your trade. Why here? Why now?"
                        className="bg-white/5 border-white/10 text-white placeholder:text-[#A0AEC0] min-h-[80px]"
                     />
                 </div>
                 <div className="space-y-2">
                     <Label className="text-white">Conviction</Label>
                     <div className="flex flex-col items-center justify-center h-[80px] bg-white/5 rounded border border-white/10 gap-2">
                         <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    onClick={() => handleChange("conviction", star)}
                                    className={`w-5 h-5 cursor-pointer hover:scale-110 transition-transform ${star <= formData.conviction ? 'text-yellow-400 fill-yellow-400' : 'text-[#A0AEC0]'}`}
                                />
                            ))}
                         </div>
                         <span className="text-[10px] text-[#A0AEC0] uppercase tracking-wider">
                            {formData.conviction >= 4 ? "High Quality" : formData.conviction <= 2 ? "Speculative" : "Standard"}
                         </span>
                     </div>
                 </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={onCancel} className="text-[#A0AEC0] hover:text-white">Cancel</Button>
                <Button 
                    type="submit" 
                    className="font-bold text-white px-8"
                    style={{ background: 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)' }}
                >
                    {initialData ? "Update Plan" : "Stage Plan"}
                </Button>
            </div>
          </form>
        </CardContent>
    </Card>
  );
}