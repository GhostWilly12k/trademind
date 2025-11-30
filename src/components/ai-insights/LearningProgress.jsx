import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Brain,
  Trophy,
  Target,
  Zap,
  Lock,
  CheckCircle,
  ChevronRight,
  Sparkles,
  BookOpen,
  TrendingDown,
  Heart,
  HelpCircle,
  Gift
} from "lucide-react";
import { motion } from "framer-motion";

// Maturity Level Badge
function MaturityBadge({ level, percentage }) {
  const levels = {
    novice: { color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30', icon: BookOpen },
    apprentice: { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', icon: Zap },
    journeyman: { color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30', icon: Target },
    expert: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', icon: Trophy },
    master: { color: 'text-[#00C9FF]', bg: 'bg-[#00C9FF]/20', border: 'border-[#00C9FF]/30', icon: Sparkles }
  };

  const config = levels[level?.toLowerCase()] || levels.novice;
  const Icon = config.icon;

  return (
    <div className={`p-6 rounded-2xl ${config.bg} border ${config.border} text-center relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      <div className="relative">
        <div className={`w-16 h-16 mx-auto rounded-2xl ${config.bg} flex items-center justify-center mb-3`} style={{ boxShadow: `0 0 30px ${config.color}40` }}>
          <Icon className={`w-8 h-8 ${config.color}`} />
        </div>
        <p className={`text-2xl font-bold ${config.color} capitalize`}>{level}</p>
        <p className="text-sm text-[#A0AEC0] mt-1">AI Maturity Level</p>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-[#A0AEC0] mb-1">
            <span>Progress to next level</span>
            <span>{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
      </div>
    </div>
  );
}

// Calibration Quest Card
function QuestCard({ quest, onStart }) {
  const isComplete = quest.progress >= quest.target;
  const progressPercent = (quest.progress / quest.target) * 100;

  const questIcons = {
    'pattern_unlock': TrendingDown,
    'emotion_tracking': Heart,
    'exit_optimization': Target,
    'default': BookOpen
  };

  const Icon = questIcons[quest.quest_id] || questIcons.default;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        isComplete 
          ? 'bg-[#00C9FF]/10 border-[#00C9FF]/30' 
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
      onClick={() => !isComplete && onStart?.(quest)}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isComplete ? 'bg-[#00C9FF]/20' : 'bg-white/10'}`}>
          {isComplete ? (
            <CheckCircle className="w-5 h-5 text-[#00C9FF]" />
          ) : (
            <Icon className="w-5 h-5 text-[#A0AEC0]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className={`font-semibold text-sm ${isComplete ? 'text-[#00C9FF]' : 'text-white'}`}>
              {quest.title}
            </p>
            <Badge className="bg-yellow-500/20 text-yellow-400 border-none text-xs">
              +{quest.xp} XP
            </Badge>
          </div>
          <p className="text-xs text-[#A0AEC0] mb-2">{quest.description}</p>
          
          <div className="flex items-center gap-2">
            <Progress value={progressPercent} className="h-1.5 flex-1" />
            <span className="text-xs text-[#A0AEC0]">
              {quest.progress}/{quest.target}
            </span>
          </div>
          
          <div className="flex items-center gap-1 mt-2 text-xs">
            <Gift className="w-3 h-3 text-purple-400" />
            <span className="text-purple-400">{quest.reward}</span>
          </div>
        </div>
        
        {!isComplete && (
          <ChevronRight className="w-4 h-4 text-[#A0AEC0] flex-shrink-0" />
        )}
      </div>
    </motion.div>
  );
}

// Learned Pattern Card
function LearnedPatternCard({ pattern }) {
  return (
    <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-white">{pattern.aspect}</p>
        <Badge className={`text-xs ${pattern.confidence >= 0.8 ? 'bg-[#00C9FF]/20 text-[#00C9FF]' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {(pattern.confidence * 100).toFixed(0)}% confident
        </Badge>
      </div>
      <p className="text-xs text-[#A0AEC0]">{pattern.insight}</p>
    </div>
  );
}

export default function LearningProgress({ learningData, onQuestStart }) {
  // Default quests for cold start
  const defaultQuests = [
    {
      quest_id: 'pattern_unlock',
      title: 'The Honest Trader',
      description: 'Log 3 losing trades with detailed analysis notes',
      progress: learningData?.trades_analyzed ? Math.min(3, Math.floor(learningData.trades_analyzed * 0.3)) : 0,
      target: 3,
      reward: 'Unlocks Pattern Recognition',
      xp: 150
    },
    {
      quest_id: 'emotion_tracking',
      title: 'Emotional Intelligence',
      description: 'Record emotional state for 10 consecutive trades',
      progress: learningData?.trades_analyzed ? Math.min(10, Math.floor(learningData.trades_analyzed * 0.5)) : 0,
      target: 10,
      reward: 'Unlocks Psychology Insights',
      xp: 200
    },
    {
      quest_id: 'exit_optimization',
      title: 'Exit Master',
      description: 'Add MAE/MFE data to 5 closed trades',
      progress: 0,
      target: 5,
      reward: 'Unlocks Exit Optimization',
      xp: 250
    }
  ];

  const quests = learningData?.quests || defaultQuests;
  const totalXP = quests.filter(q => q.progress >= q.target).reduce((sum, q) => sum + q.xp, 0);

  return (
    <TooltipProvider>
      <Card className="glass-card border-none">
        <CardHeader className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(244, 114, 182, 0.2) 100%)', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                <Brain className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">AI Learning Journey</CardTitle>
                <p className="text-sm text-[#A0AEC0]">Your AI adapts as you trade</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-pink-500/20 text-pink-400 border border-pink-500/30">
                The Psychologist Agent
              </Badge>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-none">
                <Zap className="w-3 h-3 mr-1" />
                {totalXP} XP
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Maturity Level */}
            <div>
              <MaturityBadge 
                level={learningData?.maturity_level || 'novice'} 
                percentage={learningData?.maturity_percentage || 15}
              />
              
              <div className="mt-4 p-4 rounded-xl bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#A0AEC0]">Trades Analyzed</span>
                  <span className="text-lg font-bold text-white">{learningData?.trades_analyzed || 0}</span>
                </div>
                <Progress value={Math.min(100, (learningData?.trades_analyzed || 0) / 100 * 100)} className="h-1.5" />
                <p className="text-xs text-[#A0AEC0] mt-1">100 trades for full pattern recognition</p>
              </div>
            </div>

            {/* Calibration Quests */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                Calibration Quests
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3 h-3 text-[#A0AEC0]" />
                  </TooltipTrigger>
                  <TooltipContent className="glass-card border-white/20 text-white max-w-xs">
                    <p>Complete quests to unlock AI capabilities and earn XP. The Psychologist monitors your data density to generate relevant quests.</p>
                  </TooltipContent>
                </Tooltip>
              </h3>
              <div className="space-y-3">
                {quests.map((quest, index) => (
                  <QuestCard 
                    key={quest.quest_id || index} 
                    quest={quest}
                    onStart={onQuestStart}
                  />
                ))}
              </div>
            </div>

            {/* Learned Patterns */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00C9FF]" />
                What AI Has Learned
              </h3>
              
              {learningData?.learned_patterns && learningData.learned_patterns.length > 0 ? (
                <div className="space-y-2">
                  {learningData.learned_patterns.map((pattern, index) => (
                    <LearnedPatternCard key={index} pattern={pattern} />
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-white/5 text-center">
                  <Lock className="w-10 h-10 text-[#A0AEC0] mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-[#A0AEC0]">Complete quests to unlock insights</p>
                  <p className="text-xs text-[#A0AEC0]/70 mt-1">The AI needs more data to identify your patterns</p>
                </div>
              )}

              {/* Next Goals */}
              {learningData?.next_goals && learningData.next_goals.length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs font-semibold text-purple-400 mb-2">Next Learning Goals</p>
                  <ul className="space-y-1">
                    {learningData.next_goals.map((goal, index) => (
                      <li key={index} className="text-xs text-[#A0AEC0] flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-purple-400" />
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}