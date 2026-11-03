import { describe, expect, it } from 'vitest';
import { int, listJoin, pct, points, signedPoints, triple } from './format';

describe('lab number formatting', () => {
  it('rounds whole numbers with en-US separators and never prints -0', () => {
    expect(int(5000)).toBe('5,000');
    expect(int(20261103)).toBe('20,261,103');
    expect(int(68.2873)).toBe('68');
    expect(int(-0.4)).toBe('0');
  });

  it('prints shares as whole percentages', () => {
    expect(pct(0.6868)).toBe('69');
    expect(pct(0.5194)).toBe('52');
    expect(pct(1)).toBe('100');
  });

  it('prints signed points with a true minus sign, and 0 without a sign', () => {
    expect(signedPoints(0.1868)).toBe('+19');
    expect(signedPoints(-0.026)).toBe('−3');
    expect(signedPoints(0.004)).toBe('0');
    expect(signedPoints(-0.004)).toBe('0');
    expect(signedPoints(0.0326, 1)).toBe('+3.3');
  });

  it('prints unsigned points to the given places', () => {
    expect(points(0.0326)).toBe('3.3');
    expect(points(-0.0048, 2)).toBe('0.48');
    expect(points(0.00707)).toBe('0.7');
  });

  it('joins lists in plain English', () => {
    expect(listJoin([])).toBe('');
    expect(listJoin([7])).toBe('7');
    expect(listJoin([7, 14])).toBe('7 and 14');
    expect(listJoin([7, 14, 28, 56])).toBe('7, 14, 28 and 56');
  });

  it('prints a coverage triple', () => {
    expect(triple({ p50: 0.474, p80: 0.798, p95: 0.9585 })).toBe('47/80/96');
  });
});
