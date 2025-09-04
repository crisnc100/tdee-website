// Push Notification System for MyCalorieLog
// Personalized, relevant notifications based on user data

export interface NotificationSchedule {
  id: string;
  type: 'check-in' | 'meal' | 'exercise' | 'motivation' | 'progress' | 'tips';
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag: string;
  data?: any;
  scheduleTime?: number; // timestamp
  recurring?: 'daily' | 'weekly' | 'biweekly';
}

// Get user's preferred notification times based on their routine
export function getUserNotificationPreferences() {
  if (typeof window === 'undefined') {
    return getDefaultPreferences();
  }
  
  const stored = localStorage.getItem('notification-preferences');
  if (stored) return JSON.parse(stored);
  
  return getDefaultPreferences();
}

function getDefaultPreferences() {
  return {
    morningTime: '08:00',  // Morning motivation
    lunchTime: '12:00',    // Lunch meal reminder
    afternoonTime: '15:00', // Afternoon check-in
    dinnerTime: '18:00',   // Dinner planning
    eveningTime: '20:00',  // Progress reflection
    enabled: true,
    types: {
      checkIn: true,
      meals: true,
      exercise: true,
      motivation: true,
      progress: true,
      tips: true
    }
  };
}

// Generate personalized notification content based on user data
export function generatePersonalizedNotifications(userData: any, trackingData: any): NotificationSchedule[] {
  const notifications: NotificationSchedule[] = [];
  const prefs = getUserNotificationPreferences();
  
  // Get user's goal and current progress
  const goal = trackingData?.goals?.primaryGoal || 'maintain';
  const tdee = userData?.tdee || 2000;
  const name = userData?.name || 'there';
  const streak = trackingData?.streak || 0;
  
  // Weekly Check-in Reminder (Sundays)
  if (prefs.types.checkIn) {
    notifications.push({
      id: 'weekly-checkin',
      type: 'check-in',
      title: '📊 Time for your weekly check-in!',
      body: streak > 0 
        ? `Keep your ${streak}-week streak going! Quick 2-minute check-in awaits.`
        : `Track your progress and see how far you've come this week!`,
      tag: 'checkin',
      recurring: 'weekly'
    });
  }
  
  // Meal Planning Notifications (based on goal)
  if (prefs.types.meals) {
    const mealNotifications = getMealNotifications(goal, tdee);
    notifications.push(...mealNotifications);
  }
  
  // Exercise Reminders (based on routine)
  if (prefs.types.exercise && userData?.exercises?.length > 0) {
    notifications.push({
      id: 'exercise-reminder',
      type: 'exercise',
      title: '💪 Ready to crush your workout?',
      body: `Your ${userData.exercises[0].type} session awaits! Remember: consistency beats perfection.`,
      tag: 'exercise',
      recurring: 'daily'
    });
  }
  
  // Motivational Messages (varied by progress)
  if (prefs.types.motivation) {
    const motivationalMessages = getMotivationalMessages(goal, streak, trackingData);
    notifications.push(...motivationalMessages);
  }
  
  // Progress Milestones
  if (prefs.types.progress && trackingData?.checkIns?.length > 0) {
    const progressNotifications = getProgressNotifications(trackingData);
    notifications.push(...progressNotifications);
  }
  
  // Educational Tips (rotating daily)
  if (prefs.types.tips) {
    const tips = getEducationalTips(userData, goal);
    notifications.push(...tips);
  }
  
  return notifications;
}

// Meal notifications based on goals
function getMealNotifications(goal: string, tdee: number): NotificationSchedule[] {
  const notifications: NotificationSchedule[] = [];
  
  if (goal === 'lose') {
    notifications.push(
      {
        id: 'breakfast-reminder',
        type: 'meal',
        title: '🍳 Start strong with protein!',
        body: `Aim for 30g protein at breakfast. Your target: ${Math.round(tdee * 0.3)} calories.`,
        tag: 'meal-breakfast',
        recurring: 'daily'
      },
      {
        id: 'dinner-planning',
        type: 'meal',
        title: '🥗 Light dinner idea',
        body: 'Keep dinner light but satisfying. Check our volume eating recipes!',
        tag: 'meal-dinner',
        recurring: 'daily'
      }
    );
  } else if (goal === 'gain') {
    notifications.push(
      {
        id: 'snack-reminder',
        type: 'meal',
        title: '🥜 Snack time!',
        body: `Don't forget your calorie-dense snack. You need ${Math.round(tdee * 1.15)} calories today!`,
        tag: 'meal-snack',
        recurring: 'daily'
      },
      {
        id: 'pre-bed-meal',
        type: 'meal',
        title: '🥛 Pre-bed nutrition',
        body: 'Casein shake or Greek yogurt before bed helps muscle recovery!',
        tag: 'meal-prebed',
        recurring: 'daily'
      }
    );
  } else {
    notifications.push({
      id: 'balanced-meals',
      type: 'meal',
      title: '🍱 Balanced meal time',
      body: `Maintaining at ${tdee} calories? Focus on whole foods and enjoy the process!`,
      tag: 'meal-balanced',
      recurring: 'daily'
    });
  }
  
  return notifications;
}

// Motivational messages based on progress
function getMotivationalMessages(goal: string, streak: number, trackingData: any): NotificationSchedule[] {
  const messages: NotificationSchedule[] = [];
  const dayOfWeek = new Date().getDay();
  
  // Monday Motivation
  if (dayOfWeek === 1) {
    messages.push({
      id: 'monday-motivation',
      type: 'motivation',
      title: '🚀 Fresh week, fresh opportunities!',
      body: streak > 2 
        ? `Week ${streak + 1} starts now! You've got momentum on your side.`
        : 'This is YOUR week to build healthy habits!',
      tag: 'motivation-monday'
    });
  }
  
  // Wednesday Win
  if (dayOfWeek === 3) {
    messages.push({
      id: 'wednesday-win',
      type: 'motivation',
      title: '⭐ Midweek check!',
      body: "You're halfway through the week. Every small choice adds up!",
      tag: 'motivation-wednesday'
    });
  }
  
  // Friday Reflection
  if (dayOfWeek === 5) {
    messages.push({
      id: 'friday-reflection',
      type: 'motivation',
      title: '🎯 Weekend warrior mode',
      body: 'Stay consistent this weekend. Your future self will thank you!',
      tag: 'motivation-friday'
    });
  }
  
  // Goal-specific motivation
  const goalMessages: Record<string, NotificationSchedule> = {
    lose: {
      id: 'goal-motivation-lose',
      type: 'motivation',
      title: '📉 Progress over perfection',
      body: 'Remember: 1% better each day = 37x better in a year!',
      tag: 'motivation-goal'
    },
    gain: {
      id: 'goal-motivation-gain',
      type: 'motivation',
      title: '📈 Building strength',
      body: 'Every rep, every meal, every rest day matters. Trust the process!',
      tag: 'motivation-goal'
    },
    maintain: {
      id: 'goal-motivation-maintain',
      type: 'motivation',
      title: '⚖️ Balance master',
      body: "Maintaining is winning! You've found your sweet spot.",
      tag: 'motivation-goal'
    }
  };
  
  if (goalMessages[goal]) {
    messages.push(goalMessages[goal]);
  }
  
  return messages;
}

// Progress milestone notifications
function getProgressNotifications(trackingData: any): NotificationSchedule[] {
  const notifications: NotificationSchedule[] = [];
  const checkIns = trackingData.checkIns || [];
  
  if (checkIns.length > 0) {
    const latestWeight = checkIns[checkIns.length - 1].weight;
    const startWeight = checkIns[0].weight;
    const weightChange = latestWeight - startWeight;
    
    // Weight progress milestone
    if (Math.abs(weightChange) >= 2) {
      notifications.push({
        id: 'weight-milestone',
        type: 'progress',
        title: '🏆 Milestone reached!',
        body: `You've ${weightChange > 0 ? 'gained' : 'lost'} ${Math.abs(weightChange).toFixed(1)} kg! Time to celebrate this win!`,
        tag: 'progress-milestone'
      });
    }
    
    // Consistency milestone
    if (checkIns.length === 4) {
      notifications.push({
        id: 'consistency-milestone',
        type: 'progress',
        title: '🌟 1 month of consistency!',
        body: "You've been tracking for 4 weeks! This habit is becoming automatic.",
        tag: 'progress-consistency'
      });
    }
    
    // Body composition change
    if (trackingData.bodyFat?.length >= 2) {
      const bfChange = trackingData.bodyFat[trackingData.bodyFat.length - 1].value - 
                       trackingData.bodyFat[0].value;
      if (Math.abs(bfChange) >= 1) {
        notifications.push({
          id: 'bodyfat-change',
          type: 'progress',
          title: '💪 Body composition improving!',
          body: `Your body fat changed by ${Math.abs(bfChange).toFixed(1)}%! Keep up the great work!`,
          tag: 'progress-bodyfat'
        });
      }
    }
  }
  
  return notifications;
}

// Educational tips based on user profile
function getEducationalTips(userData: any, goal: string): NotificationSchedule[] {
  const tips: NotificationSchedule[] = [];
  const dayIndex = new Date().getDay();
  
  const tipRotation = [
    {
      id: 'tip-protein',
      type: 'tips' as const,
      title: '💡 Protein timing tip',
      body: 'Spread protein intake across 3-4 meals for optimal muscle synthesis.',
      tag: 'tip-nutrition'
    },
    {
      id: 'tip-hydration',
      type: 'tips' as const,
      title: '💧 Hydration reminder',
      body: `Aim for ${userData?.weight ? Math.round(userData.weight * 0.033) : 2}L of water today. Your muscles are 75% water!`,
      tag: 'tip-hydration'
    },
    {
      id: 'tip-sleep',
      type: 'tips' as const,
      title: '😴 Sleep = Results',
      body: 'Poor sleep increases hunger hormones. Aim for 7-9 hours tonight!',
      tag: 'tip-recovery'
    },
    {
      id: 'tip-neat',
      type: 'tips' as const,
      title: '🚶 NEAT hack',
      body: `Adding 2,000 steps burns ~${Math.round(userData?.weight * 0.045) || 100} extra calories!`,
      tag: 'tip-activity'
    },
    {
      id: 'tip-fiber',
      type: 'tips' as const,
      title: '🥦 Fiber focus',
      body: goal === 'lose' 
        ? 'High fiber foods keep you full longer. Aim for 25-35g daily!'
        : 'Balance fiber intake to avoid feeling too full when bulking.',
      tag: 'tip-nutrition'
    },
    {
      id: 'tip-recovery',
      type: 'tips' as const,
      title: '🧘 Rest day wisdom',
      body: 'Muscles grow during recovery, not during workouts. Rest is productive!',
      tag: 'tip-recovery'
    },
    {
      id: 'tip-consistency',
      type: 'tips' as const,
      title: '📅 The 80/20 rule',
      body: 'Being on track 80% of the time yields 100% of long-term results!',
      tag: 'tip-mindset'
    }
  ];
  
  // Rotate tips based on day
  tips.push(tipRotation[dayIndex]);
  
  return tips;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    // console.log('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// Schedule a notification
export async function scheduleNotification(notification: NotificationSchedule) {
  const permission = await requestNotificationPermission();
  if (!permission) return false;
  
  // Get service worker registration
  const registration = await navigator.serviceWorker.ready;
  
  // Show notification through service worker
  await registration.showNotification(notification.title, {
    body: notification.body,
    icon: notification.icon || '/icons/icon-192x192.png',
    badge: notification.badge || '/icons/icon-72x72.png',
    tag: notification.tag,
    data: notification.data,
    requireInteraction: false,
    silent: false
  });
  
  return true;
}

// Save notification preferences
export function saveNotificationPreferences(preferences: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('notification-preferences', JSON.stringify(preferences));
  }
}

// Get next notification time
export function getNextNotificationTime(recurringType: string, baseTime?: string): Date {
  const now = new Date();
  const next = new Date();
  
  if (baseTime) {
    const [hours, minutes] = baseTime.split(':').map(Number);
    next.setHours(hours, minutes, 0, 0);
  }
  
  switch (recurringType) {
    case 'daily':
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;
    case 'weekly':
      next.setDate(next.getDate() + (7 - next.getDay())); // Next Sunday
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
  }
  
  return next;
}