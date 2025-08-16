'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Loader2, Lightbulb, Target } from 'lucide-react';

interface AICoachingProps {
  userData: any;
  tdeeResult: any;
}

export default function AICoaching({ userData, tdeeResult }: AICoachingProps) {
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'ai' | 'rule-based' | 'rule-based-fallback'>('rule-based');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generateCoaching();
  }, [userData, tdeeResult]);

  const generateCoaching = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/ai/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData, tdeeResult })
      });

      if (response.ok) {
        const data = await response.json();
        setTips(data.tips);
        setSource(data.source);
      } else {
        setError('Failed to generate coaching advice');
      }
    } catch (error) {
      console.error('Failed to get coaching:', error);
      setError('Network error - using cached advice');
    } finally {
      setLoading(false);
    }
  };

  const getSourceBadge = () => {
    switch (source) {
      case 'ai':
        return (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs rounded-full">
            <Sparkles className="w-3 h-3" />
            AI-Powered
          </div>
        );
      case 'rule-based':
        return (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
            <Brain className="w-3 h-3" />
            Smart Analysis
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Personal AI Coach
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Personalized insights based on your unique profile and goals
        </p>
        {getSourceBadge()}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative mb-4">
            <div className="w-12 h-12 border-4 border-purple-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600">Analyzing your profile...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️ {error}</div>
          <button
            onClick={generateCoaching}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {tips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-5 bg-gradient-to-br from-white to-purple-50 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  {index === 0 && <Target className="w-4 h-4 text-white" />}
                  {index === 1 && <Lightbulb className="w-4 h-4 text-white" />}
                  {index === 2 && <Sparkles className="w-4 h-4 text-white" />}
                  {index >= 3 && <Brain className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 leading-relaxed">{tip}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: tips.length * 0.1 + 0.2 }}
            className="text-center pt-4"
          >
            <button
              onClick={generateCoaching}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Sparkles className="w-4 h-4" />
              Get Fresh Insights
            </button>
          </motion.div>

          {/* Disclaimer */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              💡 <strong>AI-Enhanced Coaching:</strong> Combines advanced algorithms with certified trainer expertise. 
              {source === 'ai' && ' Powered by Claude 3.5 Sonnet for personalized insights.'}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}