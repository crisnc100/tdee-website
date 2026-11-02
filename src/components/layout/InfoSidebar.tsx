import type { ReactNode } from 'react';

const steps = [
  'Calculate your Base Metabolic Rate (BMR)',
  'Factor in muscle mass and body composition',
  'Add job activity and daily movement (NEAT)',
  'Include exercise and recovery needs',
  'Provide confidence intervals for accuracy',
];

const tips = [
  'Track your weight for 2-3 weeks to validate results',
  'Recalculate when weight changes by ±10 lbs',
  'Use the confidence range for better accuracy',
  'Body fat % measurement improves precision',
];

function Block({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section className="p-5">
      <div className="flex items-center gap-3 mb-3">
        <span aria-hidden="true" className="label-caps text-accent-ink">
          {index}
        </span>
        <h3 className="label-caps text-foreground">{title}</h3>
        <span aria-hidden="true" className="h-px flex-1 min-w-4 bg-border" />
      </div>
      {children}
    </section>
  );
}

export default function InfoSidebar() {
  return (
    <aside aria-label="About this calculator" className="panel divide-y divide-border">
      <div aria-hidden="true" className="ruler opacity-70" />

      {/* Privacy First */}
      <Block index="01" title="Privacy First">
        <p className="text-sm text-muted-foreground leading-relaxed">
          No accounts required. Calculations run in your browser, and your inputs are saved only in
          this device&apos;s local storage.
        </p>
      </Block>

      {/* About */}
      <Block index="02" title="About This Calculator">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Many calorie calculators multiply your BMR by a single activity factor, which can miss a lot of
          individual variation.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This one adds up separate parts instead: your BMR, job activity, daily steps, exercise and recovery,
          and shows a range rather than one exact number. Treat the result as a starting point and adjust it
          against your real weight trend.
        </p>
      </Block>

      {/* How It Works */}
      <Block index="03" title="How It Works">
        <ol className="space-y-2 text-sm text-muted-foreground">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="readout text-foreground min-w-[1.25rem]">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Block>

      {/* Quick Tips */}
      <Block index="04" title="Quick Tips">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span aria-hidden="true" className="font-mono text-foreground">
                —
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </Block>
    </aside>
  );
}
