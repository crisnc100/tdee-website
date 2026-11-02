'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { filterMealsByRange } from '@/lib/mealDatabase';
import type { MealSuggestion } from '@/types/calculator';
import { SectionHeading } from '@/components/ui/lab';

type RangeKey = 'all' | 'light' | 'medium' | 'hearty';
type GoalKey = 'all' | 'lose' | 'maintain' | 'gain' | 'snack';

// Four ranges covering the whole database.
const ranges: Record<RangeKey, { label: string; min: number; max: number }> = {
  all: { label: 'All', min: 0, max: 100000 },
  light: { label: '≤ 350', min: 0, max: 350 },
  medium: { label: '350–550', min: 351, max: 550 },
  hearty: { label: '550–800', min: 551, max: 800 },
};
const rangeOrder: RangeKey[] = ['all', 'light', 'medium', 'hearty'];

const goals: Record<GoalKey, { label: string; tag: string }> = {
  all: { label: 'All', tag: '' },
  lose: { label: 'Lose', tag: 'Lose' },
  maintain: { label: 'Maintain', tag: 'Maintain' },
  gain: { label: 'Gain', tag: 'Gain' },
  snack: { label: 'Snacks', tag: 'Snack' },
};
const goalOrder: GoalKey[] = ['all', 'lose', 'maintain', 'gain', 'snack'];

// The curated sets are the image folders, so a meal's goal is read from its
// image path. A meal without an image is listed under "All" only.
const folderGoal: Record<string, Exclude<GoalKey, 'all'>> = {
  weightLossRecipes: 'lose',
  balancedRecipes: 'maintain',
  bulkingRecipes: 'gain',
  snacks: 'snack',
};

function goalOf(meal: MealSuggestion): Exclude<GoalKey, 'all'> | null {
  const folder = meal.image?.match(/\/assets\/images\/([^/]+)\//)?.[1];
  return folder ? folderGoal[folder] ?? null : null;
}

const difficultyLevel: Record<MealSuggestion['difficulty'], number> = { easy: 1, medium: 2, hard: 3 };

const PAGE_SIZE = 12;

/** Wrapping row of toggle buttons in the Segmented style; wraps at narrow widths. */
function FilterChips<T extends string>({
  labelledBy,
  value,
  options,
  onSelect,
}: {
  labelledBy: string;
  value: T;
  options: { value: T; label: string; count: number }[];
  onSelect: (value: T) => void;
}) {
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(option.value)}
            className={`min-h-11 px-3 border rounded-[2px] inline-flex items-center gap-2 transition-colors cursor-pointer ${
              selected
                ? 'bg-foreground text-background border-foreground'
                : 'border-input text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span className="label-caps">{option.label}</span>
            <span className="readout text-xs">
              <span className="sr-only">, </span>
              {String(option.count).padStart(2, '0')}
              <span className="sr-only"> meals</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MacroCell({ label, grams, kcal, total }: { label: string; grams: number; kcal: number; total: number }) {
  const share = total > 0 ? Math.min(1, kcal / total) : 0;
  return (
    <div className="min-w-0 p-2.5">
      <dt className="label-caps truncate text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 readout text-foreground">
        <span className="text-base font-semibold">{grams}</span>
        <span className="text-xs text-muted-foreground">g</span>
        <span className="sr-only">, {Math.round(share * 100)}% of calories</span>
        <span aria-hidden="true" className="block relative mt-1.5 h-1.5 bg-muted overflow-hidden">
          <span className="absolute inset-y-0 left-0 bg-accent-ink" style={{ width: `${share * 100}%` }} />
        </span>
      </dd>
    </div>
  );
}

function MealCard({ meal, index }: { meal: MealSuggestion; index: number }) {
  const goal = goalOf(meal);
  const level = difficultyLevel[meal.difficulty] ?? 1;
  const pKcal = meal.protein * 4;
  const cKcal = meal.carbs * 4;
  const fKcal = meal.fats * 9;
  const macroTotal = pKcal + cKcal + fKcal;

  return (
    <li
      className="panel brackets flex flex-col overflow-hidden lab-enter"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      {meal.image && (
        <div className="relative aspect-[16/10] border-b border-border bg-muted">
          <Image
            src={meal.image}
            alt={meal.name}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          />
          {goal && (
            <span className="absolute left-2 top-2 label-caps bg-card text-foreground border border-border rounded-[2px] px-2 py-1">
              {goals[goal].tag}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p aria-hidden="true" className="readout text-xs text-muted-foreground">
              M-{String(index + 1).padStart(2, '0')}
            </p>
            <h4 className="mt-0.5 font-semibold text-foreground leading-snug">{meal.name}</h4>
          </div>
          <p className="readout text-right shrink-0">
            <span className="block text-2xl font-semibold text-accent-ink leading-none">{meal.calories}</span>
            <span className="label-caps text-muted-foreground">kcal</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 label-caps text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden="true" className="w-3.5 h-3.5" />
            Prep <span className="readout text-foreground">{meal.prepTime}</span> min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-flex gap-0.5">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`inline-block w-1.5 h-2.5 ${n <= level ? 'bg-foreground' : 'border border-border-strong'}`}
                />
              ))}
            </span>
            {meal.difficulty}
          </span>
        </div>

        <dl className="grid grid-cols-3 divide-x divide-border border border-border rounded-[2px] bg-background">
          <MacroCell label="Protein" grams={meal.protein} kcal={pKcal} total={macroTotal} />
          <MacroCell label="Carbs" grams={meal.carbs} kcal={cKcal} total={macroTotal} />
          <MacroCell label="Fats" grams={meal.fats} kcal={fKcal} total={macroTotal} />
        </dl>

        <div>
          <h5 className="label-caps text-foreground mb-2">Ingredients</h5>
          <ul className="flex flex-wrap gap-1.5">
            {meal.ingredients.map((ingredient, i) => (
              <li
                key={i}
                className="text-xs text-foreground bg-muted border border-border rounded-[2px] px-2 py-1"
              >
                {ingredient}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="label-caps text-foreground mb-2">Method</h5>
          <ol className="space-y-1.5 text-sm text-foreground">
            {meal.instructions.map((instruction, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden="true" className="readout text-xs text-accent-ink pt-0.5 w-5 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </li>
  );
}

interface MealSuggestionsProps {
  defaultCalories: number;
}

export default function MealSuggestions({ defaultCalories }: MealSuggestionsProps) {
  const [range, setRange] = useState<RangeKey>('medium');
  const [goal, setGoal] = useState<GoalKey>('all');
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  const inRange = useMemo(() => {
    const r = ranges[range];
    return filterMealsByRange({ minCalories: r.min, maxCalories: r.max });
  }, [range]);

  // Goal counts follow the chosen range; range counts follow the chosen goal.
  const goalCounts = useMemo(() => {
    const counts: Record<GoalKey, number> = { all: inRange.length, lose: 0, maintain: 0, gain: 0, snack: 0 };
    for (const meal of inRange) {
      const g = goalOf(meal);
      if (g) counts[g]++;
    }
    return counts;
  }, [inRange]);

  const rangeCounts = useMemo(() => {
    const counts = {} as Record<RangeKey, number>;
    for (const key of rangeOrder) {
      const r = ranges[key];
      counts[key] = filterMealsByRange({ minCalories: r.min, maxCalories: r.max }).filter(
        (meal) => goal === 'all' || goalOf(meal) === goal
      ).length;
    }
    return counts;
  }, [goal]);

  const suggestions = useMemo(
    () => (goal === 'all' ? inRange : inRange.filter((meal) => goalOf(meal) === goal)),
    [inRange, goal]
  );

  const totalPages = Math.max(1, Math.ceil(suggestions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginated = suggestions.slice(start, start + PAGE_SIZE);

  const selectRange = (key: RangeKey) => {
    setRange(key);
    setPage(1);
  };
  const selectGoal = (key: GoalKey) => {
    setGoal(key);
    setPage(1);
  };
  const goToPage = (next: number) => {
    setPage(next);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    listRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const perMeal = Math.round(defaultCalories / 3);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SectionHeading index="04" title="Meals by Calories" hint="Pick a goal and a range. Every meal comes with its macros and method." />
        {defaultCalories > 0 && (
          <p className="readout text-xs text-muted-foreground">
            Maintenance <span className="text-foreground">{defaultCalories.toLocaleString()}</span> kcal/day ≈{' '}
            <span className="text-foreground">{perMeal.toLocaleString()}</span> kcal per meal across 3 meals
          </p>
        )}
      </div>

      <div className="grid gap-4 border border-border rounded-[2px] bg-background p-3 sm:p-4">
        <div className="space-y-2">
          <p id="meal-goal-label" className="label-caps text-muted-foreground">
            Goal
          </p>
          <FilterChips
            labelledBy="meal-goal-label"
            value={goal}
            options={goalOrder.map((key) => ({ value: key, label: goals[key].label, count: goalCounts[key] }))}
            onSelect={selectGoal}
          />
        </div>
        <div className="space-y-2">
          <p id="meal-range-label" className="label-caps text-muted-foreground">
            Calories per serving
          </p>
          <FilterChips
            labelledBy="meal-range-label"
            value={range}
            options={rangeOrder.map((key) => ({ value: key, label: ranges[key].label, count: rangeCounts[key] }))}
            onSelect={selectRange}
          />
        </div>
      </div>

      <div ref={listRef} className="scroll-mt-20 space-y-4">
        <p role="status" className="label-caps text-muted-foreground">
          {suggestions.length > 0 ? (
            <>
              Showing <span className="readout text-foreground">{start + 1}–{start + paginated.length}</span> of{' '}
              <span className="readout text-foreground">{suggestions.length}</span>
            </>
          ) : (
            'No meals match'
          )}
        </p>

        {suggestions.length > 0 ? (
          <ul key={`${goal}-${range}-${currentPage}`} className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
            {paginated.map((meal, i) => (
              <MealCard key={meal.name} meal={meal} index={start + i} />
            ))}
          </ul>
        ) : (
          <div className="border border-dashed border-border-strong rounded-[2px] p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Nothing in this range for that goal.</p>
            <button
              type="button"
              onClick={() => selectRange('all')}
              className="min-h-11 px-4 border border-input rounded-[3px] text-foreground hover:bg-muted hover:border-foreground transition-colors label-caps cursor-pointer"
            >
              Show all ranges
            </button>
          </div>
        )}

        {totalPages > 1 && (
          <nav aria-label="Meal pages" className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="min-h-11 px-4 border border-input rounded-[3px] label-caps text-foreground hover:bg-muted hover:border-foreground transition-colors cursor-pointer disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
            >
              Prev
            </button>
            <span className="readout text-sm text-muted-foreground">
              Page <span className="text-foreground">{currentPage}</span> of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="min-h-11 px-4 border border-input rounded-[3px] label-caps text-foreground hover:bg-muted hover:border-foreground transition-colors cursor-pointer disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
