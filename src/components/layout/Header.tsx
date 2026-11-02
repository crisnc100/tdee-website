import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { Reticle } from '@/components/ui/lab';

export default function Header() {
  return (
    <header className="w-full sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-14">
          <Link
            href="/"
            className="flex items-center gap-2.5 min-h-11 text-foreground hover:text-accent-ink transition-colors"
          >
            <Reticle className="w-5 h-5 text-accent-ink" />
            <h1 className="label-caps text-sm text-foreground">
              TDEE<span className="sr-only"> </span>
              <span aria-hidden="true" className="text-muted-foreground mx-1.5">
                {'//'}
              </span>
              Calculator
            </h1>
          </Link>

          <ThemeToggle />
        </div>
      </div>
      <div aria-hidden="true" className="ruler opacity-70" />
    </header>
  );
}
