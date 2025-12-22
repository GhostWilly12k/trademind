import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { api, createClerkSupabaseClient } from "@/api/supabaseClient";
import { useUser, useAuth } from "@clerk/clerk-react";

import SystemViability from "../components/analytics/SystemViability";
import TradeOptimization from "../components/analytics/TradeOptimization";
import RiskSurvival from "../components/analytics/RiskSurvival";
import BehavioralAnalytics from "../components/analytics/BehavioralAnalytics";

export default function Analytics() {
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

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 min-h-screen">
        <div className="w-full max-w-full space-y-6">
          <Skeleton className="h-12 w-72 bg-white/5" />
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 bg-white/5" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      {/* FIX: Full width container */}
      <div className="w-full max-w-full">
        <div className="mb-8 pt-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0, 117, 255, 0.2) 0%, rgba(0, 201, 255, 0.2) 100%)', border: '1px solid rgba(0, 117, 255, 0.3)' }}>
              <Activity className="w-5 h-5 text-[#0075FF]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              System Diagnostics
            </h1>
          </div>
          <p className="text-[#A0AEC0] font-medium">Advanced performance metrics & behavioral analysis</p>
        </div>

        <div className="space-y-8">
          {/* Section 1: System Viability & Stability */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C9FF]" />
              System Viability & Stability
            </h2>
            <SystemViability trades={trades} />
          </section>

          {/* Section 2: Trade Optimization */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Trade Optimization
            </h2>
            <TradeOptimization trades={trades} />
          </section>

          {/* Section 3: Risk & Survival */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Risk & Survival
            </h2>
            <RiskSurvival trades={trades} />
          </section>

          {/* Section 4: Behavioral Analytics */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              Behavioral Analytics
            </h2>
            <BehavioralAnalytics trades={trades} />
          </section>
        </div>
      </div>
    </div>
  );
}