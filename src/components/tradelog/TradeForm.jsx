import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

export default function TradeForm({ onSubmit, onCancel, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    symbol: '',
    trade_type: 'long',
    strategy: '',
    entry_date: '',
    entry_price: '',
    exit_date: '',
    exit_price: '',
    quantity: '',
    fees: 0,
    emotion: 'neutral',
    setup_quality: 'good',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const entryPrice = parseFloat(formData.entry_price);
    const exitPrice = parseFloat(formData.exit_price);
    const quantity = parseFloat(formData.quantity);
    const fees = parseFloat(formData.fees) || 0;
    
    const multiplier = formData.trade_type === 'long' ? 1 : -1;
    const profitLoss = multiplier * ((exitPrice - entryPrice) * quantity) - fees;
    const profitLossPercentage = ((exitPrice - entryPrice) / entryPrice) * 100 * multiplier;
    
    onSubmit({
      ...formData,
      entry_price: entryPrice,
      exit_price: exitPrice,
      quantity,
      fees,
      profit_loss: profitLoss,
      profit_loss_percentage: profitLossPercentage,
    });
  };

  return (
    <Card className="glass-card border-none">
      <CardHeader className="border-b border-white/10 p-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-white">
            {initialData ? 'Edit Trade' : 'Log New Trade'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="hover:bg-white/10">
            <X className="w-5 h-5 text-[#A0AEC0]" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="symbol" className="text-white font-semibold">Symbol *</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                placeholder="AAPL, BTC/USD"
                required
                className="text-white placeholder:text-[#A0AEC0]"
                style={{ background: 'rgba(17, 25, 40, 0.5)', border: '1px solid rgba(255, 255, 255, 0.125)', borderRadius: '12px', padding: '12px' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trade_type" className="text-gray-300">Trade Type *</Label>
              <Select
                value={formData.trade_type}
                onValueChange={(value) => setFormData({...formData, trade_type: value})}
              >
                <SelectTrigger className="bg-[#0A0A0A] border-[#2D2D2D] text-white focus:border-[#00D9A3]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                  <SelectItem value="long" className="text-white focus:bg-[#252525]">Long</SelectItem>
                  <SelectItem value="short" className="text-white focus:bg-[#252525]">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry_date" className="text-gray-300">Entry Date *</Label>
              <Input
                id="entry_date"
                type="datetime-local"
                value={formData.entry_date}
                onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                required
                className="bg-[#0A0A0A] border-[#2D2D2D] text-white focus:border-[#00D9A3]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry_price" className="text-gray-300">Entry Price *</Label>
              <Input
                id="entry_price"
                type="number"
                step="0.01"
                value={formData.entry_price}
                onChange={(e) => setFormData({...formData, entry_price: e.target.value})}
                required
                className="bg-[#0A0A0A] border-[#2D2D2D] text-white placeholder:text-gray-600 focus:border-[#00D9A3]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exit_date" className="text-gray-300">Exit Date</Label>
              <Input
                id="exit_date"
                type="datetime-local"
                value={formData.exit_date}
                onChange={(e) => setFormData({...formData, exit_date: e.target.value})}
                className="bg-[#0A0A0A] border-[#2D2D2D] text-white focus:border-[#00D9A3]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exit_price" className="text-gray-300">Exit Price</Label>
              <Input
                id="exit_price"
                type="number"
                step="0.01"
                value={formData.exit_price}
                onChange={(e) => setFormData({...formData, exit_price: e.target.value})}
                className="bg-[#0A0A0A] border-[#2D2D2D] text-white placeholder:text-gray-600 focus:border-[#00D9A3]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-gray-300">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
                className="bg-[#0A0A0A] border-[#2D2D2D] text-white placeholder:text-gray-600 focus:border-[#00D9A3]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fees" className="text-gray-300">Fees & Commissions</Label>
              <Input
                id="fees"
                type="number"
                step="0.01"
                value={formData.fees}
                onChange={(e) => setFormData({...formData, fees: e.target.value})}
                className="bg-[#0A0A0A] border-[#2D2D2D] text-white placeholder:text-gray-600 focus:border-[#00D9A3]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy" className="text-gray-300">Strategy</Label>
              <Input
                id="strategy"
                value={formData.strategy}
                onChange={(e) => setFormData({...formData, strategy: e.target.value})}
                placeholder="Breakout, Reversal, etc."
                className="bg-[#0A0A0A] border-[#2D2D2D] text-white placeholder:text-gray-600 focus:border-[#00D9A3]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emotion" className="text-gray-300">Emotional State</Label>
              <Select
                value={formData.emotion}
                onValueChange={(value) => setFormData({...formData, emotion: value})}
              >
                <SelectTrigger className="bg-[#0A0A0A] border-[#2D2D2D] text-white focus:border-[#00D9A3]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                  <SelectItem value="confident" className="text-white focus:bg-[#252525]">Confident</SelectItem>
                  <SelectItem value="anxious" className="text-white focus:bg-[#252525]">Anxious</SelectItem>
                  <SelectItem value="fearful" className="text-white focus:bg-[#252525]">Fearful</SelectItem>
                  <SelectItem value="greedy" className="text-white focus:bg-[#252525]">Greedy</SelectItem>
                  <SelectItem value="disciplined" className="text-white focus:bg-[#252525]">Disciplined</SelectItem>
                  <SelectItem value="impulsive" className="text-white focus:bg-[#252525]">Impulsive</SelectItem>
                  <SelectItem value="neutral" className="text-white focus:bg-[#252525]">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup_quality" className="text-gray-300">Setup Quality</Label>
              <Select
                value={formData.setup_quality}
                onValueChange={(value) => setFormData({...formData, setup_quality: value})}
              >
                <SelectTrigger className="bg-[#0A0A0A] border-[#2D2D2D] text-white focus:border-[#00D9A3]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                  <SelectItem value="excellent" className="text-white focus:bg-[#252525]">Excellent</SelectItem>
                  <SelectItem value="good" className="text-white focus:bg-[#252525]">Good</SelectItem>
                  <SelectItem value="average" className="text-white focus:bg-[#252525]">Average</SelectItem>
                  <SelectItem value="poor" className="text-white focus:bg-[#252525]">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-300">Notes & Observations</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Document your thought process, market conditions, and key observations..."
              className="h-32 bg-[#0A0A0A] border-[#2D2D2D] text-white placeholder:text-gray-600 focus:border-[#00D9A3]"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} className="border-white/20 text-[#A0AEC0] hover:bg-white/10 hover:text-white">
              Cancel
            </Button>
            <Button 
              type="submit"
              className="font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0, 117, 255, 0.4)' }}
            >
              {initialData ? 'Update Trade' : 'Save Trade'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}