import { Calculator, Target, TrendingUp } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="w-full bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="p-1.5 md:p-2 bg-accent rounded-lg">
              <Calculator className="w-5 h-5 md:w-6 md:h-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-white">
                MyCalorieLog
              </h1>
              <p className="text-xs md:text-sm text-gray-400 hidden sm:block">
                by OrtegaFit
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 text-gray-300">
              <Target className="w-4 h-4" />
              <span className="text-sm">The Better No BS</span>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-gray-300">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Calorie Calculator</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Features Bar */}
        <div className="md:hidden flex items-center justify-center gap-4 mt-2 pt-2 border-t border-gray-700">
          <div className="flex items-center gap-1 text-gray-300">
            <Target className="w-3 h-3" />
            <span className="text-xs">The Better No BS</span>
          </div>
          <div className="w-px h-3 bg-gray-600"></div>
          <div className="flex items-center gap-1 text-gray-300">
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs">Calorie Calculator</span>
          </div>
        </div>
      </div>
    </header>
  );
}
