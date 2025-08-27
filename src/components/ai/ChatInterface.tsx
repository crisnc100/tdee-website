'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  RotateCcw,
  MessageCircle,
  Sparkles,
  Heart,
  AlertTriangle,
  BookOpen,
  BarChart3,
  Trash2,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import AIResponseFormatter from './AIResponseFormatter';
import { CoachingMode } from '@/lib/aiCoaching';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  coachingMode?: CoachingMode;
  metadata?: {
    modelUsed?: string;
    cost?: number;
    responseTime?: number;
  };
  liked?: boolean;
}

interface ChatInterfaceProps {
  userData: any;
  tdeeResult: any;
  selectedMode: CoachingMode;
  onModeChange?: (mode: CoachingMode) => void;
}

export default function ChatInterface({ 
  userData, 
  tdeeResult, 
  selectedMode,
  onModeChange 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial greeting message
  useEffect(() => {
    if (messages.length === 0) {
      const greetingMessage: ChatMessage = {
        id: `greeting_${Date.now()}`,
        type: 'assistant',
        content: getGreetingMessage(),
        timestamp: new Date(),
        coachingMode: selectedMode
      };
      setMessages([greetingMessage]);
    }
  }, []);

  const getGreetingMessage = (): string => {
    const name = userData?.name || 'there';
    const goal = userData?.goal || 'your fitness goals';
    
    switch (selectedMode) {
      case 'reality-check':
        return `**Hey ${name}!** 🚨 Reality Check mode activated. I'm going to give you the honest truth about ${goal}. No sugar-coating, no false promises. Ready for some straight talk?

**Ask me anything** about your TDEE results, nutrition, or fitness - but prepare for direct, evidence-based answers!`;

      case 'educational':
        return `**Welcome ${name}!** 📚 I'm in Educational mode, ready to dive deep into the science behind ${goal}. 

**Let's explore** the fascinating world of metabolism, nutrition science, and evidence-based fitness. What would you like to learn about first?`;

      case 'analytical':
        return `**Hello ${name}!** 📊 Analytical mode engaged. I'll break down your TDEE data and provide data-driven insights for ${goal}.

**Your numbers tell a story** - let me help you interpret what they mean and how to optimize them. What specific data points interest you?`;

      default: // supportive
        return `**Hi ${name}!** 💖 I'm here to support you on your journey toward ${goal}. 

**I believe in you** and I'm excited to help you succeed! What questions do you have about your TDEE results or how to reach your goals?`;
    }
  };

  const getModeIcon = (mode: CoachingMode) => {
    switch (mode) {
      case 'reality-check': return <AlertTriangle className="w-4 h-4" />;
      case 'educational': return <BookOpen className="w-4 h-4" />;
      case 'analytical': return <BarChart3 className="w-4 h-4" />;
      default: return <Heart className="w-4 h-4" />;
    }
  };

  const getModeColor = (mode: CoachingMode) => {
    switch (mode) {
      case 'reality-check': return 'text-red-600 bg-red-50 border-red-200';
      case 'educational': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'analytical': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-pink-600 bg-pink-50 border-pink-200';
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Simulate typing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await fetch('/api/ai/advanced-coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userData,
          tdeeResult,
          coachingMode: selectedMode,
          userMessage: inputText.trim(),
          conversationHistory: messages.slice(-5).map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          type: 'assistant',
          content: data.content,
          timestamp: new Date(),
          coachingMode: selectedMode,
          metadata: {
            modelUsed: data.modelUsed,
            cost: data.cost,
            responseTime: data.responseTime
          }
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'assistant',
        content: 'Sorry, I\'m having trouble responding right now. Please try again in a moment.',
        timestamp: new Date(),
        coachingMode: selectedMode
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: `greeting_${Date.now()}`,
      type: 'assistant',
      content: getGreetingMessage(),
      timestamp: new Date(),
      coachingMode: selectedMode
    }]);
  };

  const likeMessage = (messageId: string, liked: boolean) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, liked } : msg
    ));
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Could add toast notification here
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-white border border-gray-200 rounded-xl shadow-lg">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${getModeColor(selectedMode)}`}>
            {getModeIcon(selectedMode)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              AI Coach Chat
            </h3>
            <p className="text-sm text-gray-600 capitalize">
              {selectedMode.replace('-', ' ')} mode
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex items-start gap-3 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-[80%] ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-2'
                    : 'bg-gray-50 rounded-2xl rounded-bl-md p-0 overflow-hidden border border-gray-200'
                }`}
              >
                {message.type === 'user' ? (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                ) : (
                  <div>
                    <AIResponseFormatter 
                      content={message.content}
                      coachingMode={message.coachingMode}
                    />
                    
                    {/* Message Actions */}
                    <div className="flex items-center justify-between p-3 bg-white bg-opacity-50 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => likeMessage(message.id, true)}
                          className={`p-1 rounded transition-colors ${
                            message.liked === true 
                              ? 'text-green-600 bg-green-50' 
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => likeMessage(message.id, false)}
                          className={`p-1 rounded transition-colors ${
                            message.liked === false 
                              ? 'text-red-600 bg-red-50' 
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => copyMessage(message.content)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      
                      {message.metadata && (
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          {message.metadata.modelUsed && (
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              {message.metadata.modelUsed}
                            </span>
                          )}
                          {message.metadata.cost !== undefined && (
                            <span>
                              {message.metadata.cost === 0 ? 'Free' : `$${message.metadata.cost.toFixed(4)}`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-50 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask your ${selectedMode.replace('-', ' ')} coach anything...`}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            {inputText && (
              <button
                onClick={() => setInputText('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isLoading}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* Quick Replies */}
        <div className="flex flex-wrap gap-2 mt-3">
          {getQuickReplies(selectedMode).map((reply, index) => (
            <button
              key={index}
              onClick={() => setInputText(reply)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function getQuickReplies(mode: CoachingMode): string[] {
  switch (mode) {
    case 'reality-check':
      return [
        "How realistic is my timeline?",
        "What am I doing wrong?",
        "Stop sugarcoating it",
        "Give it to me straight"
      ];
    case 'educational':
      return [
        "Explain the science",
        "Why does this work?",
        "Show me the research",
        "Teach me more"
      ];
    case 'analytical':
      return [
        "Analyze my numbers",
        "What do the trends show?",
        "Break down the data",
        "Compare my progress"
      ];
    default:
      return [
        "I need encouragement",
        "What's my next step?",
        "Help me stay motivated",
        "Celebrate my wins"
      ];
  }
}