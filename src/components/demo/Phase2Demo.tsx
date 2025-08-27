'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Settings, 
  Users, 
  DollarSign, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp
} from 'lucide-react';
import AIModelSettings from '../settings/AIModelSettings';
import SettingsPage from '../settings/SettingsPage';
import AIModelSwitcher from '../ai/AIModelSwitcher';
import AICoaching from '../ai/AICoaching';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { AIModelId } from '@/types/ai';

/**
 * Phase 2 Implementation Demo
 * 
 * Demonstrates the complete user settings and preferences system
 * including AI model selection, cost controls, and usage analytics.
 */
export default function Phase2Demo() {
  const [activeDemo, setActiveDemo] = useState<'overview' | 'settings' | 'switcher' | 'integration'>('overview');
  const [selectedModel, setSelectedModel] = useState<AIModelId | undefined>();
  const { preferences, getModelUsageStats, getCostTracking } = useUserPreferences();

  const demos = [
    {
      id: 'overview',
      title: 'System Overview',
      description: 'Complete user preferences and AI model management system',
      icon: Brain,
      features: [
        'Multi-model AI preference management',
        'Real-time cost tracking and controls',
        'User-friendly model selection interface',
        'Persistent preferences storage',
        'Usage analytics and recommendations'
      ]
    },
    {
      id: 'settings',
      title: 'AI Model Settings',
      description: 'Comprehensive settings interface for AI preferences',
      icon: Settings,
      features: [
        'Model selection with performance indicators',
        'Cost limits and quality preferences',
        'Usage statistics and model ratings',
        'Data import/export capabilities'
      ]
    },
    {
      id: 'switcher',
      title: 'Quick Model Switcher',
      description: 'Fast model switching for AI components',
      icon: Zap,
      features: [
        'Dropdown model selection',
        'Real-time cost estimates',
        'Performance indicators',
        'User rating display'
      ]
    },
    {
      id: 'integration',
      title: 'Live Integration',
      description: 'Working example with AI coaching component',
      icon: Users,
      features: [
        'Model switching in real AI component',
        'Preference-aware API calls',
        'Usage tracking and analytics',
        'Cost optimization in action'
      ]
    }
  ];

  const achievements = [
    {
      title: 'User Preferences Storage',
      description: 'Complete localStorage-based preference management with validation',
      status: 'completed'
    },
    {
      title: 'AI Model Settings UI',
      description: 'Comprehensive settings interface with model selection and cost controls',
      status: 'completed'
    },
    {
      title: 'Quick Model Switcher',
      description: 'Compact dropdown component for easy model switching',
      status: 'completed'
    },
    {
      title: 'Settings Integration',
      description: 'Header navigation and settings page integration',
      status: 'completed'
    },
    {
      title: 'API Enhancement',
      description: 'Updated AI APIs to support user preferences and model selection',
      status: 'completed'
    },
    {
      title: 'Usage Analytics',
      description: 'Cost tracking, model statistics, and recommendation system',
      status: 'completed'
    }
  ];

  // Sample data for integration demo
  const sampleUserData = {
    age: 30,
    gender: 'male',
    weight: 180,
    units: 'imperial',
    jobActivity: 'desk',
    steps: 8000,
    exercises: [
      { type: 'weight_lifting', intensity: 'moderate', minutes: 45, frequency: 4 }
    ],
    goal: 'maintain'
  };

  const sampleTdeeResult = {
    tdee: 2650,
    bmr: 1820,
    components: {
      bmr: 1820,
      jobActivity: 365,
      neat: 240,
      exercise: 180,
      muscleRecovery: 45
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Phase 2: User Settings & Preferences
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Complete implementation of user-friendly AI model management and preferences
            </p>
            
            {/* Status indicators */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>6/6 Features Complete</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <DollarSign className="w-4 h-4" />
                <span>Cost Optimization Active</span>
              </div>
              <div className="flex items-center gap-2 text-purple-600">
                <Brain className="w-4 h-4" />
                <span>3 AI Models Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Demo Navigation */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">Demonstrations</h2>
                </div>
                <nav className="p-2">
                  {demos.map((demo) => {
                    const Icon = demo.icon;
                    const isActive = activeDemo === demo.id;
                    
                    return (
                      <button
                        key={demo.id}
                        onClick={() => setActiveDemo(demo.id as any)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left
                          transition-all duration-200 group
                          ${isActive
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{demo.title}</div>
                          <div className="text-xs text-gray-500 leading-tight">
                            {demo.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Achievement List */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">Implementation Status</h2>
                </div>
                <div className="p-4 space-y-3">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">
                          {achievement.title}
                        </div>
                        <div className="text-xs text-gray-600 leading-tight">
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeDemo}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Overview */}
              {activeDemo === 'overview' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Phase 2 Implementation Overview
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Key Components Created</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-blue-500" />
                            <code className="bg-gray-100 px-2 py-1 rounded">/lib/userPreferences.ts</code>
                          </li>
                          <li className="flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-blue-500" />
                            <code className="bg-gray-100 px-2 py-1 rounded">/components/settings/AIModelSettings.tsx</code>
                          </li>
                          <li className="flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-blue-500" />
                            <code className="bg-gray-100 px-2 py-1 rounded">/components/ai/AIModelSwitcher.tsx</code>
                          </li>
                          <li className="flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-blue-500" />
                            <code className="bg-gray-100 px-2 py-1 rounded">/components/settings/SettingsPage.tsx</code>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Features Implemented</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Persistent user preference storage
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Real-time cost tracking and controls
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Model performance analytics
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Quick model switching interface
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Settings page integration
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Current User Preferences</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Quality:</span>
                          <div className="font-medium text-blue-900 capitalize">{preferences.qualityPreference}</div>
                        </div>
                        <div>
                          <span className="text-blue-700">Free Models:</span>
                          <div className="font-medium text-blue-900">{preferences.preferFreeModels ? 'Preferred' : 'Not Preferred'}</div>
                        </div>
                        <div>
                          <span className="text-blue-700">Cost Limit:</span>
                          <div className="font-medium text-blue-900">${(preferences.maxCostPerRequest || 0.01).toFixed(3)}</div>
                        </div>
                        <div>
                          <span className="text-blue-700">Quick Switch:</span>
                          <div className="font-medium text-blue-900">{preferences.quickSwitchModels.length} models</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Demo */}
              {activeDemo === 'settings' && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">AI Model Settings Interface</h3>
                    <p className="text-gray-600">Complete settings management with model selection, cost controls, and analytics</p>
                  </div>
                  <div className="p-6">
                    <AIModelSettings />
                  </div>
                </div>
              )}

              {/* Switcher Demo */}
              {activeDemo === 'switcher' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Model Switcher</h3>
                    <p className="text-gray-600 mb-6">
                      Compact dropdown component for easy model switching in AI interfaces
                    </p>
                    
                    <div className="max-w-md">
                      <AIModelSwitcher
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                        showCostEstimate={true}
                      />
                    </div>
                    
                    {selectedModel && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg">
                        <p className="text-green-800">
                          ✅ Selected model: <strong>{selectedModel}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Compact Version</h3>
                    <div className="max-w-xs">
                      <AIModelSwitcher
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                        showCostEstimate={false}
                        compact={true}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Integration Demo */}
              {activeDemo === 'integration' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Live AI Integration</h3>
                    <p className="text-gray-600 mb-6">
                      Working example showing model switching in a real AI component with preference integration
                    </p>
                    
                    <div className="bg-gray-50 rounded-lg p-6">
                      <AICoaching 
                        userData={sampleUserData}
                        tdeeResult={sampleTdeeResult}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Benefits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <Star className="w-6 h-6 text-purple-600 mb-2" />
                        <h4 className="font-medium text-purple-900">User Control</h4>
                        <p className="text-sm text-purple-700">
                          Users can switch AI models on-demand for different tasks
                        </p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <DollarSign className="w-6 h-6 text-green-600 mb-2" />
                        <h4 className="font-medium text-green-900">Cost Optimization</h4>
                        <p className="text-sm text-green-700">
                          Automatic preference for free models with cost limits
                        </p>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-blue-600 mb-2" />
                        <h4 className="font-medium text-blue-900">Usage Analytics</h4>
                        <p className="text-sm text-blue-700">
                          Track performance and costs across all AI interactions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}