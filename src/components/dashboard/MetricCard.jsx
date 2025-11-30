import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MetricCard({ title, value, change, icon: Icon, isPositive, format = "number" }) {
  return (
    <Card className="relative overflow-hidden glass-card glass-hover border-none">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-30" style={{ background: 'radial-gradient(circle, rgba(0, 117, 255, 0.4) 0%, transparent 70%)' }} />
      <CardContent className="p-6 relative">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(0, 117, 255, 0.2) 0%, rgba(0, 201, 255, 0.2) 100%)', border: '1px solid rgba(0, 117, 255, 0.3)' }}>
            <Icon className="w-5 h-5 text-[#0075FF]" strokeWidth={2.5} />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
              isPositive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`} style={{ border: `1px solid ${isPositive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <p className="text-sm font-medium text-[#A0AEC0] mb-2 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-white tracking-tight">
          {format === "currency" && "$"}
          {value}
          {format === "percentage" && "%"}
        </p>
      </CardContent>
    </Card>
  );
}