'use client';

import { motion } from 'framer-motion';
import { Calculator, Target, TrendingUp } from 'lucide-react';

interface HeaderProps {
  onSettingsClick?: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full bg-gray-900 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-2 md:space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="p-1.5 md:p-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg">
              <Calculator className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-white">
                MyCalorieLog
              </h1>
              <p className="text-xs md:text-sm text-gray-400 hidden sm:block">
                by OrtegaFit
              </p>
            </div>
          </motion.div>

          {/* Mobile Install Button */}
          <button
            id="install-app-header"
            className="md:hidden px-3 py-1.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1"
            style={{ display: 'none' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Install
          </button>

          {/* Desktop Features and Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-300">
              <Target className="w-4 h-4" />
              <span className="text-sm">The Better No BS</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Calorie Calculator</span>
            </div>
            
            {/* Settings and Dark Mode removed for MVP */}

            <button
              id="install-app-header-desktop"
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
              style={{ display: 'none' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v-6m0 0l3 3m-3-3l-3 3m8-10h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2" />
              </svg>
              Install App
            </button>
          </div>
        </div>

        {/* Mobile Features Bar */}
        <div className="md:hidden flex items-center justify-center gap-4 mt-2 pt-2 border-t border-gray-700">
          <div className="flex items-center gap-1 text-gray-300">
            <Target className="w-3 h-3" />
            <span className="text-xs">The Better No BS</span>
          </div>
          <div className="w-px h-3 bg-gray-600"></div>
          <div className="flex items-center gap-1 text-gray-300">
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs">Calorie Calculator</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}