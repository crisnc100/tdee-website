import type { CSSProperties } from 'react';
import { NEAR_NOMINAL, type HeatBin } from '@/lib/lab/report';
import { OVER_TOLERANCE, UNDER_TOLERANCE } from '@/lib/lab/gate';
import { points } from '@/lib/lab/format';

// Shading for the robustness table. Each tint is the token mixed into the card
// colour, so scripts/check-contrast.mjs can check the text on it exactly; it
// reads these two opacities from this file. The printed numbers carry the
// data, so the shading itself is a second cue, not the only one.
export const HEAT_TINT_LIGHT = 0.16;
export const HEAT_TINT_STRONG = 0.34;

const TINTS: Record<HeatBin, { token: 'danger' | 'surplus'; amount: number } | null> = {
  underBeyondGate: { token: 'danger', amount: HEAT_TINT_STRONG },
  under: { token: 'danger', amount: HEAT_TINT_LIGHT },
  near: null,
  over: { token: 'surplus', amount: HEAT_TINT_LIGHT },
  overBeyondBound: { token: 'surplus', amount: HEAT_TINT_STRONG },
};

export function heatBackground(bin: HeatBin): CSSProperties | undefined {
  const tint = TINTS[bin];
  if (!tint) return undefined;
  return { backgroundColor: `color-mix(in srgb, var(--color-${tint.token}) ${Math.round(tint.amount * 100)}%, var(--color-card))` };
}

const near = points(NEAR_NOMINAL, 0);
const under = points(UNDER_TOLERANCE, 0);
const over = points(OVER_TOLERANCE, 0);

/** Legend entries, narrowest bands first. */
export const HEAT_LEGEND: { bin: HeatBin; label: string }[] = [
  { bin: 'underBeyondGate', label: `more than ${under} points too narrow (past the gate's floor)` },
  { bin: 'under', label: `${near}–${under} points too narrow` },
  { bin: 'near', label: `within ${near} points of nominal` },
  { bin: 'over', label: `${near}–${over} points too wide` },
  { bin: 'overBeyondBound', label: `more than ${over} points too wide` },
];
