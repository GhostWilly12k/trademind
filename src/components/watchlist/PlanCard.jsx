import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Pencil, Trash2, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// --- The Visualizer Component ---
const SetupProgress = ({ current, entry, stop, target }) => {
    if (!current || !entry || !stop || !target) return null;

    // Normalize price to a 0-100% scale for CSS positioning
    const min = Math.min(current, entry, stop, target);
    const max = Math.max(current, entry, stop, target);
    const range = max - min || 1; // Prevent div by zero
    
    const getPos = (val) => ((val - min) / range) * 100;

    return (
        <div className="relative w-full h-8 mt-4 mb-2 select-none">
            {/* The Track */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 rounded -translate-y-1/2" />
            
            {/* Stop Marker */}
            <div className="absolute top-1/2 w-1 h-3 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] -translate-y-1/2" style={{ left: `${getPos(stop)}%` }} />
            
            {/* Target Marker */}
            <div className="absolute top-1/2 w-1 h-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] -translate-y-1/2" style={{ left: `${getPos(target)}%` }} />
            
            {/* Entry Marker (Goal Post) */}
            <div className="absolute top-1/2 w-1 h-4 bg-[#00C9FF] shadow-[0_0_8px_rgba(0,201,255,0.6)] -translate-y-1/2 z-10" style={{ left: `${getPos(entry)}%` }} />

            {/* Current Price (Moving Dot) */}
            <motion.div 
                className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] -translate-y-1/2 z-20"
                animate={{ left: `${getPos(current)}%` }}
                transition={{ type: "spring", stiffness: 50 }}
            />
            
            {/* Labels */}
            <span className="absolute -bottom-5 text-[10px] font-bold text-rose-500" style={{ left: `${getPos(stop)}%`, transform: 'translateX(-50%)' }}>SL</span>
            <span className="absolute -bottom-5 text-[10px] font-bold text-[#00C9FF]" style={{ left: `${getPos(entry)}%`, transform: 'translateX(-50%)' }}>ENT</span>
            <span className="absolute -bottom-5 text-[10px] font-bold text-emerald-500" style={{ left: `${getPos(target)}%`, transform: 'translateX(-50%)' }}>TP</span>
        </div>
    );
};

export default function PlanCard({ plan, livePrice, onEdit, onDelete }) {
    const isLong = plan.direction === "long";
    const current = livePrice || plan.current_price || 0;
    
    // Planning Math
    const risk = Math.abs(plan.trigger_price - plan.stop_loss);
    const reward = Math.abs(plan.take_profit - plan.trigger_price);
    const rr = risk > 0 ? (reward / risk).toFixed(2) : 0;
    
    const distToEntry = current 
        ? ((current - plan.trigger_price) / plan.trigger_price * 100)
        : 0;
    
    const isNear = Math.abs(distToEntry) < 0.5;
    const isPastEntry = isLong ? current > plan.trigger_price : current < plan.trigger_price;
    const isGoodRR = rr >= 2.0;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="glass-card border-none overflow-hidden group relative">
                
                {/* Header */}
                <div className="p-4 pb-3 border-b border-white/10">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-white">{plan.symbol}</span>
                                <Badge className={`text-xs font-bold ${isLong ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                    {isLong ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                    {plan.direction?.toUpperCase()}
                                </Badge>
                            </div>
                            <p className="text-xs text-[#A0AEC0] mt-1">{plan.setup_type || "No Strategy"}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-[#A0AEC0] uppercase tracking-wider">Planned R:R</p>
                            <div className={`text-xl font-bold font-mono ${isGoodRR ? 'text-[#00C9FF]' : 'text-yellow-400'}`}>
                                {rr}R
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visualizer Zone */}
                <div className="px-5 py-6 bg-white/5 border-b border-white/10">
                    <SetupProgress 
                       current={current}
                       entry={plan.trigger_price}
                       stop={plan.stop_loss}
                       target={plan.take_profit}
                    />
                </div>

                {/* Status & Actions */}
                <div className="p-4 space-y-4">
                    
                    {/* Dist to Trigger */}
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-[#A0AEC0]">Distance to Trigger:</span>
                        <div className="flex items-center gap-2">
                            {isNear && <AlertTriangle className="w-4 h-4 text-yellow-400 animate-pulse" />}
                            <span className={`font-mono font-bold ${isNear ? 'text-yellow-400' : 'text-white'}`}>
                                {distToEntry > 0 ? '+' : ''}{distToEntry.toFixed(2)}%
                            </span>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2">
                         <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => onEdit(plan)} className="text-[#A0AEC0] hover:text-white hover:bg-white/10">
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onDelete(plan.id)} className="text-[#A0AEC0] hover:text-rose-400 hover:bg-rose-500/10">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                         </div>

                         <Link to={`/tradelog?symbol=${plan.symbol}&entry=${plan.trigger_price}&stop=${plan.stop_loss}&target=${plan.take_profit}&direction=${plan.direction}&notes=${encodeURIComponent(plan.thesis)}`}>
                            <Button 
                                size="sm" 
                                className={`font-bold text-white transition-all shadow-lg ${isNear ? 'animate-pulse' : ''}`}
                                style={{ 
                                    background: isNear ? '#EAB308' : 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)',
                                    boxShadow: isNear ? '0 0 15px rgba(234, 179, 8, 0.4)' : '0 4px 14px rgba(0, 117, 255, 0.3)'
                                }}
                            >
                                <TrendingUp className="w-4 h-4 mr-2" />
                                {isPastEntry ? "Log Late Entry" : "Execute Plan"}
                            </Button>
                         </Link>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}