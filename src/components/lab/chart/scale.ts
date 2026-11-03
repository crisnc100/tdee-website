// Geometry for the lab page's hand-drawn SVG charts. Pure functions only, so
// the drawing components stay declarative and this part is unit-tested.

export type Point = readonly [x: number, y: number];
export type Scale = (value: number) => number;

/** A drawing's viewBox size, its margins and its label size, in viewBox units. */
export interface Frame {
  width: number;
  height: number;
  pad: { top: number; right: number; bottom: number; left: number };
  font: number;
}

export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** The plotting area inside a frame's margins. */
export function plotBox({ width, height, pad }: Frame): Box {
  return { left: pad.left, right: width - pad.right, top: pad.top, bottom: height - pad.bottom };
}

/** Maps [d0, d1] onto [r0, r1]. Values outside the domain extrapolate. */
export function linearScale(domain: readonly [number, number], range: readonly [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  if (!Number.isFinite(span) || span === 0) throw new RangeError(`empty domain [${d0}, ${d1}]`);
  return (value) => r0 + ((value - d0) / span) * (r1 - r0);
}

/** A round step (1, 2 or 5 times a power of ten) that cuts `span` into about `count` intervals. */
export function niceStep(span: number, count: number): number {
  if (!(span > 0) || !Number.isFinite(span)) throw new RangeError(`span must be positive, got ${span}`);
  const raw = span / Math.max(1, count);
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10;
  return nice * power;
}

/**
 * A domain from `min` rounded down to `max` rounded up to whole steps, and the
 * ticks on it. Ticks are computed by index, not by repeated addition, so they
 * carry no floating-point drift.
 */
export function niceDomain(min: number, max: number, count: number): { domain: [number, number]; ticks: number[] } {
  const step = niceStep(max > min ? max - min : Math.abs(max) || 1, count);
  const lo = Math.floor(min / step) * step;
  const hi = Math.max(Math.ceil(max / step) * step, lo + step);
  const n = Math.round((hi - lo) / step);
  const ticks = Array.from({ length: n + 1 }, (_, i) => Number((lo + i * step).toPrecision(12)));
  return { domain: [lo, hi], ticks };
}

/** Centres of `count` equal bands across [start, end], for a categorical axis. */
export function bandCentres(count: number, start: number, end: number): number[] {
  const width = (end - start) / count;
  return Array.from({ length: count }, (_, i) => start + (i + 0.5) * width);
}

/** An SVG path through the points, coordinates rounded to 0.1 unit. */
export function linePath(points: readonly Point[]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

export interface PlacedLabel {
  key: string;
  y: number;
}

/**
 * Direct labels at a chart edge: sorted top to bottom, pushed apart to at least
 * `gap`, then shifted up if the last one falls below `bottom`, never above
 * `top`. Returns new objects; the input is not changed.
 */
export function spreadLabels<T extends PlacedLabel>(labels: readonly T[], gap: number, top: number, bottom: number): T[] {
  const out = labels.map((label) => ({ ...label })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < out.length; i += 1) out[i].y = Math.max(out[i].y, out[i - 1].y + gap);
  const overflow = out.length ? out[out.length - 1].y - bottom : 0;
  if (overflow > 0) for (const label of out) label.y -= overflow;
  for (let i = 0; i < out.length; i += 1) out[i].y = Math.max(out[i].y, top + i * gap);
  return out;
}
