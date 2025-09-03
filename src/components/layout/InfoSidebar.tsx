'use client';

import { motion } from 'framer-motion';
import { Shield, Target, TrendingUp, Users } from 'lucide-react';

export default function InfoSidebar() {
  return (
    <div className="space-y-6">
      {/* Privacy First */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl p-6 border border-white/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Privacy First</h3>
        </div>
        <p className="text-sm text-gray-600">
          No accounts required. All calculations and tracking happen locally in your browser. 
          Your data never leaves your device.
        </p>
      </motion.div>

      {/* About Creator */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl p-6 border border-white/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">About MyCalorieLog</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          I created this calculator because understanding your calorie needs is fundamental to achieving any fitness goal. 
          Most online calculators are inaccurate, with studies showing error margins of 20-40%. These false numbers can derail your progress.
        </p>
        <p className="text-sm text-gray-600 mb-3">
          While no calculator is perfect, I've minimized the error margin by accounting for factors others ignore. 
          This helps anyone, anywhere get a more accurate foundation for their fitness journey.
        </p>
        <div className="text-xs bg-primary-50 text-primary-800 px-3 py-2 rounded-lg">
          <strong>Created by:</strong> Cristian Ortega, CPT (NASM-CPT, Precision Nutrition Level 1)
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl p-6 border border-white/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-accent-600" />
          <h3 className="font-semibold text-gray-900">How It Works</h3>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex gap-3">
            <span className="font-medium text-accent-600 min-w-[20px]">1.</span>
            <span>Calculate your Base Metabolic Rate (BMR)</span>
          </div>
          <div className="flex gap-3">
            <span className="font-medium text-accent-600 min-w-[20px]">2.</span>
            <span>Factor in muscle mass and body composition</span>
          </div>
          <div className="flex gap-3">
            <span className="font-medium text-accent-600 min-w-[20px]">3.</span>
            <span>Add job activity and daily movement (NEAT)</span>
          </div>
          <div className="flex gap-3">
            <span className="font-medium text-accent-600 min-w-[20px]">4.</span>
            <span>Include exercise and recovery needs</span>
          </div>
          <div className="flex gap-3">
            <span className="font-medium text-accent-600 min-w-[20px]">5.</span>
            <span>Provide confidence intervals for accuracy</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Tips */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl p-6 border border-white/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Quick Tips</h3>
        </div>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>Track your weight for 2-3 weeks to validate results</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>Recalculate when weight changes by ±10 lbs</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>Use the confidence range for better accuracy</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>Body fat % measurement improves precision</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}