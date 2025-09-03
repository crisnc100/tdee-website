'use client';

import { useEffect } from 'react';

export default function DarkModeProvider() {
  useEffect(() => {
    // Check for dark mode preference on mount
    const stored = localStorage.getItem('darkMode');
    if (stored === 'true') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return null;
}