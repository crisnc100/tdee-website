'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Zap, Target, Brain, Dumbbell, Apple, Book, Heart, AlertTriangle, BookOpen, BarChart3, ChevronDown, Settings } from 'lucide-react';
import type { UserData, TDEEResult } from '@/types/calculator';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { ConversationMemory } from '@/lib/conversationMemory';
import { AIModelRouter } from '@/lib/aiModelRouter';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  mode?: 'fast' | 'precise' | 'research';
  processing?: boolean;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  query: string;
}

interface AICoachChatProps {
  userData: UserData;
  tdeeResult: TDEEResult;
}

type AIMode = 'fast' | 'precise' | 'research';
type CoachingPersonality = 'supportive' | 'reality-check' | 'educational' | 'analytical';

// Tiered model selection: Free models first, GPT-4o-mini as fallback
const MODEL_MAPPING: Record<AIMode, string> = {
  fast: 'gemini-2.0-flash-exp',                       // Free Gemini 2.0 Flash for fast responses
  precise: 'gpt-4o-mini',                             // Reliable GPT-4o-mini for precise coaching
  research: 'qwen2.5-7b-instruct'                     // Free Qwen 2.5 for research/analysis
};

// Fallback models if primary fails
const FALLBACK_MAPPING: Record<AIMode, string> = {
  fast: 'gpt-4o-mini',
  precise: 'gpt-4o-mini', 
  research: 'gpt-4o-mini'
};

const COACHING_MODES = {
  supportive: { icon: Heart, label: 'Supportive', color: 'text-green-600' },
  'reality-check': { icon: AlertTriangle, label: 'Reality Check', color: 'text-orange-600' },
  educational: { icon: BookOpen, label: 'Educational', color: 'text-blue-600' },
  analytical: { icon: BarChart3, label: 'Analytical', color: 'text-purple-600' }
};

const AI_MODES = {
  fast: {
    icon: <Zap className="w-4 h-4" />,
    label: 'Fast',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Quick responses for basic questions'
  },
  precise: {
    icon: <Target className="w-4 h-4" />,
    label: 'Precise',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Detailed plans and coaching'
  },
  research: {
    icon: <Brain className="w-4 h-4" />,
    label: 'Research',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'In-depth analysis with studies'
  }
};

export default function AICoachChat({ userData, tdeeResult }: AICoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentMode, setCurrentMode] = useState<AIMode>('fast');
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [coachingMode, setCoachingMode] = useState<'supportive' | 'reality-check' | 'educational' | 'analytical'>('supportive');
  const [showSettings, setShowSettings] = useState(false);
  const [manualModelOverride, setManualModelOverride] = useState<AIMode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { preferences, updatePreferences } = useUserPreferences();
  const conversationMemory = useRef(new ConversationMemory());
  const modelRouter = useRef(new AIModelRouter());

  // Dynamic quick actions based on conversation history
  const quickActions: QuickAction[] = useMemo(() => {
    const suggestedQuestions = conversationMemory.current.getSuggestedQuestions();
    return suggestedQuestions.slice(0, 3).map((question, index) => {
      const icons = [<Apple className="w-4 h-4" />, <Dumbbell className="w-4 h-4" />, <Book className="w-4 h-4" />];
      const labels = ['Nutrition', 'Training', 'Research'];
      return {
        icon: icons[index],
        label: labels[index],
        query: question
      };
    });
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize conversation memory with context
    conversationMemory.current.updateContext({
      tdeeResult,
      userData,
      goals: userData.goal ? [userData.goal] : [],
      strugglingAreas: [],
      preferences: [],
      lastTopics: []
    });

    // Load previous messages if any
    const history = conversationMemory.current.getRecentHistory(10);
    if (history.length > 0) {
      setIsFirstTime(false);
      setMessages(history.map(turn => ({
        id: turn.id,
        content: turn.content,
        role: turn.role,
        timestamp: turn.timestamp,
        mode: turn.metadata?.mode as AIMode
      })));
    } else if (tdeeResult) {
      generateFirstTimeAnalysis();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateFirstTimeAnalysis = async () => {
    setIsFirstTime(false);
    setIsLoading(true);
    
    const greeting = conversationMemory.current.getSmartGreeting();
    
    const analysisPrompt = `${greeting}
    
    Analyze these TDEE results and provide 3-4 personalized insights:
    - TDEE: ${tdeeResult.tdee} calories
    - BMR: ${tdeeResult.bmr} calories
    - Activity Level: ${userData.activityLevel}
    - Goal: ${userData.goal || 'General fitness'}
    
    Be concise and actionable. End with a relevant follow-up question.`;

    try {
      const response = await fetch('/api/ai/advanced-coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: analysisPrompt,
          userData,
          tdeeResult,
          conversationHistory: [],
          coachingMode: coachingMode,  // Use coachingMode instead of mode
          preferredModel: 'gpt-4o-mini'
        })
      });

      if (!response.ok) {
        console.error('API Error:', response.status);
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.content) {
        console.error('No content in response:', data);
        throw new Error('No content in response');
      }
      
      setMessages([{
        id: Date.now().toString(),
        content: data.content,
        role: 'assistant',
        timestamp: new Date(),
        mode: 'precise'
      }]);
    } catch (error) {
      console.error('Error generating analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    // Use model router for intelligent selection or manual override
    const routingDecision = manualModelOverride 
      ? { model: MODEL_MAPPING[manualModelOverride] as any, tier: manualModelOverride, reasoning: 'Manual override', quotaUsed: manualModelOverride !== 'fast', quotaRemaining: modelRouter.current.getQuotaRemaining() }
      : modelRouter.current.selectModel(input);
    const selectedMode = routingDecision.tier;
    setCurrentMode(selectedMode);

    // Add to conversation memory
    conversationMemory.current.addTurn({
      role: 'user',
      content: input
    });

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      mode: selectedMode,
      processing: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Include conversation context
      const contextPrompt = conversationMemory.current.getContextForPrompt();
      const fullMessage = contextPrompt ? `${contextPrompt}\n\nUser: ${input}` : input;

      const response = await fetch('/api/ai/advanced-coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,  // Use the actual user input as the primary message
          userData,
          tdeeResult,
          conversationHistory: messages.slice(-5), // Send recent history
          coachingMode: coachingMode,  // Use coachingMode instead of mode
          preferredModel: routingDecision.model
        })
      });

      if (!response.ok) {
        console.error('API Error:', response.status);
        const errorData = await response.json();
        throw new Error(errorData.error || `API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.content) {
        console.error('No content in response:', data);
        throw new Error('No content in response');
      }

      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: data.content, processing: false }
            : msg
        )
      );

      // Add to conversation memory
      conversationMemory.current.addTurn({
        role: 'assistant',
        content: data.content,
        metadata: {
          model: routingDecision.model,
          mode: selectedMode,
          cost: data.estimatedCost,
          responseTime: data.responseTime
        }
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: 'Sorry, I encountered an error. Please try again.', processing: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const QuotaIndicator = () => {
    const quotaRemaining = modelRouter.current.getQuotaRemaining();
    const preciseRemaining = quotaRemaining.precise;
    const researchRemaining = quotaRemaining.research;
    
    const renderDots = (remaining: number, total: number) => {
      const filled = Math.ceil((remaining / total) * 5);
      return Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < filled ? 'text-gray-600' : 'text-gray-300'}>
          ●
        </span>
      ));
    };

    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3 text-blue-600" />
          {renderDots(preciseRemaining, 100)}
        </div>
        <div className="flex items-center gap-1">
          <Brain className="w-3 h-3 text-purple-600" />
          {renderDots(researchRemaining, 10)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-gray-700">
            📊 TDEE: {tdeeResult.tdee} cal
          </div>
          <div className="w-px h-4 bg-gray-300" />
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${AI_MODES[currentMode].bgColor}`}>
            {AI_MODES[currentMode].icon}
            <span className={`text-sm font-medium ${AI_MODES[currentMode].color}`}>
              {AI_MODES[currentMode].label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <QuotaIndicator />
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 space-y-3">
          {/* Coaching Personality */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Coaching Personality</label>
            <div className="flex gap-2">
              {Object.entries(COACHING_MODES).map(([key, mode]) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setCoachingMode(key as CoachingPersonality)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all ${
                      coachingMode === key 
                        ? `bg-white shadow-sm border border-gray-200 ${mode.color}` 
                        : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Override */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Model Selection</label>
            <div className="flex gap-2">
              <button
                onClick={() => setManualModelOverride(null)}
                className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                  manualModelOverride === null 
                    ? 'bg-white shadow-sm border border-gray-200 text-gray-700' 
                    : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200'
                }`}
              >
                Auto
              </button>
              {Object.entries(AI_MODES).map(([key, mode]) => (
                <button
                  key={key}
                  onClick={() => setManualModelOverride(key as AIMode)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-all ${
                    manualModelOverride === key 
                      ? `bg-white shadow-sm border border-gray-200 ${mode.color}` 
                      : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  {mode.icon}
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-50 text-gray-800'
                  : 'bg-white shadow-sm border border-gray-100'
              }`}
            >
              {message.processing ? (
                <div className="flex items-center gap-2">
                  {AI_MODES[message.mode || 'fast'].icon}
                  <span className="text-gray-500">Thinking...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length === 0 && (
        <div className="px-4 pb-2">
          <div className="flex gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => setInput(action.query)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question..."
            className="flex-1 px-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}