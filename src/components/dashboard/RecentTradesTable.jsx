import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

export default function RecentTradesTable({ trades }) {
  return (
    <Card className="glass-card glass-hover border-none">
      <CardHeader className="border-b border-white/10 p-6">
        <CardTitle className="text-xl font-bold text-white">Recent Trades</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="font-semibold text-[#A0AEC0] uppercase tracking-wider text-xs">Symbol</TableHead>
                <TableHead className="font-semibold text-[#A0AEC0] uppercase tracking-wider text-xs">Type</TableHead>
                <TableHead className="font-semibold text-[#A0AEC0] uppercase tracking-wider text-xs">Entry</TableHead>
                <TableHead className="font-semibold text-[#A0AEC0] uppercase tracking-wider text-xs">Exit</TableHead>
                <TableHead className="font-semibold text-[#A0AEC0] uppercase tracking-wider text-xs">P&L</TableHead>
                <TableHead className="font-semibold text-[#A0AEC0] uppercase tracking-wider text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.slice(0, 5).map((trade) => (
                <TableRow key={trade.id} className="border-white/5 hover:bg-white/5 transition-all">
                  <TableCell className="font-bold text-white">{trade.symbol}</TableCell>
                  <TableCell>
                    <Badge className={trade.trade_type === 'long' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'} style={{ borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: 600 }}>
                      {trade.trade_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white font-medium">${trade.entry_price?.toFixed(2)}</TableCell>
                  <TableCell className="text-white font-medium">${trade.exit_price?.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 font-bold ${trade.profit_loss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {trade.profit_loss >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      ${Math.abs(trade.profit_loss || 0).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#A0AEC0] font-medium">
                    {format(new Date(trade.entry_date), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}