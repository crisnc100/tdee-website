import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import calibration from '@/lib/engine/calibration.json';
import { NOMINAL } from '@/lib/engine/metrics';
import type { PriorVariant } from '@/lib/engine/model';
import { BackLink, DashList, DocSheet, SectionHeading } from '@/components/ui/lab';
import AccuracyChart from '@/components/lab/AccuracyChart';
import CalibrationChart from '@/components/lab/CalibrationChart';
import EdgeCohorts from '@/components/lab/EdgeCohorts';
import SweepTable from '@/components/lab/SweepTable';
import { DataTable, Disclosure } from '@/components/lab/chart/Chart';
import { int, listJoin, pct, points, triple } from '@/lib/lab/format';
import { EARLY_GATE_DAYS, OVER_TOLERANCE, UNDER_TOLERANCE, tightestCheck } from '@/lib/lab/gate';
import {
  EDGE_LABELS,
  EDGE_SCENARIOS,
  accuracySeries,
  checkpoint,
  coverageRows,
  headline,
  readReport,
  rowCoverage,
  samplingSd,
  sweepGrid,
  variantLabel,
} from '@/lib/lab/report';

export const metadata: Metadata = {
  title: 'Engine Lab · TDEE Calculator',
  description:
    'How accurate the adaptive TDEE estimate is: its error, the honesty of its ranges and its limits, measured on a seeded synthetic cohort and read from the committed results file.',
};

const REPO = 'https://github.com/crisnc100/tdee-website/blob/main';

const N = ({ children }: { children: ReactNode }) => <span className="readout">{children}</span>;

const external = 'text-accent-ink underline underline-offset-4 hover:no-underline';

function LabSection({ index, id, title, children }: { index: string; id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="py-8 border-b border-border space-y-4">
      <SectionHeading as="h2" index={index} title={title} id={id} hideIndex />
      {children}
    </section>
  );
}

function Stat({ value, label, detail }: { value: ReactNode; label: string; detail: ReactNode }) {
  return (
    <div className="border border-border rounded-[2px] bg-background p-3">
      <dt className="text-xs text-muted-foreground leading-snug">{label}</dt>
      <dd className="mt-1 readout text-2xl font-semibold text-accent-ink">{value}</dd>
      <dd className="readout text-xs text-muted-foreground">{detail}</dd>
    </div>
  );
}

/**
 * The engine's evidence page. A server component: everything is read from the
 * committed calibration.json at build time, and the page ships no script of
 * its own.
 */
export default function LabPage() {
  const report = readReport(calibration);
  const { config } = report;
  const h = headline(report);
  const realistic = report.cohorts.realistic;
  const accuracy = accuracySeries(realistic);
  const grid = sweepGrid(report);
  const tightest = tightestCheck(report);
  const accurate = report.cohorts.accurateLogger;
  const firstDay = h.firstDay;
  const horizon = h.horizonDays;
  const p80 = pct(NOMINAL.p80);
  const at = (day: number) => checkpoint(realistic, day);
  const midDay = config.checkpointDays[config.checkpointDays.length - 2];
  const gatedMax = Math.max(...grid.rows.filter((r) => r.gatedEarly).map((r) => r.bias));
  const topBias = grid.rows[grid.rows.length - 1];
  const topEarly = rowCoverage(topBias, firstDay);
  const [chosen, ...others] = grid.variants;
  const prior = config.prior;
  const priorShape = (variant: PriorVariant) => {
    const mean = report.sweep.variants[variant]?.prior.loggingBiasMean ?? 0;
    return mean === 0 ? 'centred on the raw formula' : `lowered ${pct(mean)}% from the formula`;
  };
  const priorSd = Math.hypot(prior.formulaRelativeSd, prior.loggingBiasSd);

  return (
    <DocSheet
      label="Engine lab"
      title="How accurate is the adaptive estimate?"
      updated={`calibration.json · schema v${report.schemaVersion} · seed ${config.seed}`}
    >
      <section aria-label="Summary" className="py-8 border-b border-border space-y-6">
        <p className="text-foreground leading-relaxed max-w-prose">
          The Track tab&apos;s adaptive engine turns daily weigh-ins and logged calories into an estimate of{' '}
          <strong className="font-semibold">{h.quantity.name}</strong>: the calories per day that make what you log match
          your weight trend. It was tested on <N>{int(h.people)}</N> synthetic people from a simulator that is deliberately
          messier than the model: their expenditure adapts as they diet, their water weight swings for days at a time, and
          they under-log, skip days and mistype weigh-ins. None of it follows the filter&apos;s assumptions. By day <N>{horizon}</N>{' '}
          its median error is <N>{int(h.last.medianAbsErrorKcal.engine)}</N> {h.quantity.unit} against the formula&apos;s{' '}
          <N>{int(h.last.medianAbsErrorKcal.formula)}</N>, and its {p80}% band holds the true value for{' '}
          <N>{pct(h.last.coverage.p80)}%</N> of people.
        </p>
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Stat
            value={int(h.last.medianAbsErrorKcal.engine)}
            label={`Median error, day ${horizon}, kcal`}
            detail={`formula ${int(h.last.medianAbsErrorKcal.formula)} · ${pct(h.errorCut)}% less`}
          />
          <Stat
            value={`${pct(h.last.coverage.p80)}%`}
            label={`Inside the ${p80}% band, day ${horizon}`}
            detail={`50/80/95: ${triple(h.last.coverage)}`}
          />
          <Stat
            value={int(h.last.medianPosteriorSdKcal)}
            label={`Posterior SD, day ${horizon}, kcal`}
            detail={`${int(h.first.medianPosteriorSdKcal)} at day ${firstDay}`}
          />
          <Stat
            value={`${pct(h.convergence.shareConverged)}%`}
            label={`Within ${int(h.convergence.toleranceKcal)} kcal by day ${horizon}`}
            detail={h.convergence.medianDay === null ? 'under half of people' : `median from day ${h.convergence.medianDay}`}
          />
        </dl>
      </section>

      <LabSection index="01" id="accuracy" title="Accuracy over time">
        <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
          Median absolute error by day across the realistic cohort. The engine starts from its prior, the formula lowered{' '}
          <N>{pct(prior.loggingBiasMean)}%</N> for typical under-logging, and learns from there.
          {accuracy.belowPriorFrom !== null && (
            <>
              {' '}
              It pulls below the prior for good from day <N>{accuracy.belowPriorFrom}</N>.
            </>
          )}{' '}
          By day <N>{midDay}</N> its error is <N>{int(at(midDay).medianAbsErrorKcal.engine)}</N> kcal against the
          prior&apos;s <N>{int(at(midDay).medianAbsErrorKcal.prior)}</N> and the formula&apos;s{' '}
          <N>{int(at(midDay).medianAbsErrorKcal.formula)}</N>; by day <N>{horizon}</N>,{' '}
          <N>{int(h.last.medianAbsErrorKcal.engine)}</N> against <N>{int(h.last.medianAbsErrorKcal.prior)}</N> and{' '}
          <N>{int(h.last.medianAbsErrorKcal.formula)}</N>.
        </p>
        <AccuracyChart series={accuracy} checkpointDays={config.checkpointDays} people={h.people} />
      </LabSection>

      <LabSection index="02" id="calibration" title="Calibration">
        <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
          A band is honest when it holds the true value as often as it claims. By day <N>{horizon}</N> the 50/80/95% bands
          hold <N>{triple(h.last.coverage)}%</N>. Early on they hold more, because they are still mostly the prior&apos;s: at
          day <N>{firstDay}</N> the prior alone would hold <N>{triple(h.first.priorCoverage)}%</N>. For people who log
          accurately the bands are on target once data arrive: <N>{triple(checkpoint(accurate, midDay).coverage)}%</N> at day{' '}
          {midDay} and <N>{triple(checkpoint(accurate, horizon).coverage)}%</N> at day {horizon}.
        </p>
        <CalibrationChart rows={coverageRows(realistic)} people={h.people} />
      </LabSection>

      <LabSection index="03" id="robustness" title="Robustness to under-logging">
        <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
          The prior assumes people under-log by <N>{pct(prior.loggingBiasMean)}%</N> on average. To see what happens when
          they log better or worse, the sweep reruns <N>{int(config.sweepPeople)}</N> realistic people at each mean logging
          bias. Across every level and day the bands are at most <N>{points(grid.worstUnder.deviation)}</N> points narrower
          than they claim ({pct(NOMINAL[grid.worstUnder.level])}% band, {pct(grid.worstUnder.bias)}% bias, day{' '}
          {grid.worstUnder.day}), and at most <N>{points(grid.worstOver.deviation)}</N> points wider (
          {pct(NOMINAL[grid.worstOver.level])}% band, {pct(grid.worstOver.bias)}% bias, day {grid.worstOver.day}). Each
          cohort&apos;s measured logging gap was within <N>{points(grid.maxGapMiss)}</N> points of its level.
        </p>
        <SweepTable grid={grid} />
        <div className="space-y-3 text-sm text-foreground leading-relaxed max-w-prose">
          <p>
            <span className="label-caps text-accent-ink mr-2">Gated</span>
            CI asserts mean bias from 0 to <N>{pct(gatedMax)}%</N>: at days {listJoin([...EARLY_GATE_DAYS])} no band may fall
            more than <N>{points(UNDER_TOLERANCE, 0)}</N> points under nominal. At day {horizon} every level, {pct(topBias.bias)}%
            included, must sit within <N>{points(UNDER_TOLERANCE, 0)}</N> points under and <N>{points(OVER_TOLERANCE, 0)}</N>{' '}
            over. Other days are reported, not gated.
          </p>
          <p>
            <span className="label-caps text-warning mr-2">Limit</span>
            {pct(topBias.bias)}% mean under-logging is the limit. At {pct(topBias.bias)}% the early bands sit at the edge,{' '}
            <N>{triple(topEarly)}%</N> at day {firstDay}, and nothing asserts them. Above {pct(topBias.bias)}% they will
            be too narrow until the weigh-ins catch up.
          </p>
          {others.map((other) => (
            <p key={other.variant} className="text-muted-foreground">
              Why this prior: the same people were also run under a prior {priorShape(other.variant)} (
              {variantLabel(other.variant)}). Its worst distance from nominal was{' '}
              <N>{points(other.worstCoverageDeviation)}</N> points, against <N>{points(chosen.worstCoverageDeviation)}</N> for
              the prior that ships, {priorShape(chosen.variant)} ({variantLabel(chosen.variant)}).
            </p>
          ))}
        </div>
      </LabSection>

      <LabSection index="04" id="edge-cohorts" title="Edge cohorts">
        <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
          The same engine on people the realistic cohort under-represents. Errors are median absolute errors in kcal per day;
          coverage is the share inside the 50/80/95% bands.
        </p>
        <EdgeCohorts report={report} />
      </LabSection>

      <LabSection index="05" id="limits" title="Known limits">
        <DashList
          items={[
            <>
              It estimates {h.quantity.name}, not true TDEE. A scale and a food log cannot tell a steady under-logging habit
              from a lower expenditure, because the two only ever show up as their sum, so the engine never estimates the
              bias itself.
            </>,
            <>
              The prior is lowered <N>{pct(prior.loggingBiasMean)}%</N> for typical under-logging, which costs people who
              log honestly: for them it starts about <N>{int(Math.abs(checkpoint(accurate, firstDay).meanErrorKcal.prior))}</N>{' '}
              kcal low, and the engine only beats the raw formula from day <N>{accurate.crossoverDay ?? '—'}</N>.
            </>,
            <>
              The gate&apos;s margins are thin. Its tightest check on this run is that {tightest.label}; it passes by{' '}
              <N>{points(tightest.slack)}</N> points. Sampling noise on a coverage share has a standard deviation of up to{' '}
              <N>{points(samplingSd(h.people))}</N> points at this cohort size, and CI runs a smaller cohort on another
              seed, so a change that costs a few points of early coverage will fail it.
            </>,
            <>
              The gate covers mean under-logging of 0–<N>{pct(gatedMax)}%</N>. At <N>{pct(topBias.bias)}%</N> the early
              bands sit at the edge (<N>{triple(topEarly)}%</N> at day {firstDay}), and beyond it they will be too narrow
              until the weigh-ins catch up.
            </>,
            <>
              A day without logged calories is filled in from the <N>{config.engineParams.intakeMemoryDays}</N>-day average
              of what was logged, with a wide allowance. Someone who skips logging on the days they overeat will read
              slightly high.
            </>,
          ]}
        />
      </LabSection>

      <LabSection index="06" id="reproduce" title="Reproduce it">
        <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
          Every number on this page is read at build time from <code className="readout text-foreground">calibration.json</code>
          , which one command regenerates byte for byte.
        </p>
        <pre className="readout text-sm text-foreground bg-muted border border-border rounded-[2px] px-4 py-3">
          <code>{['npm ci', 'npm run calibrate', 'npm test'].join('\n')}</code>
        </pre>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
          <dt className="label-caps text-muted-foreground sm:pt-0.5">Seed</dt>
          <dd className="readout text-foreground">{config.seed}</dd>
          <dt className="label-caps text-muted-foreground sm:pt-0.5">Cohorts</dt>
          <dd className="text-foreground">
            realistic <N>{int(config.people.realistic)}</N>;{' '}
            {EDGE_SCENARIOS.map((s, i) => (
              <span key={s}>
                {EDGE_LABELS[s]} <N>{int(config.people[s])}</N>
                {i < EDGE_SCENARIOS.length - 1 ? '; ' : ''}
              </span>
            ))}
          </dd>
          <dt className="label-caps text-muted-foreground sm:pt-0.5">Bias sweep</dt>
          <dd className="text-foreground">
            <N>{int(config.sweepPeople)}</N> people at each of {listJoin(report.sweep.loggingBiasMeans.map((b) => `${pct(b)}%`))}{' '}
            mean bias, the same people under each of the {grid.variants.length} priors
          </dd>
          <dt className="label-caps text-muted-foreground sm:pt-0.5">Horizon</dt>
          <dd className="text-foreground">
            <N>{horizon}</N> days, checkpoints at days {listJoin(config.checkpointDays)}
          </dd>
          <dt className="label-caps text-muted-foreground sm:pt-0.5">Prior</dt>
          <dd className="text-foreground">
            mean <N>formula × {(1 - prior.loggingBiasMean).toFixed(2)}</N>, SD <N>{(priorSd * 100).toFixed(1)}%</N> of the
            formula
          </dd>
          <dt className="label-caps text-muted-foreground sm:pt-0.5">Schema</dt>
          <dd className="text-foreground">
            version <N>{report.schemaVersion}</N>
          </dd>
        </dl>
        <Disclosure summary="Engine parameters">
          <DataTable
            caption="Engine parameters used for every cohort"
            columns={[
              { key: 'name', label: 'Parameter' },
              { key: 'value', label: 'Value' },
            ]}
            rows={Object.entries(config.engineParams).map(([name, value]) => ({
              key: name,
              header: name,
              cells: [Array.isArray(value) ? value.join('–') : String(value)],
            }))}
          />
        </Disclosure>
        <p className="text-sm text-foreground leading-relaxed max-w-prose">
          CI runs <code className="readout">npm test</code> on every push and pull request. The gate in{' '}
          <code className="readout">calibration.test.ts</code> reruns a smaller seeded cohort and fails the build if coverage
          or error regresses past its tolerances, and a second check fails if this file no longer matches the engine&apos;s
          parameters or schema.
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <li>
            <a href={`${REPO}/src/lib/engine/README.md`} className={`inline-flex items-center min-h-11 ${external}`}>
              Engine README on GitHub
            </a>
          </li>
          <li>
            <a href={`${REPO}/src/lib/engine/calibration.json`} className={`inline-flex items-center min-h-11 ${external}`}>
              calibration.json on GitHub
            </a>
          </li>
        </ul>
      </LabSection>

      <BackLink href="/">← Back to Calculator</BackLink>
    </DocSheet>
  );
}
