'use client';

import { useState } from 'react';
import { Bell, CheckCircle, Clock, Zap, Heart, Trophy, Coffee } from 'lucide-react';
import { scheduleNotification } from '@/lib/notifications';

export default function NotificationTester() {
  const [testStatus, setTestStatus] = useState<string>('');

  const testNotifications = [
    {
      id: 'test-welcome',
      icon: <Bell className="w-4 h-4" />,
      title: 'Welcome Test',
      notification: {
        title: '👋 Welcome to CalorieScope!',
        body: 'Notifications are working! You\'ll receive personalized tips.',
        tag: 'test-welcome'
      }
    },
    {
      id: 'test-checkin',
      icon: <CheckCircle className="w-4 h-4" />,
      title: 'Check-in Reminder',
      notification: {
        title: '📊 Time for your weekly check-in!',
        body: 'Track your progress and keep your streak going!',
        tag: 'test-checkin',
        data: { type: 'check-in' }
      }
    },
    {
      id: 'test-meal',
      icon: <Coffee className="w-4 h-4" />,
      title: 'Meal Reminder',
      notification: {
        title: '🍳 Breakfast time!',
        body: 'Start strong with 30g protein. Target: 450 calories.',
        tag: 'test-meal',
        data: { type: 'meal' }
      }
    },
    {
      id: 'test-workout',
      icon: <Zap className="w-4 h-4" />,
      title: 'Workout Time',
      notification: {
        title: '💪 Ready to crush your workout?',
        body: 'Your strength training session awaits!',
        tag: 'test-workout',
        data: { type: 'exercise' }
      }
    },
    {
      id: 'test-motivation',
      icon: <Heart className="w-4 h-4" />,
      title: 'Daily Motivation',
      notification: {
        title: '🚀 Monday Motivation!',
        body: 'This is YOUR week to build healthy habits!',
        tag: 'test-motivation'
      }
    },
    {
      id: 'test-milestone',
      icon: <Trophy className="w-4 h-4" />,
      title: 'Milestone Alert',
      notification: {
        title: '🏆 Milestone reached!',
        body: 'You\'ve lost 2.5 kg! Time to celebrate this win!',
        tag: 'test-milestone',
        data: { type: 'progress' }
      }
    }
  ];

  const sendTestNotification = async (test: typeof testNotifications[0]) => {
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setTestStatus('Permission denied. Please enable notifications in browser settings.');
        return;
      }
    }

    try {
      await scheduleNotification({
        id: test.id,
        type: 'motivation',
        title: test.notification.title,
        body: test.notification.body,
        tag: test.notification.tag,
        data: test.notification.data
      });
      setTestStatus(`✅ "${test.title}" notification sent!`);
      setTimeout(() => setTestStatus(''), 3000);
    } catch (error) {
      setTestStatus('❌ Failed to send notification');
      console.error(error);
    }
  };

  const scheduleDelayedNotification = async (seconds: number) => {
    if (Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }

    setTimeout(() => {
      scheduleNotification({
        id: 'test-delayed',
        type: 'motivation',
        title: `⏰ Delayed notification (${seconds}s)`,
        body: 'This notification was scheduled to arrive after a delay!',
        tag: 'test-delayed'
      });
    }, seconds * 1000);
    
    setTestStatus(`⏱️ Notification scheduled for ${seconds} seconds from now...`);
  };

  return (
    <div className="fixed bottom-32 right-6 z-40 bg-white rounded-2xl shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Bell className="w-5 h-5 text-orange-500" />
        Notification Tester
      </h3>
      
      <div className="space-y-2 mb-3">
        {testNotifications.map((test) => (
          <button
            key={test.id}
            onClick={() => sendTestNotification(test)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left text-sm"
          >
            <span className="text-orange-500">{test.icon}</span>
            <span className="flex-1 text-gray-700">{test.title}</span>
          </button>
        ))}
      </div>

      <div className="border-t pt-3">
        <p className="text-xs text-gray-600 mb-2">Test with delay:</p>
        <div className="flex gap-2">
          {[5, 10, 30].map((seconds) => (
            <button
              key={seconds}
              onClick={() => scheduleDelayedNotification(seconds)}
              className="flex-1 px-2 py-1 bg-orange-100 hover:bg-orange-200 rounded text-xs font-medium text-orange-700 transition-colors"
            >
              {seconds}s
            </button>
          ))}
        </div>
      </div>

      {testStatus && (
        <div className="mt-3 p-2 bg-gray-100 rounded-lg text-xs text-gray-700">
          {testStatus}
        </div>
      )}
    </div>
  );
}