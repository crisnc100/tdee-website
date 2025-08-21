'use client';

import { useNotificationScheduler } from '@/hooks/useNotificationScheduler';

export default function NotificationSchedulerProvider() {
  useNotificationScheduler();
  return null;
}