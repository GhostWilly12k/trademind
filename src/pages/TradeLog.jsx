import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { api, createClerkSupabaseClient } from "@/api/supabaseClient";
import { useUser, useAuth } from "@clerk/clerk-react";

import TradeForm from "../components/tradelog/TradeForm";
import TradeCard from "../components/tradelog/TradeCard";

export default function TradeLog() {
  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const queryClient = useQueryClient();

  const { user } = useUser();
  const { getToken } = useAuth();

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: async () => {
      if (!user) return [];
      const client = await createClerkSupabaseClient(getToken);
      return api.entities.trade.list(client);
    },
  });

  const createTradeMutation = useMutation({
    mutationFn: async (tradeData) => {
      if (!user) throw new Error('Not authenticated');
      const client = await createClerkSupabaseClient(getToken);
      const payload = { ...tradeData, user_id: user.id };
      return api.entities.trade.create(payload, client);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      setShowForm(false);
    },
  });

  const updateTradeMutation = useMutation({
    mutationFn: async ({ id, tradeData }) => {
      if (!user) throw new Error('Not authenticated');
      const client = await createClerkSupabaseClient(getToken);
      const payload = { id, ...tradeData };
      return api.entities.trade.update(id, payload, client);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      setShowForm(false);
      setEditingTrade(null);
    },
  });

  const deleteTradeMutation = useMutation({
    mutationFn: async (id) => {
      if (!user) throw new Error('Not authenticated');
      const client = await createClerkSupabaseClient(getToken);
      return api.entities.trade.delete(id, client);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });

  const handleSubmit = (tradeData) => {
    if (editingTrade) {
      updateTradeMutation.mutate({ id: editingTrade.id, tradeData });
    } else {
      createTradeMutation.mutate(tradeData);
    }
  };

  const handleEdit = (trade) => {
    setEditingTrade(trade);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTrade(null);
  };

  return (
    // FIX: Using w-full, removed max-w container
    <div className="w-full min-h-screen space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Trade Log</h1>
          <p className="text-[#A0AEC0] font-medium">Document and track every trade</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="font-bold text-white transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)', borderRadius: '12px', padding: '12px 24px', boxShadow: '0 8px 24px rgba(0, 117, 255, 0.4)' }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Log New Trade
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <TradeForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              initialData={editingTrade}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trades.map((trade) => (
          <TradeCard
            key={trade.id}
            trade={trade}
            onEdit={handleEdit}
            onDelete={deleteTradeMutation.mutate}
          />
        ))}
      </div>

      {trades.length === 0 && !isLoading && (
        <div className="text-center py-12 glass-card rounded-xl border border-white/10">
          <p className="text-[#A0AEC0] text-lg">No trades logged yet. Start documenting your trades!</p>
        </div>
      )}
    </div>
  );
}