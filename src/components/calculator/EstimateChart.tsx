'use client';

import { useState, type PointerEvent } from 'react';
import type { LogEngineResult } from '@/lib/log/engine';
import { addDays } from '@/lib/log/entries';
import { band80, formatDay, kcal } from '@/components/track/shared';

// Opacity of the band's edge lines. scripts/check-contrast.mjs reads this value
// and checks the composited colour against the card at the 3:1 UI minimum.
const BAND_EDGE_OPACITY = 0.75;
const BAND_FILL_OPACITY = 0.14;

// A narrow viewBox keeps the 11-unit labels near 9-10px on a 360px phone.
const W = 280;
const H = 128;
const FONT = 11;
const PAD = { left: 4, right: 60, top: 10, bottom: 22 };

interface EstimateChartProps {
  engine: LogEngineResult;
  formulaTdee: number;
  /** Sample mode only: the simulator's true expenditure as logged, by day index. */
  truthKcal?: number[];
}

/**
 * The engine's estimate and its 80% band, one point per day, against the
 * formula. A narrowing band is the point of the chart.
 */
export default function EstimateChart({ engine, formulaTdee, truthKcal }: EstimateChartProps) {
  const days = engine.run.days;
  const [hover, setHover] = useState<number | null>(null);

  if (days.length < 2) {
    return <p className="text-xs text-muted-foreground">The chart of the estimate appears from the second day.</p>;
  }

  const values = days.flatMap((d) => [d.expenditure.intervals.p80.lower, d.expenditure.intervals.p80.upper]);
  values.push(formulaTdee, ...(truthKcal ?? []));
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(hi - lo, 100);
  const yMin = lo - span * 0.06;
  const yMax = hi + span * 0.06;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (days.length - 1)) * plotW;
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;
  const line = (pick: (i: number) => number, count = days.length) =>
    Array.from({ length: count }, (_, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(pick(i)).toFixed(1)}`).join(' ');

  const upper = (i: number) => days[i].expenditure.intervals.p80.upper;
  const lower = (i: number) => days[i].expenditure.intervals.p80.lower;
  const area =
    line(upper) +
    ' ' +
    days
      .map((_, k) => {
        const i = days.length - 1 - k;
        return `L${x(i).toFixed(1)} ${y(lower(i)).toFixed(1)}`;
      })
      .join(' ') +
    ' Z';

  const first = days[0].expenditure;
  const last = engine.current.expenditure;
  const narrowed = Math.round((1 - band80(last) / band80(first)) * 100);
  const summary =
    `Estimate by day, day 1 to day ${days.length}. It moved from ${kcal(first.mean)} ± ${kcal(band80(first))} ` +
    `to ${kcal(last.mean)} ± ${kcal(band80(last))} kcal per day; the 80% band ${narrowed >= 0 ? `narrowed by ${narrowed}%` : `widened by ${-narrowed}%`}. ` +
    `The formula is ${kcal(formulaTdee)}.` +
    (truthKcal ? ` The sample's true value on the last day is ${kcal(truthKcal[truthKcal.length - 1])}.` : '') +
    (engine.outlierDates.size ? ` ${engine.outlierDates.size} weigh-in${engine.outlierDates.size === 1 ? ' was' : 's were'} down-weighted as outliers.` : '');

  const shown = Math.min(hover ?? days.length - 1, days.length - 1);
  const shownEstimate = days[shown].expenditure;
  const onPointer = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - PAD.left) / plotW) * (days.length - 1));
    setHover(Math.min(days.length - 1, Math.max(0, i)));
  };

  // Direct labels at the right edge, in text colours; spread apart when the
  // lines end close together, then kept inside the plot.
  const LABEL_GAP = FONT + 1;
  const endLabels = [
    { key: 'estimate', text: 'estimate', y: y(last.mean), className: 'fill-foreground' },
    { key: 'formula', text: 'formula', y: y(formulaTdee), className: 'fill-muted-foreground' },
    ...(truthKcal ? [{ key: 'truth', text: 'truth', y: y(truthKcal[truthKcal.length - 1]), className: 'fill-muted-foreground' }] : []),
  ].sort((a, b) => a.y - b.y);
  for (let i = 1; i < endLabels.length; i += 1) {
    endLabels[i].y = Math.max(endLabels[i].y, endLabels[i - 1].y + LABEL_GAP);
  }
  const overflow = endLabels[endLabels.length - 1].y - (PAD.top + plotH);
  if (overflow > 0) for (const label of endLabels) label.y = Math.max(PAD.top, label.y - overflow);

  return (
    <figure className="space-y-1.5">
      <p aria-hidden="true" className="readout text-xs text-muted-foreground min-h-4">
        <span className="text-foreground">Day {shown + 1}</span> · {formatDay(addDays(engine.startDate, shown))} ·{' '}
        <span className="text-foreground">{kcal(shownEstimate.mean)}</span> ± {kcal(band80(shownEstimate))}
        {engine.outlierDates.has(addDays(engine.startDate, shown)) && <span className="text-warning"> · outlier</span>}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full h-auto touch-pan-y"
        role="img"
        aria-label={summary}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={() => setHover(null)}
      >
        {/* Baseline hairline */}
        <line x1={PAD.left} x2={PAD.left + plotW} y1={PAD.top + plotH} y2={PAD.top + plotH} strokeWidth={1} className="stroke-border" />

        <path d={area} className="fill-accent-ink" fillOpacity={BAND_FILL_OPACITY} />
        <path d={line(upper)} fill="none" strokeWidth={1} className="stroke-accent-ink" strokeOpacity={BAND_EDGE_OPACITY} />
        <path d={line(lower)} fill="none" strokeWidth={1} className="stroke-accent-ink" strokeOpacity={BAND_EDGE_OPACITY} />

        <line
          x1={PAD.left}
          x2={PAD.left + plotW}
          y1={y(formulaTdee)}
          y2={y(formulaTdee)}
          strokeWidth={1.25}
          strokeDasharray="4 3"
          className="stroke-muted-foreground"
        />
        {truthKcal && (
          <path
            d={line((i) => truthKcal[Math.min(i, truthKcal.length - 1)])}
            fill="none"
            strokeWidth={1.5}
            strokeDasharray="1.5 2.5"
            strokeLinecap="round"
            className="stroke-foreground"
          />
        )}

        <path d={line((i) => days[i].expenditure.mean)} fill="none" strokeWidth={2} strokeLinejoin="round" className="stroke-accent-ink" />

        {/* Outlier weigh-ins: short ticks on the baseline */}
        {days.map((d, i) =>
          d.weighIn === 'downweighted' ? (
            <line key={i} x1={x(i)} x2={x(i)} y1={PAD.top + plotH - 6} y2={PAD.top + plotH} strokeWidth={2} className="stroke-warning" />
          ) : null,
        )}

        {hover !== null && hover === shown && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} strokeWidth={1} className="stroke-foreground" strokeOpacity={0.5} />
            <circle cx={x(hover)} cy={y(shownEstimate.mean)} r={3.5} strokeWidth={2} className="fill-card stroke-accent-ink" />
          </g>
        )}

        {endLabels.map((label) => (
          <text key={label.key} x={W - PAD.right + 6} y={label.y} dominantBaseline="middle" fontSize={FONT} className={`font-mono ${label.className}`}>
            {label.text}
          </text>
        ))}
        <text x={PAD.left} y={H - 6} fontSize={FONT} className="font-mono fill-muted-foreground">
          day 1
        </text>
        <text x={PAD.left + plotW} y={H - 6} fontSize={FONT} textAnchor="end" className="font-mono fill-muted-foreground">
          day {days.length}
        </text>
      </svg>
      <figcaption className="text-xs text-muted-foreground">
        The shaded band is the 80% range; it narrows as weigh-ins and calories come in.
        {engine.outlierDates.size > 0 && <> Short ticks on the baseline mark outlier weigh-ins.</>}
        {truthKcal && <> The dotted line is the sample&apos;s true value, which a real log never knows.</>}
      </figcaption>
    </figure>
  );
}
