'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  requestNotificationPermission,
  getUserNotificationPreferences,
  saveNotificationPreferences,
  generatePersonalizedNotifications,
  scheduleNotification
} from '@/lib/notifications';

export default function NotificationManager() {
  const [showSettings, setShowSettings] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState(getUserNotificationPreferences());
  const [testSent, setTestSent] = useState(false);
  const [notificationSupported, setNotificationSupported] = useState(false);

  useEffect(() => {
    // Check notification permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermission('granted');
      
      // Schedule initial notifications
      const userData = JSON.parse(localStorage.getItem('tdee-last-result') || '{}');
      const trackingData = JSON.parse(localStorage.getItem('caloriescope-progress') || '{}');
      const notifications = generatePersonalizedNotifications(userData, trackingData);
      
      // Schedule first notification as welcome
      scheduleNotification({
        id: 'welcome',
        type: 'motivation',
        title: '🎉 Notifications enabled!',
        body: 'You\'ll receive personalized tips and reminders to help reach your goals.',
        tag: 'welcome'
      });
    } else {
      setPermission('denied');
    }
  };

  const handleTestNotification = async () => {
    await scheduleNotification({
      id: 'test',
      type: 'motivation',
      title: '✨ Test notification',
      body: 'Great! You\'ll receive helpful reminders at the times you selected.',
      tag: 'test'
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const updatePreference = (key: string, value: any) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    saveNotificationPreferences(updated);
  };

  const updateTypePreference = (type: string, enabled: boolean) => {
    const updated = {
      ...preferences,
      types: { ...preferences.types, [type]: enabled }
    };
    setPreferences(updated);
    saveNotificationPreferences(updated);
  };

  // Don't render anything if notifications aren't supported
  if (!notificationSupported) {
    return null;
  }

  return (
    <>
      {/* Floating notification button */}
      {permission !== 'granted' && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowSettings(true)}
          className="fixed bottom-24 right-6 z-40 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <Bell className="w-5 h-5" />
        </motion.button>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Notification Settings
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Permission Status */}
              {permission === 'default' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <Bell className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Enable notifications to:
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-gray-600">
                        <li>• Get weekly check-in reminders</li>
                        <li>• Receive meal timing suggestions</li>
                        <li>• Stay motivated with daily tips</li>
                        <li>• Celebrate progress milestones</li>
                      </ul>
                      <button
                        onClick={handleEnableNotifications}
                        className="mt-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Enable Notifications
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {permission === 'denied' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <BellOff className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Notifications are blocked
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Please enable notifications in your browser settings to receive helpful reminders.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {permission === 'granted' && (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <p className="text-sm font-medium text-gray-900">
                        Notifications are enabled!
                      </p>
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div className="space-y-4 mb-6">
                    <h3 className="font-medium text-gray-900">Notification Types</h3>
                    
                    {Object.entries({
                      checkIn: 'Weekly Check-ins',
                      meals: 'Meal Reminders',
                      exercise: 'Workout Reminders',
                      motivation: 'Daily Motivation',
                      progress: 'Progress Updates',
                      tips: 'Educational Tips'
                    }).map(([key, label]) => (
                      <label key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{label}</span>
                        <input
                          type="checkbox"
                          checked={preferences.types[key]}
                          onChange={(e) => updateTypePreference(key, e.target.checked)}
                          className="rounded text-orange-500 focus:ring-orange-500"
                        />
                      </label>
                    ))}
                  </div>

                  {/* Notification Times */}
                  <div className="space-y-4 mb-6">
                    <h3 className="font-medium text-gray-900">Preferred Times</h3>
                    
                    {Object.entries({
                      morningTime: 'Morning Motivation',
                      lunchTime: 'Lunch Reminder',
                      afternoonTime: 'Afternoon Check',
                      dinnerTime: 'Dinner Planning',
                      eveningTime: 'Evening Reflection'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <label className="text-sm text-gray-700">{label}</label>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <input
                            type="time"
                            value={preferences[key]}
                            onChange={(e) => updatePreference(key, e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Test Notification */}
                  <button
                    onClick={handleTestNotification}
                    disabled={testSent}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {testSent ? 'Test sent!' : 'Send Test Notification'}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}