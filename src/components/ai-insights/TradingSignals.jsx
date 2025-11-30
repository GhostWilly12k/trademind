import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Target,
  Shield,
  BarChart3,
  Globe,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Confidence Score Breakdown Component
function ConfidenceBreakdown({ breakdown }) {
  const scores = [
    { label: 'Trend', value: breakdown?.trend || 0, icon: TrendingUp, max: 20 },
    { label: 'Probability', value: breakdown?.probability || 0, icon: BarChart3, max: 20 },
    { label: 'Risk', value: breakdown?.risk || 0, icon: Shield, max: 20 },
    { label: 'Macro', value: breakdown?.macro || 0, icon: Globe, max: 10 },
  ];

  return (
    <div className="space-y-2 mt-3 p-3 rounded-lg bg-white/5">
      <p className="text-xs font-semibold text-[#A0AEC0] mb-2">Confidence Breakdown</p>
      {scores.map((score) => (
        <div key={score.label} className="flex items-center gap-2">
          <score.icon className="w-3 h-3 text-[#A0AEC0]" />
          <span className="text-xs text-[#A0AEC0] w-16">{score.label}</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${score.value >= 0 ? 'bg-[#00C9FF]' : 'bg-rose-400'}`}
              style={{ 
                width: `${Math.abs(score.value) / score.max * 50 + 50}%`,
                marginLeft: score.value < 0 ? `${50 - Math.abs(score.value) / score.max * 50}%` : '50%',
                transform: score.value < 0 ? 'translateX(-100%)' : 'none'
              }}
            />
          </div>
          <span className={`text-xs font-bold w-8 text-right ${score.value >= 0 ? 'text-[#00C9FF]' : 'text-rose-400'}`}>
            {score.value > 0 ? '+' : ''}{score.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Individual Signal Card with HITL Controls
function SignalCard({ signal, onApprove, onModify, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // 'approved' | 'modified' | 'rejected'

  const typeConfig = {
    buy: { icon: TrendingUp, color: 'text-[#00C9FF]', bg: 'bg-[#00C9FF]/10', border: 'border-[#00C9FF]/30' },
    sell: { icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30' },
    hold: { icon: Minus, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' }
  };

  const config = typeConfig[signal.type?.toLowerCase()] || typeConfig.hold;
  const Icon = config.icon;

  const handleApprove = async () => {
    setIsSubmitting(true);
    await onApprove?.(signal);
    setStatus('approved');
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    if (!showFeedback) {
      setShowFeedback(true);
      return;
    }
    setIsSubmitting(true);
    await onReject?.(signal, feedback);
    setStatus('rejected');
    setIsSubmitting(false);
    setShowFeedback(false);
  };

  const handleModify = () => {
    onModify?.(signal);
  };

  if (status) {
    return (
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0.7, scale: 0.98 }}
        className={`glass-card rounded-xl p-4 border ${status === 'approved' ? 'border-[#00C9FF]/30' : 'border-rose-400/30'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status === 'approved' ? (
              <CheckCircle className="w-5 h-5 text-[#00C9FF]" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
            <span className="text-white font-semibold">{signal.symbol}</span>
          </div>
          <Badge className={status === 'approved' ? 'bg-[#00C9FF]/20 text-[#00C9FF]' : 'bg-rose-400/20 text-rose-400'}>
            {status === 'approved' ? 'Approved' : 'Rejected'}
          </Badge>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-xl overflow-hidden border ${config.border}`}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{signal.symbol}</span>
                <Badge className={`${config.bg} ${config.color} border-none text-xs`}>
                  {signal.type?.toUpperCase()}
                </Badge>
              </div>
              <span className="text-xs text-[#A0AEC0]">{signal.timeframe}</span>
            </div>
          </div>
          
          {/* Confidence Score */}
          <div className="text-right">
            <div className="flex items-center gap-1">
              <span className={`text-2xl font-bold ${signal.confidence >= 70 ? 'text-[#00C9FF]' : signal.confidence >= 50 ? 'text-yellow-400' : 'text-rose-400'}`}>
                {signal.confidence}%
              </span>
            </div>
            <span className="text-xs text-[#A0AEC0]">confidence</span>
          </div>
        </div>

        {/* Price Levels */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-xs text-[#A0AEC0]">Entry</p>
            <p className="text-sm font-bold text-white">${signal.entry_price?.toFixed(2)}</p>
          </div>
          <div className="bg-rose-500/10 rounded-lg p-2 text-center">
            <p className="text-xs text-rose-400">Stop Loss</p>
            <p className="text-sm font-bold text-rose-400">${signal.stop_loss?.toFixed(2)}</p>
          </div>
          <div className="bg-[#00C9FF]/10 rounded-lg p-2 text-center">
            <p className="text-xs text-[#00C9FF]">Target</p>
            <p className="text-sm font-bold text-[#00C9FF]">${signal.take_profit?.toFixed(2)}</p>
          </div>
        </div>

        {/* Risk Check Badge */}
        {signal.risk_check_passed !== undefined && (
          <div className={`flex items-center gap-2 p-2 rounded-lg mb-3 ${signal.risk_check_passed ? 'bg-[#00C9FF]/10' : 'bg-rose-500/10'}`}>
            {signal.risk_check_passed ? (
              <Shield className="w-4 h-4 text-[#00C9FF]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span className={`text-xs font-medium ${signal.risk_check_passed ? 'text-[#00C9FF]' : 'text-rose-400'}`}>
              {signal.risk_check_passed ? 'Risk Check Passed' : 'Risk Check Warning'}
            </span>
          </div>
        )}

        {/* Expand/Collapse */}
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-[#A0AEC0] hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Hide Details' : 'Show Confidence Breakdown'}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <ConfidenceBreakdown breakdown={signal.confidence_breakdown} />
              
              {signal.technical_setup && (
                <div className="mt-3 p-3 rounded-lg bg-white/5">
                  <p className="text-xs font-semibold text-[#A0AEC0] mb-1">Technical Setup</p>
                  <p className="text-sm text-white">{signal.technical_setup}</p>
                </div>
              )}
              
              {signal.rationale && (
                <div className="mt-2 p-3 rounded-lg bg-white/5">
                  <p className="text-xs font-semibold text-[#A0AEC0] mb-1">Rationale</p>
                  <p className="text-sm text-white">{signal.rationale}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* HITL Controls */}
      <div className="border-t border-white/10 p-3 bg-white/5">
        <AnimatePresence mode="wait">
          {showFeedback ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <Textarea
                placeholder="Why are you rejecting this signal? Your feedback helps improve future recommendations..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-[#A0AEC0] text-sm min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFeedback(false)}
                  className="flex-1 text-[#A0AEC0] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleReject}
                  disabled={isSubmitting || !feedback.trim()}
                  className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                  Submit Feedback
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2"
            >
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1 bg-[#00C9FF]/20 hover:bg-[#00C9FF]/30 text-[#00C9FF] border border-[#00C9FF]/30"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleModify}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Modify
              </Button>
              <Button
                size="sm"
                onClick={handleReject}
                className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function TradingSignals({ signals = [], onSignalAction }) {
  const handleApprove = async (signal) => {
    console.log('Signal approved:', signal);
    onSignalAction?.('approve', signal);
    // In production: Send to trading_supervisor agent
  };

  const handleModify = (signal) => {
    console.log('Signal modification requested:', signal);
    onSignalAction?.('modify', signal);
  };

  const handleReject = async (signal, feedback) => {
    console.log('Signal rejected:', signal, 'Feedback:', feedback);
    onSignalAction?.('reject', signal, feedback);
    // In production: Send feedback to trading_supervisor agent for weight adjustment
  };

  return (
    <TooltipProvider>
      <Card className="glass-card border-none">
        <CardHeader className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0, 117, 255, 0.2) 0%, rgba(0, 201, 255, 0.2) 100%)', border: '1px solid rgba(0, 117, 255, 0.3)' }}>
                <Target className="w-5 h-5 text-[#0075FF]" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">Trading Signals</CardTitle>
                <p className="text-sm text-[#A0AEC0]">Human-in-the-loop validation</p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Supervisor Agent
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="glass-card border-white/20 text-white max-w-xs">
                <p>Signals are generated by the Supervisor Agent after aggregating insights from Technician and Quant agents, then passing risk checks.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {signals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-[#A0AEC0] mx-auto mb-3 opacity-50" />
              <p className="text-[#A0AEC0]">No active signals at this time</p>
              <p className="text-sm text-[#A0AEC0]/70 mt-1">The Supervisor Agent is analyzing market conditions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {signals.map((signal, index) => (
                <SignalCard
                  key={signal.id || index}
                  signal={signal}
                  onApprove={handleApprove}
                  onModify={handleModify}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}