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
      className="inline-flex items-center justify-center w-11 h-11 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-border-strong transition-colors cursor-pointer"
    >
      <Moon className="w-4 h-4 dark:hidden" />
      <Sun className="w-4 h-4 hidden dark:block" />
    </button>
  );
}
