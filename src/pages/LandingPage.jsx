import React from 'react';
import { SignInButton, SignUpButton } from "@clerk/clerk-react"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Activity, ShieldCheck, Zap, ArrowRight, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F123B] text-white overflow-hidden relative selection:bg-cyan-500/30">
      
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[128px]" />

      <div className="container mx-auto px-6 py-12 relative z-10 flex flex-col items-center justify-center min-h-screen">
        
        {/* TOP NAVIGATION */}
        <nav className="absolute top-6 left-6 right-6 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            TradeMind
          </div>
          
          {/* CLERK SIGN IN (Modal Mode) */}
          <SignInButton mode="modal">
            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10">
              Log In
            </Button>
          </SignInButton>
        </nav>

        {/* HERO SECTION */}
        <div className="text-center max-w-3xl space-y-8 mt-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-sm font-medium border border-cyan-500/20">
              v1.0 Public Beta
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mt-6 leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              Master Your Trading <br /> Psychology.
            </h1>
            <p className="text-lg text-slate-400 mt-6 max-w-2xl mx-auto">
              The first AI-powered journal that tracks your emotions, predicts your risk of ruin, and helps you execute with discipline.
            </p>
          </motion.div>

          {/* CALL TO ACTION */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* CLERK SIGN UP (Modal Mode) */}
            <SignUpButton mode="modal">
                <Button 
                  size="lg" 
                  className="h-12 px-8 bg-white text-slate-900 hover:bg-slate-200 font-bold transition-all transform hover:scale-105"
                >
                  Start Journaling Free
                  <ArrowRight className="ml-2 w-5 h-5"/>
                </Button>
            </SignUpButton>
          </motion.div>
        </div>

        {/* FEATURE HIGHLIGHTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-5xl">
          <FeatureCard 
            icon={Activity} 
            title="Monte Carlo Engine" 
            desc="Simulate 1,000 futures based on your win rate to predict risk of ruin."
          />
          <FeatureCard 
            icon={ShieldCheck} 
            title="Discipline Scoring" 
            desc="Track emotional tilt and measure your adherence to your trading plan."
          />
          <FeatureCard 
            icon={Zap} 
            title="AI Analysis" 
            desc="Get automated insights on your recent trading performance."
          />
        </div>

      </div>
    </div>
  );
}

// Simple Helper Component for the grid
function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <Card className="border-slate-800/50 bg-slate-900/40 backdrop-blur-sm hover:bg-slate-800/60 transition-colors">
      <CardContent className="p-6">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}