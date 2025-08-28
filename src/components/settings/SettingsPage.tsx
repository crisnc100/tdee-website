'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  User,
  Bell,
  Shield,
  Brain,
  ArrowLeft,
  Save,
  Check
} from 'lucide-react';
import AIModelSettings from './AIModelSettings';

interface SettingsPageProps {
  onBack?: () => void;
  initialTab?: 'ai' | 'profile' | 'notifications' | 'privacy';
}

/**
 * Complete Settings Page Component
 * 
 * Provides a comprehensive settings interface including AI model preferences,
 * user profile settings, notification preferences, and privacy controls.
 */
export default function SettingsPage({ onBack, initialTab = 'ai' }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const tabs = [
    {
      id: 'ai',
      label: 'AI Models',
      icon: Brain,
      description: 'Configure AI model preferences and cost controls'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      description: 'Personal information and calculation preferences'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Notification schedule and preferences'
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: Shield,
      description: 'Data handling and privacy settings'
    }
  ];

  const handleSave = async () => {
    setSaveStatus('saving');
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-purple-600" />
                  Settings
                </h1>
                <p className="text-gray-600">Customize your My Calorie Needs experience</p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                ${saveStatus === 'saved'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : saveStatus === 'saving'
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {saveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : saveStatus === 'saving' ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Categories</h2>
              </div>
              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
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
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-xs text-gray-500 leading-tight">
                          {tab.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                  Reset All Settings
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                  Export Settings
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                  Import Settings
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg border border-gray-200 min-h-[600px]"
            >
              {/* AI Models Tab */}
              {activeTab === 'ai' && (
                <div className="p-6">
                  <AIModelSettings />
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <div className="max-w-2xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Settings</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter your display name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Units
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                          <option value="metric">Metric (kg, cm)</option>
                          <option value="imperial">Imperial (lbs, ft/in)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Goal
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                          <option value="lose">Lose Weight</option>
                          <option value="maintain">Maintain Weight</option>
                          <option value="gain">Gain Weight</option>
                          <option value="recomp">Body Recomposition</option>
                        </select>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-900">Profile Completion</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Complete your profile to get more personalized AI recommendations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <div className="max-w-2xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h3>
                    
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">Coaching Reminders</h4>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">Daily check-in reminders</span>
                          </label>
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">Weekly progress reviews</span>
                          </label>
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">Meal planning suggestions</span>
                          </label>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">AI Notifications</h4>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">New model availability</span>
                          </label>
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">Cost limit warnings</span>
                          </label>
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">Model performance updates</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="p-6">
                  <div className="max-w-2xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Privacy & Data</h3>
                    
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">Data Storage</h4>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">Store calculation history locally</span>
                          </label>
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">Save AI conversation history</span>
                          </label>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">Analytics</h4>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">Allow anonymous usage analytics</span>
                          </label>
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">Share AI model performance data</span>
                          </label>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-900">Privacy Commitment</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          All data is stored locally on your device. We never send personal information to external services without your explicit consent.
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