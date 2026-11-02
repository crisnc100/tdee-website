'use client';

import { TDEEResult } from '@/types/calculator';
import ComponentExplainer from '../education/ComponentExplainer';

interface TDEEResultsProps {
  result: TDEEResult;
}

export default function TDEEResults({ result }: TDEEResultsProps) {
  const components = [
    { label: 'Base Metabolic Rate', value: result.components.bmr, explainer: 'bmr' as const },
    { label: 'Muscle Factor', value: result.components.muscleFactor, explainer: 'muscle' as const },
    { label: 'Job Activity', value: result.components.jobActivity, explainer: 'job' as const },
    { label: 'NEAT (Steps)', value: result.components.neat, explainer: 'neat' as const },
    { label: 'Exercise', value: result.components.exercise, explainer: 'exercise' as const },
    { label: 'Muscle Recovery', value: result.components.muscleRecovery, explainer: null }
  ];

  // Each bar is that component's share of the total.
  const shareOf = (value: number) => (result.tdee > 0 ? Math.min(1, Math.max(0, value / result.tdee)) : 0);

  return (
    <div className="space-y-8">
      {/* Component Breakdown */}
      <section>
        <div className="flex items-center gap-3 mb-1">
          <span aria-hidden="true" className="label-caps text-accent-ink">03</span>
          <h4 className="label-caps text-foreground">6-Component Breakdown</h4>
          <span aria-hidden="true" className="h-px flex-1 min-w-4 bg-border" />
        </div>
        <p className="text-xs text-muted-foreground mb-5">Calories per day, with each part&apos;s share of your TDEE.</p>

        <ul className="space-y-4">
          {components.map((component, index) => {
            const share = shareOf(component.value);
            return (
              <li key={component.label}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center min-w-0">
                    <span aria-hidden="true" className="readout text-xs text-muted-foreground w-7 shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium text-foreground">{component.label}</span>
                    {component.explainer && (
                      <ComponentExplainer component={component.explainer} value={component.value} />
                    )}
                  </div>
                  <span className="readout text-sm whitespace-nowrap">
                    <span className="font-semibold text-foreground">+{component.value.toLocaleString()}</span>
                    <span className="hidden sm:inline text-xs text-muted-foreground"> cal</span>
                    <span className="inline-block w-10 sm:w-12 text-right text-xs text-muted-foreground">
                      {Math.round(share * 100)}%
                    </span>
                  </span>
                </div>
                <div aria-hidden="true" className="relative mt-1.5 ml-7 h-2.5 bg-muted overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-accent-ink lab-meter"
                    style={{ width: `${share * 100}%`, animationDelay: `${index * 70}ms` }}
                  />
                  <div className="absolute inset-0 meter-segments" />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Accuracy Note */}
      <div className="border-l-2 border-accent-ink bg-muted/70 px-4 py-3.5">
        <h5 className="label-caps text-foreground mb-2">Why This Is More Accurate</h5>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Unlike basic calculators that use simple activity multipliers, our formula accounts for your
          specific job activity, daily steps, muscle mass, and recovery needs. This personalized approach
          can be 300-500 calories more accurate than generic formulas.
        </p>
      </div>
    </div>
  );
}
