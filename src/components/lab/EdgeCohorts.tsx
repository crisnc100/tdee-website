import type { ReactNode } from 'react';
import type { CalibrationReport } from '@/lib/engine/calibration';
import { int, pct, triple } from '@/lib/lab/format';
import { EDGE_SCENARIOS, MISSING_WEEKS_GAP, edgeReadout, engineErrorOn, type EdgeReadout, type EdgeScenario } from '@/lib/lab/report';

const dtClass = 'text-[0.6875rem] leading-tight text-muted-foreground';
const subClass = 'block text-[0.6875rem] text-muted-foreground';

const Num = ({ children }: { children: ReactNode }) => <span className="readout text-foreground">{children}</span>;

interface Card {
  title: string;
  who: string;
  finding: ReactNode;
}

function card(report: CalibrationReport, r: EdgeReadout): Card {
  const { last, first } = r;
  const error = last.medianAbsErrorKcal;
  const horizon = last.day;
  switch (r.scenario) {
    case 'accurateLogger': {
      const offset = first.meanErrorKcal.prior;
      return {
        title: 'Accurate loggers',
        who: 'The realistic population, logging exactly what they eat.',
        finding: (
          <>
            The prior assumes some under-logging, so for them it starts <Num>{int(Math.abs(offset))}</Num> kcal{' '}
            {offset < 0 ? 'low' : 'high'} on average.{' '}
            {r.crossoverDay === null ? (
              <>The engine does not beat the raw formula within {horizon} days. </>
            ) : (
              <>
                The engine only beats the raw formula from day <Num>{r.crossoverDay}</Num>.{' '}
              </>
            )}
            By day {horizon} its error is <Num>{int(error.engine)}</Num> kcal against <Num>{int(error.formula)}</Num>.
          </>
        ),
      };
    }
    case 'missingWeeks': {
      const before = MISSING_WEEKS_GAP.firstDay - 1;
      const end = MISSING_WEEKS_GAP.lastDay;
      const cohort = report.cohorts.missingWeeks;
      return {
        title: 'Missing weeks',
        who: `As realistic, with days ${MISSING_WEEKS_GAP.firstDay}–${end} missing: no weigh-ins and no calories.`,
        finding: (
          <>
            With nothing to learn from, its error goes from <Num>{int(engineErrorOn(cohort, before))}</Num> kcal on day {before}{' '}
            to <Num>{int(engineErrorOn(cohort, end))}</Num> on day {end}. It then falls to <Num>{int(error.engine)}</Num> by day{' '}
            {horizon}, against <Num>{int(error.formula)}</Num> for the formula.
          </>
        ),
      };
    }
    case 'maintainer':
      return {
        title: 'Maintainers',
        who: 'Eat at their true expenditure, so tissue weight stays flat. They still under-log.',
        finding: (
          <>
            Their expenditure does not adapt, so the drift the engine allows for dieters leaves their bands wide:{' '}
            <Num>{triple(last.coverage)}%</Num> at day {horizon} against 50/80/95. The error still falls to{' '}
            <Num>{int(error.engine)}</Num> kcal, against <Num>{int(error.formula)}</Num> for the formula.
          </>
        ),
      };
    case 'noLogs':
      return {
        title: 'No logs',
        who: 'Weigh-ins only. No calories are ever logged.',
        finding:
          r.maxDistanceFromPrior < 0.5 ? (
            <>
              Weight change alone cannot separate intake from expenditure, so the estimate stays exactly on the prior: its
              error matches the prior&apos;s at every checkpoint (<Num>{int(error.engine)}</Num> kcal at day {horizon}).
            </>
          ) : (
            <>
              The estimate moves up to <Num>{int(r.maxDistanceFromPrior)}</Num> kcal from the prior, though weight change
              alone cannot separate intake from expenditure.
            </>
          ),
      };
  }
}

/** One compact readout per edge cohort. */
export default function EdgeCohorts({ report }: { report: CalibrationReport }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {EDGE_SCENARIOS.map((scenario: EdgeScenario) => {
        const r = edgeReadout(report, scenario);
        const c = card(report, r);
        const { last, convergence } = r;
        return (
          <section key={scenario} aria-labelledby={`edge-${scenario}`} className="border border-border rounded-[2px] p-3 sm:p-4 space-y-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 id={`edge-${scenario}`} className="label-caps text-foreground">
                {c.title}
              </h3>
              <span className="readout text-xs text-muted-foreground">{int(r.people)} people</span>
            </div>
            <p className="text-sm text-muted-foreground">{c.who}</p>
            <dl className="grid grid-cols-3 gap-2 border-y border-border py-2">
              <div>
                <dt className={dtClass}>Error, day {last.day}</dt>
                <dd className="readout text-sm sm:text-base text-foreground">
                  {int(last.medianAbsErrorKcal.engine)} <span className="text-xs">kcal</span>
                  <span className={subClass}>formula {int(last.medianAbsErrorKcal.formula)}</span>
                </dd>
              </div>
              <div>
                <dt className={dtClass}>Coverage, day {last.day}</dt>
                <dd className="readout text-sm sm:text-base text-foreground">
                  {triple(last.coverage)}
                  <span className={subClass}>of 50/80/95%</span>
                </dd>
              </div>
              <div>
                <dt className={dtClass}>Within {int(convergence.toleranceKcal)} kcal</dt>
                <dd className="readout text-sm sm:text-base text-foreground">
                  {pct(convergence.shareConverged)}%
                  <span className={subClass}>
                    {convergence.medianDay === null ? 'under half of people' : `median from day ${convergence.medianDay}`}
                  </span>
                </dd>
              </div>
            </dl>
            <p className="text-sm text-foreground leading-relaxed">{c.finding}</p>
          </section>
        );
      })}
    </div>
  );
}
