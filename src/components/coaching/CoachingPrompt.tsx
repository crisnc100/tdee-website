'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';
import { useCoachingModal } from '@/hooks/useCoachingModal';
import CoachingModal from './CoachingModal';

export default function CoachingPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { isOpen, source, openModal, closeModal } = useCoachingModal();

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const isDismissed = localStorage.getItem('coachingPromptDismissed');
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Check user activity
    const checkActivity = () => {
      const visits = parseInt(localStorage.getItem('visitCount') || '0');
      const lastCalculation = localStorage.getItem('lastTDEECalculation');
      const hasUsedAI = localStorage.getItem('hasUsedAICoach');
      
      // Show prompt if user has:
      // - Visited 3+ times OR
      // - Calculated TDEE at least once OR
      // - Used AI coach
      if (visits >= 3 || lastCalculation || hasUsedAI) {
        // Delay showing prompt by 30 seconds after page load
        setTimeout(() => {
          if (!dismissed) {
            setShowPrompt(true);
          }
        }, 30000);
      }
    };

    checkActivity();
  }, [dismissed]);

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('coachingPromptDismissed', 'true');
  };

  const handleOpenModal = () => {
    setShowPrompt(false);
    openModal('other');
  };

  return (
    <>
      <AnimatePresence>
        {showPrompt && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 right-4 max-w-sm bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-40"
          >
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm">
                  Ready to accelerate your progress?
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  Get personalized guidance from a certified trainer. Free consultation available!
                </p>
                <button
                  onClick={handleOpenModal}
                  className="mt-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Learn More
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <CoachingModal 
        isOpen={isOpen}
        onClose={closeModal}
        source={source}
      />
    </>
  );
}