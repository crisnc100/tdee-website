'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Zap,
  DollarSign,
  Clock,
  Star,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  Shield,
  MessageSquare,
  BarChart3,
  BookOpen,
  Heart,
  AlertTriangle,
  Play,
  Pause,
  SkipForward
} from 'lucide-react';
import { AI_MODELS, AIModelId } from '@/types/ai';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import AIModelSwitcher from '@/components/ai/AIModelSwitcher';
import CoachingModeSelector from '@/components/ai/CoachingModeSelector';
import { CoachingMode } from '@/lib/aiCoaching';

interface AIModelOnboardingProps {
  onComplete: (selectedModel: AIModelId, preferences: any) => void;
  onSkip?: () => void;
  className?: string;
}

/**
 * AI Model Onboarding Component
 * 
 * Provides an interactive tutorial and setup flow for users to:
 * - Learn about different AI models and their strengths
 * - Understand the cost vs performance trade-offs
 * - Set up their preferred coaching style
 * - Configure their AI preferences
 * - See live demonstrations of each model
 */
export default function AIModelOnboarding({
  onComplete,
  onSkip,
  className = ''
}: AIModelOnboardingProps) {
  // Onboarding flow state
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedModel, setSelectedModel] = useState<AIModelId>('qwen2.5-7b-instruct');
  const [selectedMode, setSelectedMode] = useState<CoachingMode>('supportive');
  const [userPreferences, setUserPreferences] = useState({
    preferFreeModels: true,
    qualityPreference: 'balanced' as const,
    showCostEstimates: true,
    allowExperimental: false
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const { preferences, updatePreferences } = useUserPreferences();

  // Onboarding steps configuration
  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to AI-Powered Coaching',
      subtitle: 'Let\'s set up your personalized AI experience',
      component: 'welcome'
    },
    {
      id: 'models-overview',
      title: 'Meet Your AI Coaches',
      subtitle: 'Each AI model has unique strengths for different situations',
      component: 'models'
    },
    {
      id: 'cost-performance',
      title: 'Cost vs Performance',
      subtitle: 'Understand the trade-offs to make the best choice for you',
      component: 'cost-performance'
    },
    {
      id: 'coaching-modes',
      title: 'Choose Your Coaching Style',
      subtitle: 'Pick the approach that motivates you most',
      component: 'coaching-modes'
    },
    {
      id: 'live-demo',
      title: 'See It In Action',
      subtitle: 'Watch your selected AI model provide personalized advice',
      component: 'demo'
    },
    {
      id: 'preferences',
      title: 'Customize Your Experience',
      subtitle: 'Set your preferences for optimal results',
      component: 'preferences'
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      subtitle: 'Your AI coach is ready to help you succeed',
      component: 'complete'
    }
  ];

  const currentStepData = steps[currentStep];

  // Auto-advance demo
  useEffect(() => {
    if (currentStepData.id === 'live-demo' && isPlaying) {
      const timer = setTimeout(() => {
        setDemoStep(prev => (prev + 1) % 4);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStepData.id, isPlaying, demoStep]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const finalPreferences = {
      defaultModel: selectedModel,
      defaultCoachingMode: selectedMode,
      ...userPreferences,
      hasCompletedOnboarding: true
    };
    
    updatePreferences(finalPreferences);
    onComplete(selectedModel, finalPreferences);
  };

  const estimateCost = (modelId: AIModelId) => {
    const model = AI_MODELS[modelId];
    if (model.pricing.isFree) return 'Free';
    
    const inputCost = (500 / 1_000_000) * model.pricing.inputCostPer1M;
    const outputCost = (200 / 1_000_000) * model.pricing.outputCostPer1M;
    const total = inputCost + outputCost;
    
    return `$${total.toFixed(4)}`;
  };

  // Step Components
  const WelcomeStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
        <Brain className="w-10 h-10 text-white" />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">
          AI-Powered Fitness Coaching
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl">
          Our advanced AI system uses multiple specialized models to provide you with 
          personalized nutrition advice, meal planning, and coaching that adapts to your unique needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
          <Sparkles className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Intelligent Routing</h3>
          <p className="text-sm text-gray-600">
            Automatically selects the best AI model for each task
          </p>
        </div>
        
        <div className="p-6 bg-green-50 rounded-lg border border-green-200">
          <DollarSign className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Cost Optimized</h3>
          <p className="text-sm text-gray-600">
            96% cost reduction with smart free model usage
          </p>
        </div>
        
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <BarChart3 className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Performance Tracking</h3>
          <p className="text-sm text-gray-600">
            Real-time metrics and quality monitoring
          </p>
        </div>
      </div>
    </motion.div>
  );

  const ModelsOverviewStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your AI Coach
        </h2>
        <p className="text-gray-600">
          Each model has unique strengths - pick the one that fits your style
        </p>
      </div>

      <div className="grid gap-4">
        {Object.values(AI_MODELS).filter(model => model.isAvailable).map((model) => (
          <motion.div
            key={model.id}
            whileHover={{ scale: 1.02 }}
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              selectedModel === model.id
                ? 'border-purple-300 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setSelectedModel(model.id)}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                model.pricing.isFree ? 'bg-green-100' : 'bg-purple-100'
              }`}>
                {model.pricing.isFree ? (
                  <Sparkles className="w-6 h-6 text-green-600" />
                ) : (
                  <Zap className="w-6 h-6 text-purple-600" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {model.name}
                  </h3>
                  {model.pricing.isFree && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Free
                    </span>
                  )}
                  {model.tier === 'experimental' && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                      Beta
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-3">{model.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {model.performance.avgResponseTime}s
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {(model.performance.qualityScore * 100).toFixed(0)}%
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {estimateCost(model.id)}
                  </div>
                </div>
              </div>
              
              {selectedModel === model.id && (
                <CheckCircle className="w-6 h-6 text-purple-600" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const CostPerformanceStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Smart Cost Management
        </h2>
        <p className="text-gray-600">
          Our system intelligently balances cost and quality for optimal results
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            96% Cost Reduction Achieved
          </h3>
        </div>
        <p className="text-gray-700 mb-4">
          By intelligently routing requests to free models when appropriate, we've reduced 
          AI costs by 96% while maintaining high-quality coaching responses.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Free Models (Preferred)</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Qwen2.5 7B - Excellent for structured advice</li>
              <li>• Gemini 2.0 Flash - Great for data analysis</li>
              <li>• Daily rate limits ensure availability</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Premium Models (Backup)</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• GPT-4o Mini - $0.0003 per request</li>
              <li>• Used only when free models are unavailable</li>
              <li>• Premium quality for complex queries</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Cost Protection Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Daily Limits</h4>
            <p className="text-sm text-gray-600">Automatic spending caps prevent unexpected charges</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Transparent Pricing</h4>
            <p className="text-sm text-gray-600">See estimated costs before each request</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Free First</h4>
            <p className="text-sm text-gray-600">Always try free models before paid options</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Usage Analytics</h4>
            <p className="text-sm text-gray-600">Track your spending and model performance</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const CoachingModesStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Coaching Style
        </h2>
        <p className="text-gray-600">
          Different modes for different moods and needs
        </p>
      </div>

      <div className="space-y-4">
        {[
          {
            mode: 'supportive' as const,
            icon: Heart,
            title: 'Supportive Coach',
            description: 'Encouraging and motivational approach that builds confidence',
            color: 'green',
            example: '"You\'re making great progress! Here are some gentle adjustments..."'
          },
          {
            mode: 'reality-check' as const,
            icon: AlertTriangle,
            title: 'Reality Check',
            description: 'Direct, honest feedback that cuts through myths and misconceptions',
            color: 'orange',
            example: '"Let\'s be honest about what actually works and what doesn\'t..."'
          },
          {
            mode: 'educational' as const,
            icon: BookOpen,
            title: 'Educational Guide',
            description: 'Detailed explanations with scientific backing and research',
            color: 'blue',
            example: '"Here\'s the science behind why this approach is effective..."'
          },
          {
            mode: 'analytical' as const,
            icon: BarChart3,
            title: 'Data Analyst',
            description: 'Numbers-focused approach with quantified insights and metrics',
            color: 'purple',
            example: '"Based on your data, here are the precise optimizations..."'
          }
        ].map((modeData) => {
          const Icon = modeData.icon;
          const isSelected = selectedMode === modeData.mode;
          
          return (
            <motion.div
              key={modeData.mode}
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? `border-${modeData.color}-300 bg-${modeData.color}-50`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setSelectedMode(modeData.mode)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${modeData.color}-100`}>
                  <Icon className={`w-6 h-6 text-${modeData.color}-600`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {modeData.title}
                    </h3>
                    {isSelected && (
                      <CheckCircle className={`w-5 h-5 text-${modeData.color}-600`} />
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-3">{modeData.description}</p>
                  
                  <div className={`p-3 bg-${modeData.color}-50 rounded border-l-3 border-${modeData.color}-300`}>
                    <p className="text-sm text-gray-700 italic">
                      {modeData.example}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );

  const LiveDemoStep = () => {
    const demoMessages = [
      "Analyzing your profile and TDEE calculation...",
      "Selecting optimal model and coaching approach...",
      "Generating personalized recommendations...",
      "Ready! Here's your customized advice."
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            See Your AI Coach In Action
          </h2>
          <p className="text-gray-600">
            Watch how {AI_MODELS[selectedModel].name} provides {selectedMode} coaching
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 text-green-400 font-mono">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="ml-4 text-gray-400">AI Coach Terminal</span>
          </div>
          
          <div className="space-y-2">
            {demoMessages.slice(0, demoStep + 1).map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.5 }}
                className="flex items-center gap-2"
              >
                <span className="text-blue-400">$</span>
                <span>{message}</span>
                {index === demoStep && isPlaying && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    _
                  </motion.span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                Pause Demo
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Play Demo
              </>
            )}
          </button>
          
          <button
            onClick={() => setDemoStep((demoStep + 1) % 4)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            Next Step
          </button>
        </div>

        {demoStep === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200"
          >
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Sample Response from {AI_MODELS[selectedModel].name}
            </h3>
            <div className="text-gray-700 space-y-2">
              <p>
                <strong>🎯 {selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)} Coaching:</strong>
              </p>
              {selectedMode === 'supportive' && (
                <p>
                  "Great job on tracking your TDEE! You're burning 2,156 calories daily, which gives us a solid foundation. 
                  Focus on hitting 140g protein daily - think palm-sized portions at each meal. 
                  Your 8,000 daily steps are fantastic - every step contributes to your success! 🌟"
                </p>
              )}
              {selectedMode === 'reality-check' && (
                <p>
                  "Let's cut through the noise: Your TDEE is 2,156 calories, not the 1,200 you might see in magazines. 
                  Eating too little will tank your metabolism. You need 140g protein daily - most people severely under-eat protein 
                  and wonder why they're always hungry. Stop chasing quick fixes and focus on consistency."
                </p>
              )}
              {selectedMode === 'educational' && (
                <p>
                  "Your TDEE breaks down as: BMR (1,680 cal) + NEAT (276 cal) + Exercise (200 cal). 
                  The protein recommendation of 140g supports muscle protein synthesis - research shows 0.75-1g per lb bodyweight 
                  optimizes muscle maintenance. Your 8,000 steps contribute significantly to NEAT, which is often underestimated."
                </p>
              )}
              {selectedMode === 'analytical' && (
                <p>
                  "Data analysis: TDEE 2,156 cal (BMR: 78%, Activity: 22%). Optimal macros: 140g protein (26%), 72g fat (30%), 
                  240g carbs (44%). Current step count (8,000) = ~320 cal NEAT. Increasing to 10,000 steps = additional 80 cal/day. 
                  15% deficit target: 1,833 calories for 1-2 lbs/month fat loss."
                </p>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const PreferencesStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Customize Your Experience
        </h2>
        <p className="text-gray-600">
          Fine-tune your AI preferences for optimal results
        </p>
      </div>

      <div className="space-y-6">
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Preferences</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">Prefer Free Models</span>
                <p className="text-sm text-gray-600">Use free AI models when possible to minimize costs</p>
              </div>
              <input
                type="checkbox"
                checked={userPreferences.preferFreeModels}
                onChange={(e) => setUserPreferences(prev => ({
                  ...prev,
                  preferFreeModels: e.target.checked
                }))}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">Show Cost Estimates</span>
                <p className="text-sm text-gray-600">Display estimated costs for each AI request</p>
              </div>
              <input
                type="checkbox"
                checked={userPreferences.showCostEstimates}
                onChange={(e) => setUserPreferences(prev => ({
                  ...prev,
                  showCostEstimates: e.target.checked
                }))}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Preferences</h3>
          <div className="space-y-3">
            {[
              { value: 'fast', label: 'Fast Responses', desc: 'Prioritize speed over detail' },
              { value: 'balanced', label: 'Balanced Quality', desc: 'Good balance of speed and quality' },
              { value: 'high-quality', label: 'High Quality', desc: 'Best possible responses, may be slower' }
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="qualityPreference"
                  value={option.value}
                  checked={userPreferences.qualityPreference === option.value}
                  onChange={(e) => setUserPreferences(prev => ({
                    ...prev,
                    qualityPreference: e.target.value as any
                  }))}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="font-medium text-gray-900">{option.label}</span>
                  <p className="text-sm text-gray-600">{option.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Options</h3>
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">Enable Experimental Models</span>
              <p className="text-sm text-gray-600">Access to beta AI models (may be less stable)</p>
            </div>
            <input
              type="checkbox"
              checked={userPreferences.allowExperimental}
              onChange={(e) => setUserPreferences(prev => ({
                ...prev,
                allowExperimental: e.target.checked
              }))}
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
          </label>
        </div>
      </div>
    </motion.div>
  );

  const CompleteStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">
          Perfect! You're All Set
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your AI coach is configured and ready to provide personalized advice. 
          You can always change these settings later in your preferences.
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div>
            <span className="font-medium text-gray-900">Preferred AI Model:</span>
            <p className="text-gray-600">{AI_MODELS[selectedModel].name}</p>
          </div>
          <div>
            <span className="font-medium text-gray-900">Coaching Style:</span>
            <p className="text-gray-600 capitalize">{selectedMode.replace('-', ' ')}</p>
          </div>
          <div>
            <span className="font-medium text-gray-900">Cost Preference:</span>
            <p className="text-gray-600">{userPreferences.preferFreeModels ? 'Free Models First' : 'Best Quality'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-900">Quality Level:</span>
            <p className="text-gray-600 capitalize">{userPreferences.qualityPreference}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={handleComplete}
          className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Sparkles className="w-5 h-5" />
          Start Coaching
        </button>
      </div>
    </motion.div>
  );

  const renderStepComponent = () => {
    switch (currentStepData.component) {
      case 'welcome': return <WelcomeStep />;
      case 'models': return <ModelsOverviewStep />;
      case 'cost-performance': return <CostPerformanceStep />;
      case 'coaching-modes': return <CoachingModesStep />;
      case 'demo': return <LiveDemoStep />;
      case 'preferences': return <PreferencesStep />;
      case 'complete': return <CompleteStep />;
      default: return <WelcomeStep />;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">AI Setup</h1>
          {onSkip && currentStep < steps.length - 1 && (
            <button
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Skip Setup
            </button>
          )}
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
          />
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
        </div>
      </div>

      {/* Step Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {currentStepData.title}
        </h2>
        <p className="text-gray-600">
          {currentStepData.subtitle}
        </p>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[400px]"
        >
          {renderStepComponent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {currentStepData.component !== 'complete' && (
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          
          <button
            onClick={nextStep}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {currentStep === steps.length - 2 ? 'Finish Setup' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}