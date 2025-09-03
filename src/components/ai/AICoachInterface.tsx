'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, Zap, Target, Brain, Dumbbell, Apple, Book, Heart, 
  AlertTriangle, BookOpen, BarChart3, Settings, MessageSquare,
  Sparkles, TrendingUp, Clock, Activity, CheckCircle, AlertCircle,
  ArrowRight, Lightbulb, List, ChevronRight, User, HelpCircle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import type { UserData, TDEEResult } from '@/types/calculator';
import type { AIModelId } from '@/types/ai';
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

interface AICoachInterfaceProps {
  userData: UserData;
  tdeeResult: TDEEResult;
}

type AIMode = 'fast' | 'precise' | 'research';
type CoachingPersonality = 'supportive' | 'reality-check' | 'socratic' | 'analytical';
type ViewMode = 'cards' | 'chat';

// Tiered model selection: GPT-OSS and free models first
const MODEL_MAPPING: Record<AIMode, string> = {
  fast: 'gemini-2.0-flash-exp',                       // Free Gemini 2.0 Flash for fast responses
  precise: 'gpt-oss-120b',                            // OpenAI's open-source model for precise coaching
  research: 'qwen3-235b'                              // Qwen3 235B for deep analysis
};

// Fallback models if primary fails
const FALLBACK_MAPPING: Record<AIMode, string> = {
  fast: 'deepseek-chat',                              // DeepSeek as fast fallback
  precise: 'qwq-32b',                                 // QwQ-32B as precise fallback
  research: 'gpt-oss-120b'                            // GPT-OSS as research fallback
};

const MODEL_DISPLAY_NAMES: Record<AIMode, string> = {
  fast: 'Gemini Flash',    // Free Google model
  precise: 'GPT-OSS 120B', // OpenAI's open-source model
  research: 'Qwen3 235B'   // Advanced reasoning model
};

const COACHING_MODES = {
  supportive: { 
    icon: Heart, 
    label: 'Supportive', 
    color: 'text-green-600',
    desc: 'Encouraging'
  },
  'reality-check': { 
    icon: AlertTriangle, 
    label: 'No BS', 
    color: 'text-orange-600',
    desc: 'Direct truth'
  },
  socratic: { 
    icon: HelpCircle, 
    label: 'Socratic', 
    color: 'text-blue-600',
    desc: 'Questions'
  },
  analytical: { 
    icon: BarChart3, 
    label: 'Analytical', 
    color: 'text-purple-600',
    desc: 'Data-driven'
  }
};

const AI_MODES = {
  fast: { icon: Zap, label: 'Fast', color: 'text-green-600', bgColor: 'bg-green-50' },
  precise: { icon: Target, label: 'Precise', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  research: { icon: Brain, label: 'Research', color: 'text-purple-600', bgColor: 'bg-purple-50' }
};

export default function AICoachInterface({ userData, tdeeResult }: AICoachInterfaceProps) {
  // Single message array with mode tracking to prevent duplication
  const [messages, setMessages] = useState<{ cards: Message[], chat: Message[] }>({
    cards: [],
    chat: []
  });
  const [input, setInput] = useState('');
  const [currentMode, setCurrentMode] = useState<AIMode>('fast');
  const [isLoading, setIsLoading] = useState(false);
  const [coachingMode, setCoachingMode] = useState<CoachingPersonality>('supportive');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelId>('gemini-2.0-flash-exp');
  const [manualModelOverride, setManualModelOverride] = useState<AIMode | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [loadingSuggestion, setLoadingSuggestion] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { preferences } = useUserPreferences();
  const conversationMemory = useRef(new ConversationMemory());
  
  // Typing animation component
  const TypingAnimation: React.FC<{ text: string; isActive: boolean }> = ({ text, isActive }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    
    useEffect(() => {
      if (!isActive) {
        setDisplayedText(text);
        return;
      }
      
      if (currentIndex < text.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(text.slice(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        }, 15); // Adjust speed here (lower = faster)
        
        return () => clearTimeout(timeout);
      }
    }, [currentIndex, text, isActive]);
    
    // Reset when text changes
    useEffect(() => {
      if (isActive) {
        setCurrentIndex(0);
        setDisplayedText('');
      }
    }, [text, isActive]);
    
    // Removed auto-scroll during typing - was annoying
    // useEffect(() => {
    //   if (isActive && messagesEndRef.current) {
    //     messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    //   }
    // }, [displayedText, isActive]);
    
    return (
      <div className="text-sm whitespace-pre-wrap">
        {displayedText}
        {isActive && currentIndex < text.length && (
          <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 animate-pulse" />
        )}
      </div>
    );
  };
  const modelRouter = useRef(new AIModelRouter());

  useEffect(() => {
    conversationMemory.current.updateContext({
      tdeeResult,
      userData,
      goals: userData.goal ? [userData.goal] : [],
      strugglingAreas: [],
      preferences: [],
      lastTopics: []
    });

    // Generate initial analysis on first load
    if (isFirstTime && tdeeResult) {
      generateInitialAnalysis();
    }
  }, []);
  
  // Regenerate analysis when coaching mode changes (but only after initial load)
  useEffect(() => {
    if (!isFirstTime && tdeeResult && !isLoading) {
      // Clear existing messages when mode changes
      setMessages(prev => ({
        ...prev,
        cards: [],
        chat: prev.chat // Keep chat history when switching modes
      }));
      // Generate new analysis with the new mode
      generateInitialAnalysis();
    }
  }, [coachingMode]);

  // Helper to get/set current messages based on view mode
  const currentMessages = viewMode === 'cards' ? messages.cards : messages.chat;
  const updateMessages = (updater: (prev: Message[]) => Message[]) => {
    setMessages(prev => ({
      ...prev,
      [viewMode]: typeof updater === 'function' ? updater(prev[viewMode]) : updater
    }));
  };

  // Removed auto-scroll in chat mode - was annoying
  // useEffect(() => {
  //   if (viewMode === 'chat') {
  //     scrollToBottom();
  //   }
  // }, [chatMessages, viewMode]);

  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // };

  // Smart model selection with fallback
  const getModelWithFallback = (mode: AIMode, isRetry: boolean = false): string => {
    if (isRetry) {
      console.log(`Using fallback model for ${mode}: ${FALLBACK_MAPPING[mode]}`);
      return FALLBACK_MAPPING[mode];
    }
    console.log(`Using primary model for ${mode}: ${MODEL_MAPPING[mode]}`);
    return MODEL_MAPPING[mode];
  };

  const generateInitialAnalysis = async (retryWithFallback: boolean = false) => {
    setIsFirstTime(false);
    setIsLoading(true);

    const initialPrompt = `Analyze these TDEE results and provide CONCISE coaching (max 4 short points):
      TDEE: ${tdeeResult.tdee} calories
      BMR: ${tdeeResult.bmr} calories
      Activity Level: ${userData.activityLevel || 'moderate'}
      Goal: ${userData.goal || 'general fitness'}
      
      Format as numbered list:
      1. **Main Insight**: One key finding (1-2 sentences)
      2. **Quick Win**: One immediate action they can take
      3. **Nutrition Tip**: One specific dietary advice
      4. **Next Step**: One question to understand their needs better
      
      Be direct, actionable, no fluff or long explanations.`;

    try {
      // Smart model selection with fallback
      const selectedModel = retryWithFallback 
        ? getModelWithFallback('fast', true)   // Use fallback GPT-4o-mini
        : getModelWithFallback('fast', false); // Use primary free model

      console.log(`${retryWithFallback ? 'Retry' : 'Initial'} analysis with model:`, selectedModel);
      console.log('Generating initial analysis with payload:', {
        message: initialPrompt,
        userData,
        tdeeResult,
        coachingMode: coachingMode,
        preferredModel: selectedModel,
        conversationHistory: []
      });

      const response = await fetch('/api/ai/advanced-coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: initialPrompt,
          userData,
          tdeeResult,
          coachingMode: coachingMode,  // Use coachingMode instead of mode
          preferredModel: selectedModel
          // Removed conversationHistory - API doesn't support it
        })
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);
      
      if (!response.ok) {
        // If free model fails and we haven't tried fallback yet, retry with GPT-4o-mini
        if (!retryWithFallback && (selectedModel === 'gemini-2.0-flash-exp' || selectedModel === 'qwen3-235b' || selectedModel === 'qwq-32b')) {
          console.log('Free model failed in initial analysis, retrying with fallback...');
          return generateInitialAnalysis(true);
        }
        throw new Error(data.error || `API returned ${response.status}`);
      }
      
      if (data.content) {
        const newMessage: Message = {
          id: Date.now().toString(),
          content: data.content,
          role: 'assistant' as const,
          timestamp: new Date(),
          mode: 'precise'
        };
        
        setMessages(prev => ({
          ...prev,
          cards: [newMessage]
        }));
        
        conversationMemory.current.addTurn({
          role: 'assistant',
          content: data.content
        });
      } else {
        console.error('No content in initial analysis response:', data);
        // If free model returns no content and we haven't tried fallback yet, retry
        if (!retryWithFallback && (selectedModel === 'gemini-2.0-flash-exp' || selectedModel === 'qwen3-235b' || selectedModel === 'qwq-32b')) {
          console.log('Free model returned no content in initial analysis, retrying with fallback...');
          return generateInitialAnalysis(true);
        }
        throw new Error('No content received from API');
      }
    } catch (error) {
      console.error('Error generating initial analysis:', error);
      
      // If free model fails and we haven't tried fallback yet, retry with GPT-4o-mini
      if (!retryWithFallback) {
        console.log('Primary model failed in initial analysis, attempting fallback...');
        return generateInitialAnalysis(true);
      }
      
      // Show fallback message only if all attempts fail
      setMessages(prev => ({
        ...prev,
        cards: [{
        id: Date.now().toString(),
        content: 'Welcome! I\'m ready to help you with personalized coaching based on your TDEE results. Ask me anything about nutrition, training, or reaching your fitness goals!',
        role: 'assistant',
        timestamp: new Date(),
        mode: 'precise'
      }]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading || loadingSuggestion) return;
    
    setLoadingSuggestion(suggestion);
    
    // Add the user's question to card messages
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: suggestion,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => ({
      ...prev,
      cards: [...prev.cards, userMessage]
    }));
    
    // Format the suggestion for card-friendly response with unique identifier
    const uniqueTimestamp = `${Date.now()}-${Math.random()}`;
    const cardFormattedPrompt = `${suggestion}
    
Please provide a structured response in this exact format:
### [Main Topic]
**Key Point 1**: [Specific advice/data]
**Key Point 2**: [Clear recommendation]
**Key Point 3**: [Actionable step]
**Next Step**: [One specific action or question]

Keep each point concise (1-2 sentences max). Use specific numbers and data when relevant.
[Unique ID: ${uniqueTimestamp}]`;
    
    // Send the suggestion to get a specific answer
    try {
      // Use the handleSendMessage but ensure it's answering the specific question
      await handleSendCardMessage(cardFormattedPrompt, suggestion); // New dedicated card handler
    } catch (error) {
      console.error('Error sending suggestion:', error);
    } finally {
      setLoadingSuggestion(null);
      setInput('');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    handleSendMessage(input);
  };

  // Dedicated handler for card mode responses
  const handleSendCardMessage = async (formattedPrompt: string, originalQuestion: string) => {
    setIsLoading(true);
    
    const messageId = `${Date.now()}-${Math.random()}`; // Ensure truly unique ID
    const assistantMessage: Message = {
      id: messageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      mode: currentMode,
      processing: true
    };
    
    setMessages(prev => ({
      ...prev,
      cards: [...prev.cards, assistantMessage]
    }));
    
    try {
      const selectedModel = getModelWithFallback('precise', false);
      
      // Add both timestamp and random value to prevent any caching
      const uniqueMessage = `${formattedPrompt}\n\n[Request ID: ${Date.now()}-${Math.random()}]`;
      
      const response = await fetch('/api/ai/advanced-coaching', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          message: uniqueMessage,
          userData,
          tdeeResult,
          coachingMode: coachingMode,
          preferredModel: selectedModel,
          specificQuestion: originalQuestion // Include original question for context
        })
      });
      
      const data = await response.json();
      
      if (!response.ok && (selectedModel === 'gemini-2.0-flash-exp' || selectedModel === 'qwen3-235b' || selectedModel === 'qwq-32b' || selectedModel === 'deepseek-chat')) {
        // Retry with fallback
        const fallbackResponse = await fetch('/api/ai/advanced-coaching', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: formattedPrompt,
            userData,
            tdeeResult,
            coachingMode: coachingMode,
            preferredModel: 'gpt-4o-mini'
            // Removed conversationHistory - it's not part of the API
          })
        });
        const fallbackData = await fallbackResponse.json();
        
        setMessages(prev => ({
          ...prev,
          cards: prev.cards.map(msg =>
            msg.id === messageId
              ? { ...msg, content: fallbackData.content || 'I can help with that. Let me provide you with evidence-based guidance.', processing: false }
              : msg
          )
        }));
      } else if (response.ok && data.content) {
        // Update the specific message by ID
        setMessages(prev => ({
          ...prev,
          cards: prev.cards.map(msg =>
            msg.id === messageId
              ? { ...msg, content: data.content, processing: false }
              : msg
          )
        }));
      } else {
        console.error('No content in response or response not ok:', response.status, data);
        // Check if it's an error response
        if (data.error) {
          console.error('API error:', data.error, data.details);
          // Remove the processing message and show error
          setMessages(prev => ({
            ...prev,
            cards: prev.cards.filter(msg => msg.id !== messageId)
          }));
          // Optionally show an error toast/notification
          alert(`Error: ${data.error}. Please try again.`);
        } else {
          setMessages(prev => ({
            ...prev,
            cards: prev.cards.map(msg =>
              msg.id === messageId
                ? { ...msg, content: 'Let me help you with that question...', processing: false }
                : msg
            )
          }));
        }
      }
    } catch (error) {
      console.error('Card message error:', error);
      setMessages(prev => ({
        ...prev,
        cards: prev.cards.map(msg =>
          msg.id === messageId
            ? { ...msg, content: 'I can help with that. Let me provide you with evidence-based guidance.', processing: false }
            : msg
        )
      }));
    } finally {
      setIsLoading(false);
      setLoadingSuggestion(null); // Clear loading suggestion state
    }
  };

  const handleSendMessage = async (message: string, retryWithFallback: boolean = false, isCardMode: boolean = false) => {
    if (!message.trim() || isLoading) return;

    // Only add user message on first attempt (not on retry) and not in card mode (already added)
    if (!retryWithFallback && !isCardMode) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: message,
        role: 'user',
        timestamp: new Date()
      };
      updateMessages(prev => [...prev, userMessage]);
      setInput('');
    }

    const routingDecision = manualModelOverride 
      ? { model: MODEL_MAPPING[manualModelOverride] as any, tier: manualModelOverride }
      : modelRouter.current.selectModel(message);
    
    setCurrentMode(routingDecision.tier);
    setIsLoading(true);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      mode: routingDecision.tier,
      processing: true
    };

    // Only add assistant message on first attempt
    if (!retryWithFallback) {
      updateMessages(prev => [...prev, assistantMessage]);
    }

    try {
      // Prepare conversation history for context
      const formattedHistory = currentMessages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content // Don't truncate messages
      }));
      
      // Smart model selection with fallback
      const selectedModel = retryWithFallback 
        ? getModelWithFallback(routingDecision.tier, true)  // Use fallback
        : getModelWithFallback(routingDecision.tier, false); // Use primary
      
      // Enhance message for chat mode to be research-focused
      let enhancedMessage = message;
      if (!isCardMode && viewMode === 'chat') {
        enhancedMessage = `As a fitness, nutrition, and supplement expert, answer this question with research-backed information. Always cite studies when possible, provide specific data/numbers, and never make up information. If you don't know something, say so. Focus on evidence-based recommendations.

User question: ${message}`;
      }
      
      console.log(`${retryWithFallback ? 'Retry' : 'Initial'} attempt with model:`, selectedModel);
      console.log('Sending message with payload:', {
        message: enhancedMessage,
        userData,
        tdeeResult,
        coachingMode: coachingMode,
        preferredModel: selectedModel,
        conversationHistory: formattedHistory
      });

      const response = await fetch('/api/ai/advanced-coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: enhancedMessage,
          userData,
          tdeeResult,
          coachingMode: coachingMode,  // Use coachingMode consistently
          preferredModel: selectedModel
          // Removed conversationHistory - API doesn't support it directly
        })
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);
      
      if (!response.ok) {
        // If free model fails and we haven't tried fallback yet, retry with GPT-4o-mini
        if (!retryWithFallback && (selectedModel === 'gemini-2.0-flash-exp' || selectedModel === 'qwen3-235b' || selectedModel === 'qwq-32b')) {
          console.log('Free model failed, retrying with fallback...');
          return handleSendMessage(message, true, isCardMode);
        }
        throw new Error(data.error || `API returned ${response.status}`);
      }
      
      if (!data.content) {
        console.error('No content in response:', data);
        // If free model returns no content and we haven't tried fallback yet, retry
        if (!retryWithFallback && (selectedModel === 'gemini-2.0-flash-exp' || selectedModel === 'qwen3-235b' || selectedModel === 'qwq-32b')) {
          console.log('Free model returned no content, retrying with fallback...');
          return handleSendMessage(message, true, isCardMode);
        }
        throw new Error('No content received from API');
      }
      
      updateMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: data.content, processing: false }
            : msg
        )
      );
      
      conversationMemory.current.addTurn({
        role: 'assistant',
        content: data.content
      });

    } catch (error) {
      console.error('Error:', error);
      
      // If free model fails and we haven't tried fallback yet, retry with GPT-4o-mini
      if (!retryWithFallback && !manualModelOverride) {
        console.log('Primary model failed, attempting fallback...');
        return handleSendMessage(message, true, isCardMode);
      }
      
      updateMessages(prev => 
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

  // Generate smart suggestions based on card content and context
  const generateSmartSuggestions = (cards: Array<{ type: string; title: string; content: string; icon?: any }>): string[] => {
    const suggestions: string[] = [];
    const hasNutrition = cards.some(c => c.type === 'nutrition');
    const hasExercise = cards.some(c => c.type === 'exercise');
    const hasLifestyle = cards.some(c => c.type === 'lifestyle');
    const hasActivity = cards.some(c => c.type === 'activity');
    
    // Context-aware suggestions based on TDEE and goals
    if (userData?.goal === 'lose') {
      suggestions.push('What\'s the safest rate of weight loss for me?');
      suggestions.push('How can I maintain muscle while cutting calories?');
      suggestions.push('What are the best foods for satiety on a deficit?');
    } else if (userData?.goal === 'gain') {
      suggestions.push('How much protein do I need for muscle growth?');
      suggestions.push('What\'s an effective bulking meal plan?');
      suggestions.push('Should I do cardio while trying to gain weight?');
    } else if (userData?.goal === 'maintain') {
      suggestions.push('How do I know if I\'m truly maintaining?');
      suggestions.push('What\'s the best way to recomp at maintenance?');
      suggestions.push('How often should I recalculate my TDEE?');
    }
    
    // Card-specific deep dive questions
    if (hasNutrition) {
      suggestions.push('Break down my ideal macro split with examples');
      suggestions.push('What about intermittent fasting for my goals?');
      suggestions.push('Give me 5 quick meal prep ideas for this week');
    }
    
    if (hasExercise) {
      suggestions.push('Design a 4-week progressive training program');
      suggestions.push('What\'s the minimum effective dose for cardio?');
      suggestions.push('How do I know if I\'m overtraining?');
    }
    
    if (hasLifestyle || hasActivity) {
      suggestions.push('How does stress affect my metabolism?');
      suggestions.push('What supplements have actual research backing?');
      suggestions.push('Create a daily routine for optimal results');
    }
    
    // Research-focused questions
    suggestions.push('Show me the latest research on protein timing');
    suggestions.push('Compare different diet approaches scientifically');
    suggestions.push('What does the evidence say about meal frequency?');
    
    // Personalized tracking questions
    suggestions.push('How should I adjust if I\'m not seeing results?');
    suggestions.push('What metrics should I track besides weight?');
    suggestions.push('When should I do a refeed or diet break?');
    
    // Remove duplicates and return varied selection
    const uniqueSuggestions = [...new Set(suggestions)];
    
    // Shuffle and select diverse suggestions
    const shuffled = uniqueSuggestions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6); // Return 6 suggestions for more options
  };

  // Smart Suggestions Component
  const SmartSuggestions = ({ 
    cards, 
    onSuggestionClick, 
    isLoading,
    loadingSuggestion
  }: { 
    cards: Array<{ type: string; title: string; content: string; icon?: any }>;
    onSuggestionClick: (suggestion: string) => void;
    isLoading: boolean;
    loadingSuggestion?: string | null;
  }) => {
    const suggestions = generateSmartSuggestions(cards);
    
    return (
      <div className="mt-8 p-5 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 bg-amber-100 rounded-lg">
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-sm font-semibold text-gray-800">Suggested Follow-ups</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestions.map((suggestion, index) => {
            const isThisLoading = loadingSuggestion === suggestion;
            return (
              <button
                key={index}
                onClick={() => onSuggestionClick(suggestion)}
                disabled={isLoading || !!loadingSuggestion}
                className={`relative text-left px-4 py-3 text-sm border rounded-lg transition-all group overflow-hidden ${
                  isThisLoading 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md shadow-blue-100/50' 
                    : 'bg-white border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 hover:border-blue-300 hover:shadow-md'
                } ${(isLoading || !!loadingSuggestion) && !isThisLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {isThisLoading ? (
                    <div className="w-4 h-4 mt-0.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                  )}
                  <span className={`line-clamp-2 font-medium leading-relaxed ${
                    isThisLoading ? 'text-blue-700' : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {suggestion}
                  </span>
                </div>
                {!isThisLoading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const parseContentToCards = (content: string) => {
    const sections: Array<{ type: string; title: string; content: string; icon?: any; isPlan?: boolean }> = [];
    
    // Enhanced parsing for structured plans
    const planPattern = /### (.+?)\n([\s\S]+?)(?=###|$)/g;
    const planMatches = [...content.matchAll(planPattern)];
    
    if (planMatches.length > 0) {
      planMatches.forEach(match => {
        const sectionTitle = match[1].trim();
        const sectionContent = match[2].trim();
        
        // Parse key points within each section
        const keyPointPattern = /\*\*([^:]+)\*\*:\s*([^\n]+)/g;
        const keyPoints = [...sectionContent.matchAll(keyPointPattern)];
        
        if (keyPoints.length > 0) {
          // This is a structured plan section
          const formattedPoints = keyPoints
            .map(kp => `• ${kp[1]}: ${kp[2].trim()}`)
            .join('\n');
          
          // Determine icon based on content
          let icon = Brain;
          let type = 'plan';
          const lowerTitle = sectionTitle.toLowerCase();
          
          if (lowerTitle.includes('week') || lowerTitle.includes('day') || lowerTitle.includes('program')) {
            icon = TrendingUp;
            type = 'program';
          } else if (lowerTitle.includes('meal') || lowerTitle.includes('nutrition') || lowerTitle.includes('diet')) {
            icon = Apple;
            type = 'nutrition-plan';
          } else if (lowerTitle.includes('workout') || lowerTitle.includes('exercise') || lowerTitle.includes('training')) {
            icon = Dumbbell;
            type = 'workout-plan';
          } else if (lowerTitle.includes('supplement')) {
            icon = Heart;
            type = 'supplement-plan';
          }
          
          sections.push({
            type,
            title: sectionTitle,
            content: formattedPoints,
            icon,
            isPlan: true
          });
        } else {
          // Regular section without key points
          sections.push({
            type: 'insight',
            title: sectionTitle,
            content: sectionContent, // Show full content
            icon: Lightbulb
          });
        }
      });
    }
    
    // Fallback to numbered list parsing
    if (sections.length === 0) {
      const numberPattern = /(\d+)\.\s+\*\*([^*]+)\*\*/g;
      const matches = [...content.matchAll(numberPattern)];
      
      if (matches.length > 0) {
        matches.forEach(match => {
          const title = match[2].trim();
          const lowerTitle = title.toLowerCase();
          
          // Find content after this match
          const startIndex = content.indexOf(match[0]) + match[0].length;
          const nextMatch = [...content.matchAll(numberPattern)].find(m => content.indexOf(m[0]) > startIndex);
          const endIndex = nextMatch ? content.indexOf(nextMatch[0]) : content.length;
          
          let itemContent = content.substring(startIndex, endIndex)
            .replace(/\*\*/g, '')
            .replace(/---/g, '')
            .replace(/\n+/g, ' ')
            .trim();
          
          // Smart truncation
          if (itemContent.length > 200) {
            const sentences = itemContent.match(/[^.!?]+[.!?]+/g) || [itemContent];
            itemContent = sentences.slice(0, 2).join(' ').trim();
            if (itemContent.length > 200) {
              // Don't truncate content - show everything
              // itemContent = itemContent.substring(0, 197) + '...';
            }
          }
          
          // Determine type and icon
          let type = 'insight';
          let icon = Lightbulb;
          
          if (lowerTitle.includes('protein') || lowerTitle.includes('nutrition') || lowerTitle.includes('meal') || lowerTitle.includes('calor')) {
            type = 'nutrition';
            icon = Apple;
          } else if (lowerTitle.includes('exercise') || lowerTitle.includes('workout') || lowerTitle.includes('training') || lowerTitle.includes('reps') || lowerTitle.includes('sets')) {
            type = 'exercise';
            icon = Dumbbell;
          } else if (lowerTitle.includes('step') || lowerTitle.includes('action') || lowerTitle.includes('next')) {
            type = 'action';
            icon = ArrowRight;
          } else if (lowerTitle.includes('tip') || lowerTitle.includes('advice')) {
            type = 'tip';
            icon = Sparkles;
          } else if (lowerTitle.includes('research') || lowerTitle.includes('study') || lowerTitle.includes('evidence')) {
            type = 'research';
            icon = BookOpen;
          }
          
          sections.push({
            type,
            title,
            content: itemContent || 'See details',
            icon
          });
        });
      }
    }
    
    // Final fallback for unstructured content
    if (sections.length === 0) {
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim() && p.length > 30);
      paragraphs.slice(0, 4).forEach((para, i) => {
        const icons = [Lightbulb, Target, CheckCircle, TrendingUp];
        const types = ['insight', 'recommendation', 'action', 'tip'];
        sections.push({
          type: types[i % types.length],
          title: `Key Point ${i + 1}`,
          content: para.replace(/\*\*/g, '').replace(/###/g, '').trim(), // Show full content
          icon: icons[i % icons.length]
        });
      });
    }
    
    return sections.slice(0, 8); // Allow up to 8 cards for detailed plans
  };

  const CardView = () => {
    // Get all assistant messages for display
    const assistantMessages = messages.cards.filter(msg => msg.role === 'assistant');
    const latestMessage = assistantMessages[assistantMessages.length - 1];
    
    // Check if any message is processing (loading state)
    const isProcessing = messages.cards.some(msg => msg.processing);
    
    // Show loading state for processing messages
    if (isProcessing) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-sm w-full">
            <div className="flex flex-col items-center space-y-6">
              {/* Animated spinner */}
              <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                {/* Inner pulse effect */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse opacity-20"></div>
                </div>
              </div>
              
              {/* Loading text */}
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-gray-800">Analyzing your question</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm text-gray-500">Generating response</span>
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full animate-progress"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (!latestMessage || !latestMessage.content) {
      return null;
    }
    
    const cards = parseContentToCards(latestMessage.content);
    
    return (
      <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="grid gap-4 sm:gap-5 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, index) => {
            const Icon = card.icon;
            
            // Enhanced color schemes with better contrast
            const colorMap = {
              insight: 'bg-gradient-to-br from-blue-50 via-blue-50/70 to-indigo-50 border-blue-300 shadow-blue-100/50',
              recommendation: 'bg-gradient-to-br from-emerald-50 via-green-50/70 to-teal-50 border-emerald-300 shadow-emerald-100/50',
              important: 'bg-gradient-to-br from-orange-50 via-amber-50/70 to-yellow-50 border-orange-300 shadow-orange-100/50',
              action: 'bg-gradient-to-br from-purple-50 via-purple-50/70 to-pink-50 border-purple-300 shadow-purple-100/50',
              tip: 'bg-gradient-to-br from-yellow-50 via-amber-50/70 to-orange-50 border-yellow-400 shadow-yellow-100/50',
              message: 'bg-gradient-to-br from-gray-50 via-slate-50/70 to-gray-100 border-gray-300 shadow-gray-100/50',
              nutrition: 'bg-gradient-to-br from-emerald-50 via-green-50/70 to-lime-50 border-emerald-400 shadow-emerald-100/50',
              exercise: 'bg-gradient-to-br from-indigo-50 via-blue-50/70 to-violet-50 border-indigo-400 shadow-indigo-100/50',
              activity: 'bg-gradient-to-br from-cyan-50 via-sky-50/70 to-blue-50 border-cyan-400 shadow-cyan-100/50',
              lifestyle: 'bg-gradient-to-br from-rose-50 via-pink-50/70 to-red-50 border-rose-300 shadow-rose-100/50',
              research: 'bg-gradient-to-br from-amber-50 via-yellow-50/70 to-orange-50 border-amber-400 shadow-amber-100/50',
              plan: 'bg-white border-slate-300 shadow-slate-100/50',
              'nutrition-plan': 'bg-gradient-to-br from-emerald-50/50 via-white to-green-50/50 border-emerald-400 shadow-emerald-100/50',
              'workout-plan': 'bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 border-indigo-400 shadow-indigo-100/50',
              'supplement-plan': 'bg-gradient-to-br from-purple-50/50 via-white to-pink-50/50 border-purple-400 shadow-purple-100/50',
              program: 'bg-gradient-to-br from-blue-50/50 via-white to-cyan-50/50 border-blue-400 shadow-blue-100/50'
            };
            
            const iconColorMap = {
              insight: 'text-blue-600 bg-blue-100',
              recommendation: 'text-emerald-600 bg-emerald-100',
              important: 'text-orange-600 bg-orange-100',
              action: 'text-purple-600 bg-purple-100',
              tip: 'text-yellow-700 bg-yellow-100',
              message: 'text-gray-600 bg-gray-100',
              nutrition: 'text-emerald-600 bg-emerald-100',
              exercise: 'text-indigo-600 bg-indigo-100',
              activity: 'text-cyan-600 bg-cyan-100',
              lifestyle: 'text-rose-600 bg-rose-100',
              research: 'text-amber-600 bg-amber-100',
              plan: 'text-slate-700 bg-slate-100',
              'nutrition-plan': 'text-emerald-700 bg-emerald-100',
              'workout-plan': 'text-indigo-700 bg-indigo-100',
              'supplement-plan': 'text-purple-700 bg-purple-100',
              program: 'text-blue-700 bg-blue-100'
            };
            
            // Format content with better structure
            const formatContent = (content: string) => {
              // Handle bullet points and lists
              const lines = content.split('\n');
              return lines.map((line, idx) => {
                // Check for bullet points or numbered lists
                if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
                  return (
                    <li key={idx} className="flex items-start gap-2 mb-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span className="flex-1 text-gray-700">{line.replace(/^[•\-\*]\s*/, '')}</span>
                    </li>
                  );
                } else if (/^\d+\./.test(line.trim())) {
                  return (
                    <li key={idx} className="flex items-start gap-2 mb-2">
                      <span className="font-medium text-gray-500 min-w-[20px]">{line.match(/^\d+/)?.[0] || '1'}.</span>
                      <span className="flex-1 text-gray-700">{line.replace(/^\d+\.\s*/, '')}</span>
                    </li>
                  );
                } else if (line.includes('**') && line.includes(':')) {
                  // Handle bold labels with colons
                  const parts = line.split(':');
                  const label = parts[0].replace(/\*\*/g, '');
                  const value = parts.slice(1).join(':') || '';
                  return (
                    <div key={idx} className="mb-3">
                      <span className="font-semibold text-gray-800">{label}:</span>
                      <span className="text-gray-700 ml-2">{value}</span>
                    </div>
                  );
                } else if (line.trim()) {
                  return <p key={idx} className="text-gray-700 mb-2 leading-relaxed">{line}</p>;
                }
                return null;
              });
            };
            
            return (
              <div
                key={index}
                className={`relative rounded-xl border-2 ${colorMap[card.type as keyof typeof colorMap]} transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
                  expandedCards.has(index.toString()) ? 'overflow-visible' : 'overflow-hidden'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-center gap-3 p-5 pb-0">
                  <div className={`p-3 rounded-xl ${iconColorMap[card.type as keyof typeof iconColorMap]} shadow-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 flex-1">{card.title}</h3>
                </div>
                
                {/* Card Content - Fixed overflow with expand/collapse */}
                <div className={`px-5 py-4 transition-all duration-300 overflow-hidden ${
                  expandedCards.has(index.toString()) 
                    ? 'max-h-none' 
                    : 'max-h-32'
                }`}>
                  {card.isPlan ? (
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50">
                      <pre className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-sans break-words">
                        {formatContent(card.content)}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-base leading-relaxed break-words">
                      {typeof formatContent(card.content) === 'object' ? (
                        <ul className="space-y-1 list-none">
                          {formatContent(card.content)}
                        </ul>
                      ) : (
                        formatContent(card.content)
                      )}
                    </div>
                  )}
                  
                  {/* Show More/Less button for long content */}
                  {(card.content.length > 300 || card.content.split('\n').length > 4) && (
                    <div className="mt-3 pt-2 border-t border-gray-100/50">
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedCards);
                          const indexStr = index.toString();
                          if (expandedCards.has(indexStr)) {
                            newExpanded.delete(indexStr);
                          } else {
                            newExpanded.add(indexStr);
                          }
                          setExpandedCards(newExpanded);
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        {expandedCards.has(index.toString()) ? (
                          <>
                            <span>Show less</span>
                            <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            <span>Show more</span>
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Optional decorative element */}
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
              </div>
            );
          })}
        </div>
        
        {/* Smart follow-up suggestions */}
        <SmartSuggestions 
          cards={cards} 
          onSuggestionClick={handleSuggestionClick}
          isLoading={isLoading}
          loadingSuggestion={loadingSuggestion}
        />
      </div>
    );
  };

  const ChatView = () => (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.chat.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {message.role === 'user' ? <User className="w-4 h-4 text-blue-600" /> : <Brain className="w-4 h-4 text-gray-600" />}
            </div>
            <div
              className={`px-4 py-2.5 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {message.processing ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              ) : (
                <TypingAnimation 
                  text={message.content} 
                  isActive={message.role === 'assistant' && message.id === messages.chat[messages.chat.length - 1]?.id}
                />
              )}
            </div>
          </div>
        </div>
      ))}
      {/* Removed auto-scroll anchor */}
      {/* <div ref={messagesEndRef} /> */}
    </div>
  );

  const QuotaIndicator = () => {
    const quotaRemaining = modelRouter.current.getQuotaRemaining();
    
    return (
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3 text-blue-600" />
          <span className="text-gray-600">{quotaRemaining.precise}</span>
        </div>
        <div className="flex items-center gap-1">
          <Brain className="w-3 h-3 text-purple-600" />
          <span className="text-gray-600">{quotaRemaining.research}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[650px] sm:h-[700px] bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="text-sm font-medium text-gray-700">
              📊 TDEE: {tdeeResult.tdee} cal
            </div>
            <div className="w-px h-4 bg-gray-300" />
            
            {/* Coaching Mode Display */}
            <div className="flex items-center gap-1 text-xs">
              {React.createElement(COACHING_MODES[coachingMode].icon, { 
                className: `w-3.5 h-3.5 ${COACHING_MODES[coachingMode].color}` 
              })}
              <span className={`font-medium ${COACHING_MODES[coachingMode].color}`}>
                {COACHING_MODES[coachingMode].label}
              </span>
            </div>
            
            <div className="w-px h-4 bg-gray-300" />
            
            {/* AI Model Display */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${AI_MODES[currentMode].bgColor}`}>
              {React.createElement(AI_MODES[currentMode].icon, { className: 'w-3.5 h-3.5' })}
              <span className={`text-xs font-medium ${AI_MODES[currentMode].color}`}>
                {AI_MODES[currentMode].label}
              </span>
              {/* Subtle model name for technical users */}
              <span className="text-[10px] text-gray-400 ml-1">
                {MODEL_DISPLAY_NAMES[currentMode]}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <QuotaIndicator />
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'cards' 
                    ? 'bg-white text-gray-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('chat')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'chat' 
                    ? 'bg-white text-gray-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 space-y-2">
          {/* Info tooltip */}
          <div className="mb-2 p-2 bg-blue-50 rounded-md border border-blue-100">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">💡 Tip:</span> 
              <span className="font-medium"> Personality</span> = HOW I coach (supportive vs direct) •
              <span className="font-medium"> Model</span> = My communication style (lists vs stories)
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Personality</label>
              <div className="flex gap-1">
                {Object.entries(COACHING_MODES).map(([key, mode]) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setCoachingMode(key as CoachingPersonality)}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs transition-all ${
                        coachingMode === key 
                          ? `bg-white shadow-sm border border-gray-200 ${mode.color}` 
                          : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200'
                      }`}
                      title={mode.label}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                {coachingMode === 'supportive' && 'Encouraging motivation for beginners'}
                {coachingMode === 'reality-check' && 'Direct truth to cut through myths'}
                {coachingMode === 'socratic' && 'Questions that make you think & learn'}
                {coachingMode === 'analytical' && 'Numbers & data-driven optimization'}
              </p>
            </div>
            
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 mb-1 block">AI Model</label>
              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as AIModelId)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white"
                title="Choose an AI model based on your needs"
              >
                <option value="gemini-2.0-flash-exp" title="Best for quick responses and structured output">
                  📊 Organized & Fast • Gemini 2.0
                </option>
                <option value="gpt-oss-120b" title="Conversational and friendly explanations">
                  💬 Gym Buddy • GPT-OSS 120B
                </option>
                <option value="qwen3-235b" title="Shows reasoning process step-by-step">
                  🔬 Method-Based • Qwen3 235B
                </option>
                <option value="gpt-4o-mini" title="Adapts to your communication style">
                  🎯 Adaptive Pro • GPT-4o Mini
                </option>
              </select>
              <p className="text-[10px] text-gray-500 mt-1">
                {selectedModel === 'gemini-2.0-flash-exp' && 'Lists & bullet points • 2-3 sec response'}
                {selectedModel === 'gpt-oss-120b' && 'Friendly conversation • 4-5 sec response'}
                {selectedModel === 'qwen3-235b' && 'Shows thinking process • 5-6 sec response'}
                {selectedModel === 'gpt-4o-mini' && 'Matches your style • 3-4 sec response'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading && messages.cards.length === 0 && messages.chat.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                <Brain className="absolute inset-0 m-auto w-8 h-8 text-blue-500" />
              </div>
              <div>
                <p className="text-gray-700 font-medium text-lg">Analyzing your TDEE results...</p>
                <p className="text-gray-500 text-sm mt-1">Creating personalized fitness insights</p>
              </div>
              <div className="flex justify-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        ) : (messages.cards.length === 0 && messages.chat.length === 0) ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Brain className="w-16 h-16 text-gray-300 mx-auto" />
              <p className="text-gray-500">Loading your personalized insights...</p>
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="flex-1 overflow-y-auto">
            <CardView />
          </div>
        ) : (
          <ChatView />
        )}
      </div>

      {/* Input Area - Always at bottom */}
      <div className="border-t border-gray-100 p-3 sm:p-4 bg-gray-50">
        <div className="flex gap-2 flex-col sm:flex-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about your fitness goals..."
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 sm:w-auto w-full"
          >
            <Send className="w-4 h-4" />
            <span className="text-sm font-medium">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}