import Link from 'next/link';
import { Calculator } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="w-full bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 md:space-x-3">
            <div className="p-1.5 md:p-2 bg-accent rounded-lg">
              <Calculator className="w-5 h-5 md:w-6 md:h-6 text-accent-foreground" />
            </div>
            <h1 className="text-lg md:text-2xl font-bold text-white">
              TDEE Calculator
            </h1>
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
