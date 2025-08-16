'use client';

import { motion } from 'framer-motion';
import { Calculator, Target, TrendingUp } from 'lucide-react';

export default function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="p-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                CalorieScope
              </h1>
              <p className="text-sm text-gray-600">
                By Cristian Ortega, CPT
              </p>
            </div>
          </motion.div>

          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-600">
              <Target className="w-4 h-4" />
              <span className="text-sm">Advanced Formula</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">7-Component Analysis</span>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}