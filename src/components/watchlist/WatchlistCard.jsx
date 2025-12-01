import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    ArrowUp,
    ArrowDown,
    Bell,
    BellOff,
    Pencil,
    Trash2,
    TrendingUp,
    Star,
    AlertTriangle,
    ChevronRight,
    Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import CandleChart from "./CandleChart";

// Sparkline handles its own mock coloring based on trend
function Sparkline({ trend = "up" }) {
    const points = trend === "up"
        ? "0,20 5,18 10,22 15,15 20,17 25,12 30,14 35,8 40,10 45,5"
        : "0,5 5,8 10,6 15,12 20,10 25,15 30,13 35,18 40,16 45,20";

    return (
        <svg className="w-full h-8" viewBox="0 0 50 25" preserveAspectRatio="none">
            <polyline
                fill="none"
                stroke={trend === "up" ? "#00C9FF" : "#ef4444"}
                strokeWidth="1.5"
                points={points}
            />
        </svg>
    );
}

function ConvictionStars({ rating }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-3 h-3 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
                />
            ))}
        </div>
    );
}

// FIX: Accept 'quote' prop
export default function WatchlistCard({ item, quote, onEdit, onDelete, onToggleAlert }) {
    const isLong = item.direction === "long";

    // LOGIC: Use live quote if available, otherwise manual data
    const currentPrice = quote?.price || item.current_price || 0;
    const priceChange = quote?.changePercent || item.price_change_percent || 0;
    const isPositive = priceChange >= 0;

    // Calculate distance to trigger
    const distanceToTrigger = item.trigger_price && currentPrice
        ? ((item.trigger_price - currentPrice) / currentPrice * 100)
        : null;

    const isNearTrigger = distanceToTrigger !== null && Math.abs(distanceToTrigger) < 1;

    const riskReward = item.trigger_price && item.stop_loss && item.take_profit
        ? Math.abs((item.take_profit - item.trigger_price) / (item.trigger_price - item.stop_loss))
        : null;

    const rrWarning = riskReward !== null && riskReward < 1.5;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="glass-card border-none overflow-hidden group relative">
                {/* Live Indicator Dot if Quote exists */}
                {quote && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                )}

                <CardContent className="p-0">
                    {/* Header */}
                    <div className="p-4 pb-3 border-b border-white/10">
                        <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-white">{item.symbol}</span>
                                <Badge className={`text-xs font-bold ${isLong ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                    {isLong ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                                    {item.direction?.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <p className="text-lg font-bold text-white font-mono">
                                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <p className={`text-sm font-medium flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                {item.setup_type && (
                                    <Badge variant="outline" className="border-white/10 text-[#A0AEC0] text-[10px]">
                                        {item.setup_type}
                                    </Badge>
                                )}
                            </div>
                            {item.conviction && <ConvictionStars rating={item.conviction} />}
                        </div>
                    </div>

                    {/* Candle Chart (Replaces Sparkline) */}
                    <div className="px-4 py-3 border-b border-white/10 h-16 flex items-center">
                        {/* Pass the candle history if it exists, otherwise empty */}
                        <CandleChart
                            data={quote?.candles || []}
                            height={40}
                            width={300} // Viewbox width (it scales automatically via CSS)
                        />
                    </div>

                    {/* Trigger & Risk Section */}
                    <div className="p-4 space-y-3 border-b border-white/10">
                        {/* Trigger Price */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-[#A0AEC0]">Trigger:</span>
                                <span className="text-sm font-semibold text-white">
                                    ${item.trigger_price?.toLocaleString() || '—'}
                                </span>
                            </div>
                            {distanceToTrigger !== null && (
                                <Badge className={`text-xs ${isNearTrigger ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse' : 'bg-white/10 text-[#A0AEC0]'}`}>
                                    {isNearTrigger && <Bell className="w-3 h-3 mr-1" />}
                                    {Math.abs(distanceToTrigger).toFixed(1)}% {distanceToTrigger > 0 ? 'away' : 'past'}
                                </Badge>
                            )}
                        </div>

                        {/* Stop Loss & Take Profit */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                <p className="text-xs text-rose-400 mb-0.5">Stop Loss</p>
                                <p className="text-sm font-semibold text-white">
                                    ${item.stop_loss?.toLocaleString() || '—'}
                                </p>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-xs text-emerald-400 mb-0.5">Take Profit</p>
                                <p className="text-sm font-semibold text-white">
                                    ${item.take_profit?.toLocaleString() || '—'}
                                </p>
                            </div>
                        </div>

                        {/* Risk:Reward */}
                        {riskReward !== null && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-[#A0AEC0]">R:R</span>
                                <Badge className={`text-xs font-bold ${rrWarning ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-[#00C9FF]/20 text-[#00C9FF] border-[#00C9FF]/30'}`}>
                                    {rrWarning && <AlertTriangle className="w-3 h-3 mr-1" />}
                                    {riskReward.toFixed(1)}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(item)}
                                className="text-[#A0AEC0] hover:text-white hover:bg-white/10"
                            >
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(item.id)}
                                className="text-[#A0AEC0] hover:text-rose-400 hover:bg-rose-500/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center gap-2 ml-2">
                                <Switch
                                    checked={item.alert_active}
                                    onCheckedChange={() => onToggleAlert(item)}
                                    className="data-[state=checked]:bg-[#0075FF]"
                                />
                                {item.alert_active ? (
                                    <Bell className="w-4 h-4 text-[#00C9FF]" />
                                ) : (
                                    <BellOff className="w-4 h-4 text-[#A0AEC0]" />
                                )}
                            </div>
                        </div>

                        <Link
                            to={`/tradelog?symbol=${item.symbol}&type=${item.direction}&entry=${item.trigger_price}&stop=${item.stop_loss}&target=${item.take_profit}&strategy=${item.setup_type || ''}`}
                        >
                            <Button
                                size="sm"
                                className="font-semibold text-white"
                                style={{ background: 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)' }}
                            >
                                <TrendingUp className="w-4 h-4 mr-1" />
                                Log
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}