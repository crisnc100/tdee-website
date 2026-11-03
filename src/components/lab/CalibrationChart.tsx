import { LEVELS, NOMINAL, type Level } from '@/lib/engine/metrics';
import { int, listJoin, pct, signedPoints } from '@/lib/lab/format';
import type { CoverageRow } from '@/lib/lab/report';
import { ChartSvg, DataTable, RefLine, Responsive, XLabels } from './chart/Chart';
import { bandCentres, linearScale, plotBox, type Frame } from './chart/scale';

// One row per band. Every row spans the same number of points (BELOW under
// nominal to ABOVE over it), so a stem's length means the same in each row.
const BELOW = 0.1;
const ABOVE = 0.2;
const ROWS = LEVELS.length;

interface Geometry extends Frame {
  rowHeight: number;
}

const geometry = (width: number, rowHeight: number, labelWidth: number): Geometry => ({
  width,
  height: 4 + ROWS * rowHeight + 24,
  pad: { top: 4, right: 10, bottom: 24, left: labelWidth },
  font: 11,
  rowHeight,
});

const COMPACT = geometry(300, 70, 38);
const WIDE = geometry(640, 64, 48);

const bandName = (level: Level) => `${pct(NOMINAL[level])}% band`;

interface CalibrationChartProps {
  rows: readonly CoverageRow[];
  people: number;
}

/** Observed coverage of the 50/80/95% bands at each checkpoint, against nominal. */
export default function CalibrationChart({ rows, people }: CalibrationChartProps) {
  const label = describe(rows, people);
  return (
    <figure className="space-y-3">
      <Responsive compact={<Drawing frame={COMPACT} rows={rows} label={label} />} wide={<Drawing frame={WIDE} rows={rows} label={label} />} />
      <figcaption className="text-xs text-muted-foreground leading-relaxed">
        Dashed line: the share a band claims to hold. Dot: the share of people whose true value was inside it. A dot above
        its line means the band was wider than it needed to be; below, narrower than it claimed.
      </figcaption>
      <DataTable
        caption="Observed coverage at each checkpoint day, percent, with points from nominal"
        columns={[{ key: 'day', label: 'Day' }, ...LEVELS.map((l) => ({ key: l, label: bandName(l) }))]}
        rows={rows.map((r) => ({
          key: String(r.day),
          header: r.day,
          cells: r.cells.map((c) => (
            <>
              {pct(c.observed)}
              <span className="text-muted-foreground"> {signedPoints(c.deviation)}</span>
            </>
          )),
        }))}
      />
    </figure>
  );
}

function describe(rows: readonly CoverageRow[], people: number): string {
  const byLevel = LEVELS.map((level) => {
    const values = rows.map((r) => pct(r.cells.find((c) => c.level === level)?.observed ?? Number.NaN));
    return `${bandName(level)}: ${values.join(', ')} percent.`;
  });
  return (
    `Dot chart of the share of true values inside each band at days ${listJoin(rows.map((r) => r.day))}, ` +
    `for ${int(people)} simulated people, against nominal. ${byLevel.join(' ')}`
  );
}

function Drawing({ frame, rows, label }: { frame: Geometry; rows: readonly CoverageRow[]; label: string }) {
  const box = plotBox(frame);
  const { font, rowHeight } = frame;
  const xs = bandCentres(rows.length, box.left, box.right);

  return (
    <ChartSvg frame={frame} label={label}>
      {LEVELS.map((level, r) => {
        const nominal = NOMINAL[level];
        const rowTop = box.top + r * rowHeight;
        const y = linearScale([nominal - BELOW, nominal + ABOVE], [rowTop + rowHeight - font - 5, rowTop + font + 5]);
        const clamp = (v: number) => Math.min(nominal + ABOVE, Math.max(nominal - BELOW, v));
        return (
          <g key={level}>
            {r > 0 && <line x1={0} x2={frame.width} y1={rowTop} y2={rowTop} strokeWidth={1} className="stroke-border" />}
            <text x={0} y={y(nominal)} dominantBaseline="middle" fontSize={font} className="font-mono fill-foreground">
              {pct(nominal)}%
            </text>
            <RefLine y={y(nominal)} left={box.left} right={box.right} />
            {rows.map((row, i) => {
              const cell = row.cells.find((c) => c.level === level);
              if (!cell) return null;
              const cy = y(clamp(cell.observed));
              const above = cell.deviation >= 0;
              return (
                <g key={row.day}>
                  <line x1={xs[i]} x2={xs[i]} y1={y(nominal)} y2={cy} strokeWidth={1.5} className="stroke-accent-ink" />
                  <circle cx={xs[i]} cy={cy} r={3.5} strokeWidth={1.5} className="fill-accent-ink stroke-card" />
                  <text
                    x={xs[i]}
                    y={above ? cy - 6 : cy + 6 + font * 0.75}
                    textAnchor="middle"
                    fontSize={font}
                    className="font-mono fill-foreground"
                  >
                    {pct(cell.observed)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
      <XLabels labels={rows.map((row, i) => ({ x: xs[i], text: `day ${row.day}` }))} y={box.bottom} font={font} />
    </ChartSvg>
  );
}
