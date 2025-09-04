'use client';

import React from 'react';
import { Brain, Sparkles, Target, TrendingUp, Calendar, Bell, BookOpen } from 'lucide-react';

import { useState } from 'react';

export default function AICoachComingSoon() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 animate-pulse">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Fitness Coach
          </h1>
          <p className="text-xl text-gray-600">Coming Soon</p>
        </div>

        {/* Preview Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Your Personal AI Fitness Coach is Almost Ready!
            </h2>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">
            We're building something special - an AI coach that actually understands your journey, 
            remembers your progress, and provides personalized guidance that evolves with you.
          </p>

          {/* Features Preview */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Personalized Coaching</h3>
                <p className="text-sm text-gray-600">
                  Tailored advice based on your TDEE results, goals, and progress
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Progress Tracking</h3>
                <p className="text-sm text-gray-600">
                  Monitors your journey and adjusts recommendations as you improve
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Smart Memory</h3>
                <p className="text-sm text-gray-600">
                  Remembers your preferences, struggles, and what works for you
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Proactive Check-ins</h3>
                <p className="text-sm text-gray-600">
                  Regular accountability and support to keep you on track
                </p>
              </div>
            </div>
          </div>

          {/* Launch Timeline */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Expected Launch</h3>
            </div>
            <p className="text-gray-700 font-medium mb-2">October 2025</p>
            <p className="text-sm text-gray-600">
              We're working hard to bring you an AI coach that's actually useful, 
              not just another chatbot. Quality takes time, but it'll be worth the wait!
            </p>
          </div>
        </div>

        {/* Educational Content - What Makes Our AI Coach Different */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            Learn: Why AI Coaching Matters
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900">🎯 The Problem with Generic Advice</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">×</span>
                  <span>One-size-fits-all meal plans ignore your lifestyle</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">×</span>
                  <span>Static calculators can't adapt to plateaus</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">×</span>
                  <span>No accountability = 92% failure rate</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900">✨ Our AI Solution</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Learns your patterns and adjusts in real-time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Detects plateaus and suggests evidence-based fixes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Daily check-ins increase success to 73%</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Science Behind It */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-3">🧬 The Science Behind Smart Coaching</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-purple-700 mb-1">Adaptive Thermogenesis</div>
                <div className="text-gray-600">Your metabolism adapts to deficits. Our AI detects this and adjusts.</div>
              </div>
              <div>
                <div className="font-medium text-purple-700 mb-1">Behavioral Psychology</div>
                <div className="text-gray-600">Uses proven habit formation techniques from Stanford research.</div>
              </div>
              <div>
                <div className="font-medium text-purple-700 mb-1">Periodization</div>
                <div className="text-gray-600">Cycles calories and training for optimal results without burnout.</div>
              </div>
            </div>
          </div>

          {/* Success Metrics */}
          <div className="mt-8 text-center">
            <h3 className="font-semibold text-gray-900 mb-4">Expected Results with AI Coaching</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">3x</div>
                <div className="text-sm text-gray-600">Better adherence</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">73%</div>
                <div className="text-sm text-gray-600">Success rate</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">2 weeks</div>
                <div className="text-sm text-gray-600">To break plateaus</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}