import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/api/supabaseClient";

import SWOTAnalysis from "../components/ai-insights/SWOTAnalysis";
import TradingSignals from "../components/ai-insights/TradingSignals";
import TechnicalAnalysis from "../components/ai-insights/TechnicalAnalysis";
import PredictiveModel from "../components/ai-insights/PredictiveModel";
import LearningProgress from "../components/ai-insights/LearningProgress";

export default function AIInsights() {
  const [activeTab, setActiveTab] = useState("swot");
  const [insights, setInsights] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // FIX: Replaced base44 with api client
  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => api.entities.trade.list()
  });

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => api.entities.watchlist ? api.entities.watchlist.list() : Promise.resolve([])
  });

  const generateComprehensiveInsights = async () => {
    setIsGenerating(true);
    try {
      const watchlistSymbols = watchlist.map((w) => w.symbol).join(', ');
      
      const result = await api.integrations.invokeAIAnalysis(
        "Generate comprehensive trading insights",
        { trades, watchlist: watchlistSymbols }
      );

      if (result) {
        setInsights(result);
        setActiveTab("swot");
      }
    } catch (error) {
      console.error("Error generating insights:", error);
    }
    setIsGenerating(false);
  };

  if (!insights) {
    return (
      // FIX: Added min-h-screen and padding to force full viewport height and spacing
      <div className="p-4 md:p-8 min-h-screen w-full space-y-6">
        <div className="mb-8 pt-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            AI Trading Assistant
          </h1>
          <p className="text-gray-500">Your personalized AI that learns from every trade</p>
        </div>

        <Card className="glass-card border-none w-full">
          <CardContent className="text-center p-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)', boxShadow: '0 0 60px rgba(0, 117, 255, 0.6), 0 0 100px rgba(0, 201, 255, 0.4)' }}>
                <Brain className="w-12 h-12 text-white relative z-10" strokeWidth={2.5} />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Activate Your AI Trading Assistant
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Experience the power of an AI that adapts to your trading style, masters your technical analysis techniques, 
                generates real-time signals for your watchlist, and provides comprehensive SWOT analysis of your strategies. 
                The more you trade, the smarter it becomes.
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-8 text-left">
                <div className="glass-card glass-hover p-5 rounded-xl border border-white/10">
                  <h3 className="font-bold text-white mb-2">📊 SWOT Analysis</h3>
                  <p className="text-sm text-[#A0AEC0]">Deep dive into strengths, weaknesses, opportunities & threats</p>
                </div>
                <div className="glass-card glass-hover p-5 rounded-xl border border-white/10">
                  <h3 className="font-bold text-white mb-2">🎯 Trading Signals</h3>
                  <p className="text-sm text-[#A0AEC0]">Real-time buy/sell signals for your watchlist assets</p>
                </div>
                <div className="glass-card glass-hover p-5 rounded-xl border border-white/10">
                  <h3 className="font-bold text-white mb-2">🧠 Predictive Model</h3>
                  <p className="text-sm text-[#A0AEC0]">AI-powered predictions and opportunity detection</p>
                </div>
              </div>

              <Button
                onClick={generateComprehensiveInsights}
                disabled={isGenerating || trades.length === 0}
                className="font-bold text-white text-lg px-12 py-7 group transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)', borderRadius: '16px', boxShadow: '0 12px 40px rgba(0, 117, 255, 0.5)' }}
                size="lg">

                {isGenerating ?
                <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Analyzing Your Trading Data...
                  </> :

                <>
                    <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                    Activate AI Assistant
                  </>
                }
              </Button>

              {trades.length === 0 &&
              <p className="text-sm text-[#A0AEC0] mt-6">
                  You need to log some trades first for the AI to analyze your trading style
                </p>
              }
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    // FIX: Added min-h-screen and padding to force full viewport height and spacing
    <div className="p-4 md:p-8 min-h-screen w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3 tracking-tight">
            <Brain className="w-10 h-10 text-[#00D9A3]" />
            AI Trading Assistant
          </h1>
          <p className="text-gray-500">Comprehensive analysis powered by artificial intelligence</p>
        </div>
        <Button
          onClick={generateComprehensiveInsights}
          disabled={isGenerating}
          variant="outline" 
          className="bg-background text-zinc-600 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border shadow-sm h-9 border-[#2D2D2D] hover:bg-[#252525] hover:text-white hover:border-[#374151] transition-all"
        >
          {isGenerating ?
          <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Regenerating...
            </> :

          <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Analysis
            </>
          }
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="glass-card p-1.5 bg-transparent border border-white/10" style={{ borderRadius: '16px' }}>
          <TabsTrigger value="swot" className="text-[#A0AEC0] hover:text-white transition-all rounded-xl px-4 py-2 font-medium data-[state=active]:text-white data-[state=active]:shadow-lg" style={{ background: activeTab === 'swot' ? 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)' : 'transparent', boxShadow: activeTab === 'swot' ? '0 4px 15px rgba(0, 117, 255, 0.4)' : 'none' }}>SWOT Analysis</TabsTrigger>
          <TabsTrigger value="signals" className="text-[#A0AEC0] hover:text-white transition-all rounded-xl px-4 py-2 font-medium data-[state=active]:text-white data-[state=active]:shadow-lg" style={{ background: activeTab === 'signals' ? 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)' : 'transparent', boxShadow: activeTab === 'signals' ? '0 4px 15px rgba(0, 117, 255, 0.4)' : 'none' }}>Trading Signals</TabsTrigger>
          <TabsTrigger value="technical" className="text-[#A0AEC0] hover:text-white transition-all rounded-xl px-4 py-2 font-medium data-[state=active]:text-white data-[state=active]:shadow-lg" style={{ background: activeTab === 'technical' ? 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)' : 'transparent', boxShadow: activeTab === 'technical' ? '0 4px 15px rgba(0, 117, 255, 0.4)' : 'none' }}>Technical Insights</TabsTrigger>
          <TabsTrigger value="predictions" className="text-[#A0AEC0] hover:text-white transition-all rounded-xl px-4 py-2 font-medium data-[state=active]:text-white data-[state=active]:shadow-lg" style={{ background: activeTab === 'predictions' ? 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)' : 'transparent', boxShadow: activeTab === 'predictions' ? '0 4px 15px rgba(0, 117, 255, 0.4)' : 'none' }}>Predictions</TabsTrigger>
          <TabsTrigger value="learning" className="text-[#A0AEC0] hover:text-white transition-all rounded-xl px-4 py-2 font-medium data-[state=active]:text-white data-[state=active]:shadow-lg" style={{ background: activeTab === 'learning' ? 'linear-gradient(135deg, #0075FF 0%, #00C9FF 100%)' : 'transparent', boxShadow: activeTab === 'learning' ? '0 4px 15px rgba(0, 117, 255, 0.4)' : 'none' }}>AI Learning</TabsTrigger>
        </TabsList>

        <TabsContent value="swot" className="space-y-6 w-full">
          <SWOTAnalysis swotData={insights.swot} />
        </TabsContent>

        <TabsContent value="signals" className="space-y-6 w-full">
          <TradingSignals signals={insights.signals} />
        </TabsContent>

        <TabsContent value="technical" className="space-y-6 w-full">
          <TechnicalAnalysis technicalData={insights.technical_analysis} />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6 w-full">
          <PredictiveModel predictions={insights.predictions} />
        </TabsContent>

        <TabsContent value="learning" className="space-y-6 w-full">
          <LearningProgress learningData={insights.learning} />
        </TabsContent>
      </Tabs>
    </div>
  );
}