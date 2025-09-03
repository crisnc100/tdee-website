'use client';

import { useState, useCallback } from 'react';

export function useCoachingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState<'footer' | 'results' | 'other'>('other');

  const openModal = useCallback((modalSource: 'footer' | 'results' | 'other' = 'other') => {
    setSource(modalSource);
    setIsOpen(true);
    
    // Track event in localStorage for analytics
    const events = JSON.parse(localStorage.getItem('coachingEvents') || '[]');
    events.push({
      source: modalSource,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('coachingEvents', JSON.stringify(events));
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    source,
    openModal,
    closeModal
  };
}