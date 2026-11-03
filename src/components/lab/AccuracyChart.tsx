import { int } from '@/lib/lab/format';
import type { AccuracySeries } from '@/lib/lab/report';
import { ChartSvg, DataTable, Disclosure, EndLabels, Line, Responsive, XLabels, YGrid, type AxisLabel } from './chart/Chart';
import { linearScale, niceDomain, plotBox, type Frame, type Point } from './chart/scale';

// Narrow viewBox for phones, wide from sm up; both keep 11-unit labels near 11px.
const COMPACT: Frame = { width: 300, height: 196, pad: { top: 18, right: 56, bottom: 24, left: 30 }, font: 11 };
const WIDE: Frame = { width: 640, height: 250, pad: { top: 18, right: 62, bottom: 24, left: 34 }, font: 11 };

interface AccuracyChartProps {
  series: AccuracySeries;
  checkpointDays: readonly number[];
  people: number;
}

/** Median absolute error by day: the engine against the raw formula and its own prior. */
export default function AccuracyChart({ series, checkpointDays, people }: AccuracyChartProps) {
  const label = describe(series, people);
  const drawing = (frame: Frame) => <Drawing frame={frame} series={series} checkpointDays={checkpointDays} label={label} />;
  const last = series.engine.length - 1;
  const row = (day: number) => ({
    key: String(day),
    header: day,
    cells: [int(series.engine[day]), int(series.formula[day]), int(series.prior[day])],
  });
  const columns = [
    { key: 'day', label: 'Day' },
    { key: 'engine', label: 'Engine' },
    { key: 'formula', label: 'Formula' },
    { key: 'prior', label: 'Prior' },
  ];

  return (
    <figure className="space-y-3">
      <Responsive compact={drawing(COMPACT)} wide={drawing(WIDE)} />
      <figcaption className="text-xs text-muted-foreground leading-relaxed">
        Median absolute error, kcal per day. Solid: the engine. Dashed: the raw formula. Dotted: the prior, the engine&apos;s
        starting point. Neither baseline is ever updated. Dots mark the checkpoint days in the table.
      </figcaption>
      <DataTable
        caption="Median absolute error at the checkpoint days, kcal per day"
        columns={columns}
        rows={checkpointDays.filter((d) => d <= last).map(row)}
      />
      <Disclosure summary={`Every day (${last + 1} rows)`}>
        <DataTable caption="Median absolute error on every day, kcal per day" columns={columns} rows={series.engine.map((_, day) => row(day))} />
      </Disclosure>
    </figure>
  );
}

function describe(series: AccuracySeries, people: number): string {
  const last = series.engine.length - 1;
  const formulaLow = Math.min(...series.formula);
  const formulaHigh = Math.max(...series.formula);
  const crossing =
    series.belowPriorFrom === null ? 'It does not end below the prior.' : `It stays below the prior from day ${series.belowPriorFrom}.`;
  return (
    `Line chart of median absolute error by day, day 0 to ${last}, for ${int(people)} simulated people. ` +
    `The engine falls from ${int(series.engine[0])} to ${int(series.engine[last])} kcal per day. ` +
    `The raw formula stays between ${int(formulaLow)} and ${int(formulaHigh)}. ` +
    `The prior goes from ${int(series.prior[0])} to ${int(series.prior[last])}. ${crossing}`
  );
}

function Drawing({ frame, series, checkpointDays, label }: { frame: Frame; series: AccuracySeries; checkpointDays: readonly number[]; label: string }) {
  const box = plotBox(frame);
  const last = series.engine.length - 1;
  const { domain, ticks } = niceDomain(0, Math.max(...series.engine, ...series.formula, ...series.prior), 4);
  const x = linearScale([0, last], [box.left, box.right]);
  const y = linearScale(domain, [box.bottom, box.top]);
  const points = (values: readonly number[]): Point[] => values.map((v, day) => [x(day), y(v)]);
  const marks = checkpointDays.filter((d) => d > 0 && d <= last);

  const axis: AxisLabel[] = [
    { x: x(0), text: '0', anchor: 'start' },
    ...marks.map((d): AxisLabel => (d === last ? { x: x(d), text: `day ${d}`, anchor: 'end' } : { x: x(d), text: String(d) })),
  ];

  return (
    <ChartSvg frame={frame} label={label}>
      <YGrid ticks={ticks} y={y} left={box.left} right={box.right} font={frame.font} />
      <text x={0} y={box.top - 8} fontSize={frame.font} className="font-mono fill-muted-foreground">
        kcal
      </text>
      {marks
        .filter((d) => d < last)
        .map((d) => (
          <line key={d} x1={x(d)} x2={x(d)} y1={box.top} y2={box.bottom} strokeWidth={1} strokeDasharray="2 3" className="stroke-border-strong" />
        ))}

      <Line points={points(series.formula)} className="stroke-muted-foreground" width={1.25} dash="4 3" />
      <Line points={points(series.prior)} className="stroke-foreground" width={1.5} dash="1.5 2.5" />
      <Line points={points(series.engine)} className="stroke-accent-ink" width={2.25} />
      {marks.map((d) => (
        <circle key={d} cx={x(d)} cy={y(series.engine[d])} r={3} strokeWidth={1.5} className="fill-accent-ink stroke-card" />
      ))}

      <XLabels labels={axis} y={box.bottom} font={frame.font} />
      <EndLabels
        x={box.right + 6}
        font={frame.font}
        top={box.top}
        bottom={box.bottom}
        labels={[
          { key: 'engine', text: 'engine', y: y(series.engine[last]), className: 'fill-foreground' },
          { key: 'formula', text: 'formula', y: y(series.formula[last]), className: 'fill-muted-foreground' },
          { key: 'prior', text: 'prior', y: y(series.prior[last]), className: 'fill-muted-foreground' },
        ]}
      />
    </ChartSvg>
  );
}
