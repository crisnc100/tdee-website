import type { ReactNode } from 'react';
import { linePath, spreadLabels, type Frame, type Point, type Scale } from './scale';

// Small drawing pieces for the lab page's charts. Server components with no
// state: every chart renders once at build time. Colours come from the theme
// tokens through Tailwind's fill-* and stroke-* classes.

/** The SVG itself: a viewBox the size of the frame and one accessible name. */
export function ChartSvg({ frame, label, children }: { frame: Frame; label: string; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${frame.width} ${frame.height}`} role="img" aria-label={label} className="block w-full h-auto">
      {children}
    </svg>
  );
}

/**
 * One chart drawn twice: a narrow viewBox below the sm breakpoint and a wide
 * one from it up, so labels stay near their set size on a phone and on a
 * desktop. The hidden drawing is display: none, so assistive tech meets one.
 */
export function Responsive({ compact, wide }: { compact: ReactNode; wide: ReactNode }) {
  return (
    <>
      <div className="sm:hidden max-w-[26rem]">{compact}</div>
      <div className="hidden sm:block">{wide}</div>
    </>
  );
}

/** Horizontal gridlines with their values at the left edge. */
export function YGrid({
  ticks,
  y,
  left,
  right,
  font,
  format = String,
}: {
  ticks: readonly number[];
  y: Scale;
  left: number;
  right: number;
  font: number;
  format?: (value: number) => string;
}) {
  return (
    <g>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={left} x2={right} y1={y(t)} y2={y(t)} strokeWidth={1} className="stroke-border" />
          <text x={left - 5} y={y(t)} dominantBaseline="middle" textAnchor="end" fontSize={font} className="font-mono fill-muted-foreground">
            {format(t)}
          </text>
        </g>
      ))}
    </g>
  );
}

export interface AxisLabel {
  x: number;
  text: string;
  anchor?: 'start' | 'middle' | 'end';
}

/** Labels along the bottom edge, each with a short tick above it. */
export function XLabels({ labels, y, font }: { labels: readonly AxisLabel[]; y: number; font: number }) {
  return (
    <g>
      {labels.map((l) => (
        <g key={`${l.x}-${l.text}`}>
          <line x1={l.x} x2={l.x} y1={y} y2={y + 3} strokeWidth={1} className="stroke-border-strong" />
          <text x={l.x} y={y + 4 + font} textAnchor={l.anchor ?? 'middle'} fontSize={font} className="font-mono fill-muted-foreground">
            {l.text}
          </text>
        </g>
      ))}
    </g>
  );
}

/** A data line. Dashed lines get butt caps so the dash pattern stays even. */
export function Line({
  points,
  className,
  width = 1.5,
  dash,
}: {
  points: readonly Point[];
  className: string;
  width?: number;
  dash?: string;
}) {
  return (
    <path
      d={linePath(points)}
      fill="none"
      strokeWidth={width}
      strokeDasharray={dash}
      strokeLinejoin="round"
      strokeLinecap={dash ? 'butt' : 'round'}
      className={className}
    />
  );
}

/** A full-width horizontal reference line, e.g. a band's nominal coverage. */
export function RefLine({ y, left, right, className = 'stroke-muted-foreground' }: { y: number; left: number; right: number; className?: string }) {
  return <line x1={left} x2={right} y1={y} y2={y} strokeWidth={1.25} strokeDasharray="4 3" className={className} />;
}

export interface EndLabel {
  key: string;
  text: string;
  /** Where the series ends; the label may move to clear its neighbours. */
  y: number;
  className: string;
}

/** Direct labels at the right end of each line, spread so they never overlap. */
export function EndLabels({ labels, x, font, top, bottom }: { labels: readonly EndLabel[]; x: number; font: number; top: number; bottom: number }) {
  return (
    <g>
      {spreadLabels(labels, font + 1, top, bottom).map((l) => (
        <text key={l.key} x={x} y={l.y} dominantBaseline="middle" fontSize={font} className={`font-mono ${l.className}`}>
          {l.text}
        </text>
      ))}
    </g>
  );
}

export interface Column {
  key: string;
  label: ReactNode;
}

export interface Row {
  key: string;
  header: ReactNode;
  cells: ReactNode[];
}

/** A compact numeric table. The first column holds the row headers. */
export function DataTable({ caption, columns, rows }: { caption: string; columns: readonly Column[]; rows: readonly Row[] }) {
  return (
    <table className="w-full readout text-xs text-foreground">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-border-strong">
          {columns.map((c, i) => (
            <th key={c.key} scope="col" className={`py-1.5 px-1.5 font-normal text-muted-foreground ${i === 0 ? 'text-left' : 'text-right'}`}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} className="border-b border-border last:border-b-0">
            <th scope="row" className="py-1.5 px-1.5 text-left font-normal text-muted-foreground">
              {r.header}
            </th>
            {r.cells.map((cell, i) => (
              <td key={columns[i + 1]?.key ?? i} className="py-1.5 px-1.5 text-right">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A native disclosure for the full data behind a chart. Needs no script. */
export function Disclosure({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="min-h-11 inline-flex items-center gap-2 label-caps text-accent-ink cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:underline underline-offset-4">
        <span aria-hidden="true" className="font-mono w-3 group-open:hidden">
          +
        </span>
        <span aria-hidden="true" className="font-mono w-3 hidden group-open:inline">
          −
        </span>
        {summary}
      </summary>
      <div className="pt-1 pb-2">{children}</div>
    </details>
  );
}
