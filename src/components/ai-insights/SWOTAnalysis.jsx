import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  AlertTriangle,
  Loader2,
  BarChart3,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Streaming SWOT Item Component
function SWOTItem({ item, isStreaming }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
    >
      <div className="flex-1">
        <p className="text-sm text-white">{item.text || item}</p>
        {item.sample_size && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs border-white/20 text-[#A0AEC0]">
              <BarChart3 className="w-3 h-3 mr-1" />
              {item.sample_size} trades
            </Badge>
            {item.confidence && (
              <Badge variant="outline" className="text-xs border-white/20 text-[#A0AEC0]">
                {(item.confidence * 100).toFixed(0)}% confidence
              </Badge>
            )}
            {item.win_rate && (
              <Badge className="text-xs bg-[#00C9FF]/20 text-[#00C9FF] border-none">
                {(item.win_rate * 100).toFixed(0)}% win rate
              </Badge>
            )}
          </div>
        )}
      </div>
      {isStreaming && (
        <Loader2 className="w-4 h-4 text-[#00C9FF] animate-spin flex-shrink-0" />
      )}
    </motion.div>
  );
}

// SWOT Section Component
function SWOTSection({ title, icon: Icon, items, color, bgColor, borderColor, isStreaming, streamingSection }) {
  const isCurrentlyStreaming = isStreaming && streamingSection === title.toLowerCase();
  
  return (
    <Card className={`glass-card border ${borderColor} overflow-hidden`}>
      <div className={`absolute inset-0 ${bgColor} opacity-50`} />
      <CardHeader className="relative border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${color}`} />
            <CardTitle className="text-lg font-bold text-white">{title}</CardTitle>
          </div>
          {isCurrentlyStreaming && (
            <Badge className="bg-[#00C9FF]/20 text-[#00C9FF] border-none animate-pulse">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Analyzing...
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative p-4 space-y-2 min-h-[150px]">
        <AnimatePresence>
          {items && items.length > 0 ? (
            items.map((item, index) => (
              <SWOTItem 
                key={index} 
                item={item} 
                isStreaming={isCurrentlyStreaming && index === items.length - 1}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-[#A0AEC0] text-sm">
              {isCurrentlyStreaming ? 'Analyzing trade data...' : 'No data available'}
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default function SWOTAnalysis({ swotData, isStreaming = false, streamingSection = null }) {
  const sections = [
    {
      title: 'Strengths',
      icon: TrendingUp,
      items: swotData?.strengths || [],
      color: 'text-[#00C9FF]',
      bgColor: 'bg-gradient-to-br from-[#00C9FF]/10 to-transparent',
      borderColor: 'border-[#00C9FF]/20'
    },
    {
      title: 'Weaknesses',
      icon: TrendingDown,
      items: swotData?.weaknesses || [],
      color: 'text-rose-400',
      bgColor: 'bg-gradient-to-br from-rose-500/10 to-transparent',
      borderColor: 'border-rose-500/20'
    },
    {
      title: 'Opportunities',
      icon: Lightbulb,
      items: swotData?.opportunities || [],
      color: 'text-yellow-400',
      bgColor: 'bg-gradient-to-br from-yellow-500/10 to-transparent',
      borderColor: 'border-yellow-500/20'
    },
    {
      title: 'Threats',
      icon: AlertTriangle,
      items: swotData?.threats || [],
      color: 'text-purple-400',
      bgColor: 'bg-gradient-to-br from-purple-500/10 to-transparent',
      borderColor: 'border-purple-500/20'
    }
  ];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#0075FF]/20 text-[#0075FF] border border-[#0075FF]/30">
              The Analyst Agent
            </Badge>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-4 h-4 text-[#A0AEC0]" />
              </TooltipTrigger>
              <TooltipContent className="glass-card border-white/20 text-white max-w-xs">
                <p>Continuously scans your last 50 trades to find statistically significant patterns. All insights include sample size and confidence intervals.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {isStreaming && (
            <div className="flex items-center gap-2 text-sm text-[#A0AEC0]">
              <Loader2 className="w-4 h-4 animate-spin text-[#00C9FF]" />
              Streaming analysis...
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section) => (
            <SWOTSection 
              key={section.title} 
              {...section} 
              isStreaming={isStreaming}
              streamingSection={streamingSection}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}