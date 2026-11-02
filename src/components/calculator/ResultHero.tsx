import { TDEEResult } from '@/types/calculator';
import { SectionHeading } from '@/components/ui/lab';
import TDEEGauge from './TDEEGauge';

interface ResultHeroProps {
  result: TDEEResult;
  /** Count-up value for the gauge centre. */
  displayTdee: number;
}

type Direction = 'deficit' | 'maintain' | 'surplus';

export default function ResultHero({ result, displayTdee }: ResultHeroProps) {
  const plusMinus = result.errorMargin.upper - result.tdee;

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
        <p aria-hidden="true" className="label-caps text-muted-foreground mb-2">
          <span className="text-accent-ink mr-3">01</span>Estimate
        </p>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:items-center">
          <TDEEGauge
            tdee={result.tdee}
            displayValue={displayTdee}
            lower={result.errorMargin.lower}
            upper={result.errorMargin.upper}
          />

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
