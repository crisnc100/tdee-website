'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Info,
  Zap,
  Heart,
  Award,
  ChevronDown,
  ChevronRight,
  Utensils,
  Activity,
  Clock,
  Calculator
} from 'lucide-react';

interface AIResponseFormatterProps {
  content: string;
  coachingMode?: 'supportive' | 'reality-check' | 'educational' | 'analytical';
}

interface ParsedInsight {
  type: 'goal' | 'nutrition' | 'exercise' | 'warning' | 'tip' | 'data' | 'action';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export default function AIResponseFormatter({ content, coachingMode = 'supportive' }: AIResponseFormatterProps) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const toggleCard = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  // Parse AI response into structured insights
  const parseContent = (rawContent: string): ParsedInsight[] => {
    const insights: ParsedInsight[] = [];
    
    // Split by paragraphs and analyze each
    const paragraphs = rawContent.split('\n\n').filter(p => p.trim());
    
    paragraphs.forEach((paragraph) => {
      const lines = paragraph.split('\n').filter(l => l.trim());
      
      lines.forEach((line) => {
        if (line.includes('**') || line.includes('*')) {
          // Extract title and content
          const cleanLine = line.replace(/\*\*/g, '').replace(/\*/g, '').trim();
          
          // Determine type based on keywords and coaching mode
          let insight: ParsedInsight;
          
          if (cleanLine.toLowerCase().includes('calorie') || cleanLine.toLowerCase().includes('tdee')) {
            insight = {
              type: 'data',
              title: 'Your Numbers',
              content: cleanLine,
              priority: 'high',
              icon: <Calculator className="w-5 h-5" />,
              color: 'text-blue-700',
              bgColor: 'bg-blue-50 border-blue-200'
            };
          } else if (cleanLine.toLowerCase().includes('protein') || cleanLine.toLowerCase().includes('nutrition') || cleanLine.toLowerCase().includes('eat')) {
            insight = {
              type: 'nutrition',
              title: 'Nutrition Focus',
              content: cleanLine,
              priority: 'high',
              icon: <Utensils className="w-5 h-5" />,
              color: 'text-green-700',
              bgColor: 'bg-green-50 border-green-200'
            };
          } else if (cleanLine.toLowerCase().includes('exercise') || cleanLine.toLowerCase().includes('workout') || cleanLine.toLowerCase().includes('activity')) {
            insight = {
              type: 'exercise',
              title: 'Movement & Activity',
              content: cleanLine,
              priority: 'high',
              icon: <Activity className="w-5 h-5" />,
              color: 'text-orange-700',
              bgColor: 'bg-orange-50 border-orange-200'
            };
          } else if (cleanLine.toLowerCase().includes('goal') || cleanLine.toLowerCase().includes('target')) {
            insight = {
              type: 'goal',
              title: 'Your Goal',
              content: cleanLine,
              priority: 'high',
              icon: <Target className="w-5 h-5" />,
              color: 'text-purple-700',
              bgColor: 'bg-purple-50 border-purple-200'
            };
          } else if (coachingMode === 'reality-check' && (cleanLine.toLowerCase().includes('reality') || cleanLine.toLowerCase().includes('honest'))) {
            insight = {
              type: 'warning',
              title: 'Reality Check',
              content: cleanLine,
              priority: 'high',
              icon: <AlertTriangle className="w-5 h-5" />,
              color: 'text-red-700',
              bgColor: 'bg-red-50 border-red-200'
            };
          } else if (cleanLine.toLowerCase().includes('tip') || cleanLine.toLowerCase().includes('remember')) {
            insight = {
              type: 'tip',
              title: 'Pro Tip',
              content: cleanLine,
              priority: 'medium',
              icon: <Lightbulb className="w-5 h-5" />,
              color: 'text-yellow-700',
              bgColor: 'bg-yellow-50 border-yellow-200'
            };
          } else {
            insight = {
              type: 'action',
              title: 'Action Step',
              content: cleanLine,
              priority: 'medium',
              icon: <CheckCircle className="w-5 h-5" />,
              color: 'text-indigo-700',
              bgColor: 'bg-indigo-50 border-indigo-200'
            };
          }
          
          insights.push(insight);
        }
      });
    });

    // Sort by priority
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const insights = parseContent(content);
  const displayedInsights = showAll ? insights : insights.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Personal Insights
        </h3>
        
        {coachingMode === 'reality-check' && (
          <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
            <Zap className="w-4 h-4" />
            Reality Check Mode
          </div>
        )}
      </div>

      {/* Insight Cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {displayedInsights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`border rounded-lg ${insight.bgColor} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
            >
              {/* Card Header */}
              <div 
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => toggleCard(index)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white shadow-sm ${insight.color}`}>
                    {insight.icon}
                  </div>
                  <div>
                    <h4 className={`font-medium ${insight.color}`}>
                      {insight.title}
                    </h4>
                    <p className={`text-sm ${insight.color} opacity-75 truncate`}>
                      {insight.content.slice(0, 80)}
                      {insight.content.length > 80 ? '...' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {insight.priority === 'high' && (
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  )}
                  {expandedCards.has(index) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expandable Content */}
              <AnimatePresence>
                {expandedCards.has(index) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200"
                  >
                    <div className="p-4 bg-white bg-opacity-50">
                      <p className="text-gray-800 leading-relaxed">
                        {insight.content}
                      </p>
                      
                      {/* Quick Action Buttons */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors">
                          ✓ Got it
                        </button>
                        <button className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors">
                          💬 Tell me more
                        </button>
                        {insight.type === 'nutrition' && (
                          <button className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors">
                            🍽️ Meal ideas
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show More Button */}
      {insights.length > 3 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {showAll ? (
              <>
                <ChevronDown className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronRight className="w-4 h-4" />
                Show {insights.length - 3} More Insights
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Summary Stats */}
      <div className="flex items-center justify-center gap-4 text-sm text-gray-600 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-1">
          <Award className="w-4 h-4 text-yellow-500" />
          {insights.filter(i => i.priority === 'high').length} Priority
        </div>
        <div className="flex items-center gap-1">
          <Info className="w-4 h-4 text-blue-500" />
          {insights.length} Total Insights
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-green-500" />
          ~{Math.ceil(insights.length * 30 / 60)} min read
        </div>
      </div>
    </div>
  );
}