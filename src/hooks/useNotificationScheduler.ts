import { useEffect } from 'react';
import { 
  generatePersonalizedNotifications, 
  scheduleNotification,
  getNextNotificationTime 
} from '@/lib/notifications';

export function useNotificationScheduler() {
  useEffect(() => {
    // Only run in browser and if notifications are supported and granted
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // Check and schedule notifications on app load
    const checkAndScheduleNotifications = () => {
      const userData = JSON.parse(localStorage.getItem('tdee-last-result') || '{}');
      const trackingData = JSON.parse(localStorage.getItem('caloriescope-progress') || '{}');
      
      if (!userData.tdee) return; // No TDEE calculation yet
      
      // Generate personalized notifications
      const notifications = generatePersonalizedNotifications(userData, trackingData);
      
      // Schedule each notification based on preferences
      const prefs = JSON.parse(localStorage.getItem('notification-preferences') || '{}');
      
      notifications.forEach(notification => {
        // Check if this type is enabled
        if (!prefs.types?.[notification.type]) return;
        
        // Calculate next schedule time
        let scheduleTime: Date;
        
        switch (notification.type) {
          case 'check-in':
            // Weekly on Sunday at evening time
            scheduleTime = getNextNotificationTime('weekly', prefs.eveningTime);
            break;
          case 'meal':
            // Daily at meal times
            if (notification.id.includes('breakfast')) {
              scheduleTime = getNextNotificationTime('daily', prefs.morningTime);
            } else if (notification.id.includes('lunch')) {
              scheduleTime = getNextNotificationTime('daily', prefs.lunchTime);
            } else if (notification.id.includes('dinner')) {
              scheduleTime = getNextNotificationTime('daily', prefs.dinnerTime);
            } else {
              scheduleTime = getNextNotificationTime('daily', prefs.afternoonTime);
            }
            break;
          case 'exercise':
            // Daily at morning time
            scheduleTime = getNextNotificationTime('daily', prefs.morningTime);
            break;
          case 'motivation':
            // Daily at different times based on message
            if (notification.id.includes('monday')) {
              scheduleTime = getNextNotificationTime('weekly', prefs.morningTime);
            } else if (notification.id.includes('friday')) {
              scheduleTime = getNextNotificationTime('weekly', prefs.afternoonTime);
            } else {
              scheduleTime = getNextNotificationTime('daily', prefs.morningTime);
            }
            break;
          case 'tips':
            // Daily at afternoon time
            scheduleTime = getNextNotificationTime('daily', prefs.afternoonTime);
            break;
          default:
            scheduleTime = getNextNotificationTime('daily', prefs.eveningTime);
        }
        
        // Store scheduled time to avoid duplicates
        const scheduledKey = `notification-scheduled-${notification.id}`;
        const lastScheduled = localStorage.getItem(scheduledKey);
        
        if (!lastScheduled || new Date(lastScheduled) < new Date()) {
          // Schedule using setTimeout for demo (in production, use service worker with proper scheduling)
          const delay = scheduleTime.getTime() - Date.now();
          
          if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // Only schedule if within 24 hours
            setTimeout(() => {
              scheduleNotification(notification);
              localStorage.setItem(scheduledKey, new Date().toISOString());
            }, delay);
          }
        }
      });
    };

    // Initial check
    checkAndScheduleNotifications();
    
    // Re-check every hour
    const interval = setInterval(checkAndScheduleNotifications, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
}

// Hook to trigger immediate notifications for specific events
export function useTriggerNotification() {
  const triggerMilestone = (type: 'weight' | 'streak' | 'checkin', value: any) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
    
    const milestoneMessages = {
      weight: {
        title: '🎯 Weight goal progress!',
        body: `You've made progress toward your goal! ${value}kg change recorded.`
      },
      streak: {
        title: `🔥 ${value} week streak!`,
        body: value >= 4 
          ? "One month of consistency! You're building lasting habits!"
          : "Keep it up! Consistency is the key to success."
      },
      checkin: {
        title: '✅ Check-in complete!',
        body: 'Great job staying on track! See you next week.'
      }
    };
    
    const message = milestoneMessages[type];
    if (message) {
      scheduleNotification({
        id: `milestone-${type}`,
        type: 'progress',
        title: message.title,
        body: message.body,
        tag: `milestone-${type}`,
        data: { type, value }
      });
    }
  };
  
  const triggerMealReminder = (mealType: string, calories: number) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
    
    scheduleNotification({
      id: `meal-reminder-${mealType}`,
      type: 'meal',
      title: `🍽️ Time for ${mealType}!`,
      body: `Aim for around ${calories} calories. Check our meal suggestions for ideas.`,
      tag: 'meal-reminder',
      data: { mealType, calories }
    });
  };
  
  const triggerWorkoutReminder = (exerciseType: string) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
    
    scheduleNotification({
      id: 'workout-reminder',
      type: 'exercise', 
      title: '💪 Workout time!',
      body: `Your ${exerciseType} session is scheduled. Remember to warm up!`,
      tag: 'workout',
      data: { exerciseType }
    });
  };
  
  return {
    triggerMilestone,
    triggerMealReminder,
    triggerWorkoutReminder
  };
}