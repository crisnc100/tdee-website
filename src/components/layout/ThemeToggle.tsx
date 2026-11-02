'use client';

import { Moon, Sun } from 'lucide-react';

// The icon is picked by CSS (dark: variant), so server and client render the
// same markup and there is no hydration mismatch.
export default function ThemeToggle() {
  const toggle = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      // Storage can be blocked; the toggle still works for this page view.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
    >
      <Moon className="w-5 h-5 dark:hidden" />
      <Sun className="w-5 h-5 hidden dark:block" />
    </button>
  );
}
