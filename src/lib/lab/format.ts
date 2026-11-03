// Number formatting for the lab page. The page renders once at build time, so
// the locale is fixed rather than taken from the build machine.

const MINUS = '−';
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Rounds to a whole number with thousands separators: 5000 -> "5,000". */
export function int(value: number): string {
  return whole.format(Math.round(value) || 0);
}

/** A share as whole percentage points without the sign: 0.6868 -> "69". */
export function pct(share: number): string {
  return int(share * 100);
}

/** A share as signed percentage points: 0.1868 -> "+19", -0.026 -> "−3", 0.004 -> "0". */
export function signedPoints(share: number, digits = 0): string {
  const factor = 10 ** digits;
  const rounded = Math.round(Math.abs(share) * 100 * factor) / factor;
  if (rounded === 0) return (0).toFixed(digits);
  return `${share < 0 ? MINUS : '+'}${rounded.toFixed(digits)}`;
}

/** A share as unsigned percentage points to `digits` places: 0.0326 -> "3.3". */
export function points(share: number, digits = 1): string {
  return (Math.round(Math.abs(share) * 100 * 10 ** digits) / 10 ** digits).toFixed(digits);
}

/** "7", "7 and 14", "7, 14, 28 and 56". */
export function listJoin(items: readonly (string | number)[]): string {
  const parts = items.map(String);
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/** Coverage at the three levels, e.g. "52/81/94". */
export function triple(coverage: { p50: number; p80: number; p95: number }): string {
  return `${pct(coverage.p50)}/${pct(coverage.p80)}/${pct(coverage.p95)}`;
}
