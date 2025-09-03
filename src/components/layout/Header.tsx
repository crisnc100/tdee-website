'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Target, TrendingUp, Settings, Brain, User, Menu, X, Moon, Sun } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';

interface HeaderProps {
  onSettingsClick?: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const { darkMode, toggleDarkMode } = useDarkMode();

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettingsMenu]);
  
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50"
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
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                MyCalorieLog
              </h1>
              <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
                by OrtegaFit
              </p>
            </div>
          </motion.div>

          {/* Mobile Install Button */}
          <button
            id="install-app-header"
            className="md:hidden px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1"
            style={{ display: 'none' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Install
          </button>

          {/* Desktop Features and Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-600">
              <Target className="w-4 h-4" />
              <span className="text-sm">The Better No BS</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Calorie Calculator</span>
            </div>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            
            {/* Settings Dropdown */}
            <div className="relative" ref={settingsMenuRef}>
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                title="Settings & AI Models"
              >
                <Settings className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showSettingsMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Settings & Preferences</h3>
                      <p className="text-sm text-gray-600">Customize your experience</p>
                    </div>
                    
                    <div className="p-2">
                      <button
                        onClick={() => {
                          onSettingsClick?.();
                          setShowSettingsMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Brain className="w-4 h-4 text-purple-600" />
                        <div>
                          <div className="font-medium">AI Model Settings</div>
                          <div className="text-xs text-gray-500">Configure AI preferences</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          onSettingsClick?.();
                          setShowSettingsMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-medium">Profile Settings</div>
                          <div className="text-xs text-gray-500">Personal preferences</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          onSettingsClick?.();
                          setShowSettingsMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Settings className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="font-medium">All Settings</div>
                          <div className="text-xs text-gray-500">Complete settings page</div>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              id="install-app-header-desktop"
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
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
        <div className="md:hidden flex items-center justify-center gap-4 mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1 text-gray-600">
            <Target className="w-3 h-3" />
            <span className="text-xs">The Better No BS</span>
          </div>
          <div className="w-px h-3 bg-gray-300"></div>
          <div className="flex items-center gap-1 text-gray-600">
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs">Calorie Calculator</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}