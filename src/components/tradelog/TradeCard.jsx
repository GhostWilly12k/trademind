import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Edit, Trash2, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function TradeCard({ trade, onEdit, onDelete }) {
  const isProfitable = (trade.profit_loss || 0) >= 0;

  return (
    <Card className="glass-card glass-hover border-none">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{trade.symbol}</h3>
            <div className="flex gap-2">
              <Badge className={trade.trade_type === 'long' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'} style={{ borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: 600 }}>
                {trade.trade_type}
              </Badge>
              {trade.strategy && (
                <Badge variant="outline" className="border-white/20 text-[#A0AEC0]" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: 600 }}>
                  {trade.strategy}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(trade)} className="hover:bg-white/10 text-[#A0AEC0] hover:text-white">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(trade.id)} className="hover:bg-red-500/10 text-[#A0AEC0] hover:text-red-300">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-[#A0AEC0] mb-1 uppercase tracking-wider">Entry</p>
            <p className="text-lg font-bold text-white">${trade.entry_price?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-[#A0AEC0] mb-1 uppercase tracking-wider">Exit</p>
            <p className="text-lg font-bold text-white">
              {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : 'Open'}
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-2 p-4 rounded-xl mb-4 ${
          isProfitable ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
        }`} style={{ backdropFilter: 'blur(8px)' }}>
          {isProfitable ? <TrendingUp className="w-5 h-5 text-green-300" /> : <TrendingDown className="w-5 h-5 text-red-300" />}
          <div className="flex-1">
            <p className="text-xs text-[#A0AEC0] uppercase tracking-wider">Profit & Loss</p>
            <p className={`text-xl font-bold ${isProfitable ? 'text-green-300' : 'text-red-300'}`}>
              ${Math.abs(trade.profit_loss || 0).toFixed(2)}
              <span className="text-sm ml-1">
                ({trade.profit_loss_percentage >= 0 ? '+' : ''}{trade.profit_loss_percentage?.toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-[#A0AEC0] font-medium">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(trade.entry_date), 'MMM d, yyyy')}
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            {trade.quantity} units
          </div>
        </div>

        {trade.notes && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-sm text-[#A0AEC0] line-clamp-2">{trade.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}