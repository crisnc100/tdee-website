import { TDEEResult } from '@/types/calculator';
import { SectionHeading } from '@/components/ui/lab';
import type { LogEngineResult } from '@/lib/log/engine';
import { band80, kcal } from '@/components/track/shared';
import TDEEGauge from './TDEEGauge';
import EstimateChart from './EstimateChart';

export interface MeasuredView {
  engine: LogEngineResult;
  /** Sample mode: the simulator's true value per engine day. */
  truthKcal?: number[];
  sample: boolean;
}

interface ResultHeroProps {
  result: TDEEResult;
  /** Count-up value for the gauge centre. */
  displayTdee: number;
  /** The daily log's estimate. Without it the hero shows the formula alone, as before. */
  measured?: MeasuredView;
}

type Direction = 'deficit' | 'maintain' | 'surplus';

export default function ResultHero({ result, displayTdee, measured }: ResultHeroProps) {
  const plusMinus = result.errorMargin.upper - result.tdee;
  const current = measured?.engine.current.expenditure;

  const goals: { label: string; value: number; change: string; direction: Direction }[] = [
    { label: 'Extreme Weight Loss', value: result.recommendation.extremeWeightLoss, change: '-750', direction: 'deficit' },
    { label: 'Weight Loss', value: result.recommendation.weightLoss, change: '-500', direction: 'deficit' },
    { label: 'Mild Weight Loss', value: result.recommendation.mildWeightLoss, change: '-250', direction: 'deficit' },
    { label: 'Maintain Weight', value: result.recommendation.maintain, change: '', direction: 'maintain' },
    { label: 'Mild Weight Gain', value: result.recommendation.mildWeightGain, change: '+250', direction: 'surplus' },
    { label: 'Weight Gain', value: result.recommendation.weightGain, change: '+500', direction: 'surplus' },
  ];

  return (
    <div className="space-y-8">
      {/* Gauge with the error margin beside it */}
      <section
        aria-label="Your TDEE"
        className="relative border border-border rounded-[3px] bg-background/60 p-4 sm:p-6 lab-enter"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
          <p aria-hidden="true" className="label-caps text-muted-foreground">
            <span className="text-accent-ink mr-3">01</span>Estimate
          </p>
          {measured?.sample && (
            <span className="label-caps tracking-[0.08em] bg-accent text-accent-foreground px-1.5 rounded-[2px] leading-5">
              Sample data
            </span>
          )}
        </div>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:items-center">
          <div>
            <TDEEGauge
              tdee={result.tdee}
              displayValue={displayTdee}
              lower={result.errorMargin.lower}
              upper={result.errorMargin.upper}
              measured={current && { mean: current.mean, lower: current.intervals.p80.lower, upper: current.intervals.p80.upper }}
            />
            {measured && <GaugeLegend />}
          </div>

          {measured && current ? (
            <MeasuredPanel measured={measured} result={result} plusMinus={plusMinus} />
          ) : (
            <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 border border-border divide-y sm:divide-y-0 sm:divide-x md:divide-x-0 md:divide-y divide-border bg-card rounded-[2px]">
              <div className="p-3 sm:p-4">
                <dt className="label-caps text-muted-foreground">Error margin</dt>
                <dd className="mt-1 readout text-foreground">
                  <span className="text-2xl sm:text-3xl font-semibold">±{plusMinus.toLocaleString()}</span>{' '}
                  <span className="text-xs text-muted-foreground">kcal</span>
                </dd>
              </div>
              <div className="p-3 sm:p-4">
                <dt className="label-caps text-muted-foreground">Likely range</dt>
                <dd className="mt-1 readout text-foreground">
                  <span className="text-lg sm:text-xl font-semibold whitespace-nowrap">
                    {result.errorMargin.lower.toLocaleString()}
                    <span className="text-muted-foreground mx-1">–</span>
                    {result.errorMargin.upper.toLocaleString()}
                  </span>{' '}
                  <span className="text-xs text-muted-foreground">calories</span>
                </dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      {/* Goal targets as a compact readout table */}
      <section className="space-y-3 lab-enter [animation-delay:120ms]">
        <SectionHeading index="02" title="Calorie Recommendations" id="goals-heading" hideIndex />
        <div className="border border-border rounded-[2px] overflow-hidden">
          <table aria-labelledby="goals-heading" className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="label-caps tracking-[0.06em] sm:tracking-[0.14em] text-muted-foreground">
                <th scope="col" className="text-left font-medium px-2 sm:px-3 py-2">Goal</th>
                <th scope="col" className="text-right font-medium px-2 sm:px-3 py-2">
                  Change<span className="sr-only"> (calories per day)</span>
                </th>
                <th scope="col" className="text-right font-medium px-2 sm:px-3 py-2">
                  Cal/day
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {goals.map((goal) => {
                const maintain = goal.direction === 'maintain';
                const tone =
                  goal.direction === 'deficit'
                    ? 'text-deficit'
                    : goal.direction === 'surplus'
                      ? 'text-surplus'
                      : 'text-muted-foreground';
                return (
                  <tr key={goal.label} className={maintain ? 'bg-muted/70' : undefined}>
                    <th
                      scope="row"
                      className={`text-left font-medium text-foreground px-2 sm:px-3 py-2.5 ${
                        maintain ? 'border-l-2 border-accent-ink' : 'border-l-2 border-transparent'
                      }`}
                    >
                      <span aria-hidden="true" className={`inline-block w-4 font-mono text-xs ${tone}`}>
                        {goal.direction === 'deficit' ? '▼' : goal.direction === 'surplus' ? '▲' : '■'}
                      </span>
                      {goal.label}
                    </th>
                    <td className={`text-right readout text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3 py-2.5 ${tone}`}>
                      {maintain ? (
                        <>
                          <span className="hidden sm:inline">Current </span>TDEE
                        </>
                      ) : (
                        <>
                          {goal.change}
                          <span className="hidden sm:inline"> cal/day</span>
                        </>
                      )}
                    </td>
                    <td className="text-right readout font-semibold text-foreground whitespace-nowrap px-2 sm:px-3 py-2.5">
                      {goal.value.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/** Formula to measured, side by side, then the estimate over time. */
function MeasuredPanel({ measured, result, plusMinus }: { measured: MeasuredView; result: TDEEResult; plusMinus: number }) {
  const { engine } = measured;
  const estimate = engine.current.expenditure;
  return (
    <div className="space-y-4 min-w-0">
      <dl className="grid grid-cols-2 gap-6 border border-border bg-card rounded-[2px] p-3 sm:p-4">
        <div className="min-w-0">
          <dt className="label-caps text-muted-foreground">Formula</dt>
          <dd className="mt-1 readout text-foreground">
            <span className="block text-2xl sm:text-3xl font-semibold leading-tight">{result.tdee.toLocaleString()}</span>
            <span className="block text-sm">± {plusMinus.toLocaleString()} kcal</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              {result.errorMargin.lower.toLocaleString()}–{result.errorMargin.upper.toLocaleString()}
            </span>
          </dd>
        </div>
        <div className="relative min-w-0">
          <span aria-hidden="true" className="absolute -left-5 top-7 readout text-muted-foreground">
            →
          </span>
          <dt className="label-caps text-muted-foreground">
            Measured <span className="whitespace-nowrap">· day {engine.dayCount}</span>
          </dt>
          <dd className="mt-1 readout text-foreground">
            <span className="block text-2xl sm:text-3xl font-semibold leading-tight text-accent-ink">{kcal(estimate.mean)}</span>
            <span className="block text-sm">± {kcal(band80(estimate))} kcal</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              <span className="sr-only">80% band </span>
              {kcal(estimate.intervals.p80.lower)}–{kcal(estimate.intervals.p80.upper)}
            </span>
          </dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground leading-relaxed">
        <span className="text-foreground">Measured is expenditure as you log it:</span> if you log less than you eat, it reads
        lower than your true TDEE, and it is the number to plan your logged calories against. ± is the 80% band.
        {!engine.learning && ' Not enough data to learn from yet, so this is still the starting estimate.'}
      </p>
      <div className="border border-border bg-card rounded-[2px] p-3">
        <EstimateChart engine={engine} formulaTdee={result.tdee} truthKcal={measured.truthKcal} />
      </div>
    </div>
  );
}

function GaugeLegend() {
  return (
    <ul aria-hidden="true" className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <li className="inline-flex items-center gap-1.5">
        <svg viewBox="0 0 16 8" className="w-4 h-2">
          <rect width="16" height="8" className="fill-accent" fillOpacity={0.45} />
          <rect width="2" height="8" className="fill-accent-ink" />
          <rect x="14" width="2" height="8" className="fill-accent-ink" />
        </svg>
        Measured, 80% band
      </li>
      <li className="inline-flex items-center gap-1.5">
        <svg viewBox="0 0 16 8" className="w-4 h-2">
          <rect y="3" width="16" height="2" className="fill-foreground" />
          <rect x="7" width="2" height="8" className="fill-foreground" />
        </svg>
        Formula and its range
      </li>
    </ul>
  );
}
