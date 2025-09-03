'use client';

import { useEffect } from 'react';

export default function VisitTracker() {
  useEffect(() => {
    // Increment visit count
    const visits = parseInt(localStorage.getItem('visitCount') || '0');
    localStorage.setItem('visitCount', (visits + 1).toString());
    
    // Track last visit
    localStorage.setItem('lastVisit', new Date().toISOString());
  }, []);

  return null;
}