import type { CSSProperties } from 'react';

interface TDEEGaugeProps {
  tdee: number;
  /** The number shown in the centre; counts up to tdee on reveal. */
  displayValue: number;
  lower: number;
  upper: number;
}

// Dial geometry in viewBox units. Angles are degrees clockwise from 12 o'clock;
// the dial sweeps 240 degrees with the gap at the bottom.
const VIEW_W = 250;
const VIEW_H = 192;
const CX = 125;
const CY = 118;
const R = 80;
const START = -120;
const SWEEP = 240;
const ARC_LENGTH = (R * SWEEP * Math.PI) / 180;

function polar(angle: number, radius: number) {
  const a = (angle * Math.PI) / 180;
  return { x: CX + radius * Math.sin(a), y: CY - radius * Math.cos(a) };
}

function arcPath(from: number, to: number, radius: number) {
  const s = polar(from, radius);
  const e = polar(to, radius);
  const large = to - from > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function radial(angle: number, r1: number, r2: number) {
  const a = polar(angle, r1);
  const b = polar(angle, r2);
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}

/** Scale top: the next 1,000 above 1.2x the upper bound, never below 3,000. */
function scaleMax(upper: number) {
  return Math.max(3000, Math.ceil((upper * 1.2) / 1000) * 1000);
}

export default function TDEEGauge({ tdee, displayValue, lower, upper }: TDEEGaugeProps) {
  const max = scaleMax(upper);
  const fraction = (v: number) => Math.min(1, Math.max(0, v / max));
  const angleOf = (v: number) => START + fraction(v) * SWEEP;

  const minorStep = max <= 4000 ? 250 : 500;
  const ticks: { value: number; major: boolean }[] = [];
  for (let v = 0; v <= max; v += minorStep) ticks.push({ value: v, major: v % 1000 === 0 });

  const valueAngle = angleOf(tdee);
  const lowAngle = angleOf(lower);
  const highAngle = angleOf(upper);
  const sweepStyle = {
    strokeDasharray: `${ARC_LENGTH} ${ARC_LENGTH}`,
    strokeDashoffset: ARC_LENGTH * (1 - fraction(tdee)),
    '--sweep-from': ARC_LENGTH,
  } as CSSProperties;

  return (
    <figure className="relative w-full max-w-[22rem] mx-auto">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="block w-full h-auto"
        role="img"
        aria-label={`Gauge: ${tdee.toLocaleString()} calories per day on a scale of 0 to ${max.toLocaleString()}, with the likely range of ${lower.toLocaleString()} to ${upper.toLocaleString()} marked.`}
      >
        {/* Scale ticks and labels, outside the dial */}
        {ticks.map(({ value, major }) => {
          const angle = angleOf(value);
          const line = radial(angle, R + 10, major ? R + 18 : R + 14);
          const label = polar(angle, R + 28);
          return (
            <g key={value}>
              <line
                {...line}
                strokeWidth={1}
                className={major ? 'stroke-muted-foreground' : 'stroke-border-strong'}
              />
              {major && (
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground font-mono"
                  fontSize={9}
                >
                  {value === 0 ? '0' : `${value / 1000}k`}
                </text>
              )}
            </g>
          );
        })}

        {/* Track, then the value arc that sweeps in */}
        <path d={arcPath(START, START + SWEEP, R)} fill="none" strokeWidth={12} className="stroke-muted" />
        <path
          d={arcPath(START, START + SWEEP, R)}
          fill="none"
          strokeWidth={12}
          className="stroke-accent-ink lab-sweep"
          style={sweepStyle}
        />

        {/* Likely range: a bracket hugging the inside of the dial */}
        <g className="lab-fade">
          <path d={arcPath(lowAngle, highAngle, R - 12)} fill="none" strokeWidth={2.5} className="stroke-foreground" />
          <line {...radial(lowAngle, R - 16, R - 8)} strokeWidth={1.5} className="stroke-foreground" />
          <line {...radial(highAngle, R - 16, R - 8)} strokeWidth={1.5} className="stroke-foreground" />
          {/* Needle across the dial at the estimate */}
          <line {...radial(valueAngle, R - 9, R + 9)} strokeWidth={2} className="stroke-foreground" />
        </g>
      </svg>

      {/* Centre readout. The counting number is hidden from screen readers;
          the sr-only line carries the final value. */}
      <figcaption className="absolute left-1/2 top-[61.5%] -translate-x-1/2 -translate-y-1/2 text-center">
        <span className="block label-caps text-muted-foreground">TDEE</span>
        <span
          aria-hidden="true"
          className="block readout text-4xl sm:text-5xl font-semibold leading-none text-accent-ink mt-1"
        >
          {displayValue.toLocaleString()}
        </span>
        <span className="sr-only">Your TDEE: {tdee.toLocaleString()} calories per day.</span>
        <span aria-hidden="true" className="block label-caps text-muted-foreground mt-1.5">
          kcal / day
        </span>
      </figcaption>
    </figure>
  );
}
