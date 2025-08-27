'use client';

/**
 * Client-side React hook for user preferences
 * 
 * This file contains the React hook implementation that was moved from
 * userPreferences.ts to avoid server-side compilation issues.
 */

import { useState } from 'react';
import { 
  userPreferencesManager, 
  ExtendedUserPreferences,
  type ModelUsageStats,
  type CostTrackingData
} from '@/lib/userPreferences';
import { AIModelId } from '@/types/ai';

/**
 * React hook for user preferences
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<ExtendedUserPreferences>(
    userPreferencesManager.getPreferences()
  );

  const updatePreferences = (updates: Partial<ExtendedUserPreferences>) => {
    const newPrefs = userPreferencesManager.updatePreferences(updates);
    setPreferences(newPrefs);
  };

  const getAIPreferences = () => userPreferencesManager.getAIPreferences();

  const trackModelUsage = (modelId: AIModelId, responseTime: number, cost: number, success: boolean) => {
    userPreferencesManager.trackModelUsage(modelId, responseTime, cost, success);
  };

  return {
    preferences,
    updatePreferences,
    getAIPreferences,
    trackModelUsage,
    resetToDefaults: () => {
      const newPrefs = userPreferencesManager.resetToDefaults();
      setPreferences(newPrefs);
    },
    exportPreferences: userPreferencesManager.exportPreferences.bind(userPreferencesManager),
    importPreferences: userPreferencesManager.importPreferences.bind(userPreferencesManager),
    getModelUsageStats: userPreferencesManager.getModelUsageStats.bind(userPreferencesManager),
    getCostTracking: userPreferencesManager.getCostTracking.bind(userPreferencesManager),
    rateModel: userPreferencesManager.rateModel.bind(userPreferencesManager)
  };
}