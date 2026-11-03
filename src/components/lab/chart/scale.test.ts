import { describe, expect, it } from 'vitest';
import { bandCentres, linePath, linearScale, niceDomain, niceStep, plotBox, spreadLabels } from './scale';

describe('linearScale', () => {
  it('maps the domain ends onto the range ends, including an inverted range', () => {
    const y = linearScale([0, 200], [150, 10]);
    expect(y(0)).toBe(150);
    expect(y(200)).toBe(10);
    expect(y(100)).toBe(80);
  });

  it('extrapolates outside the domain', () => {
    expect(linearScale([0, 10], [0, 100])(12)).toBe(120);
  });

  it('rejects an empty or non-finite domain', () => {
    expect(() => linearScale([5, 5], [0, 1])).toThrow(RangeError);
    expect(() => linearScale([0, Number.NaN], [0, 1])).toThrow(RangeError);
  });
});

describe('niceStep and niceDomain', () => {
  it('picks 1, 2 or 5 times a power of ten', () => {
    expect(niceStep(189, 4)).toBe(50);
    expect(niceStep(0.3, 3)).toBe(0.1);
    expect(niceStep(1000, 3)).toBe(500);
    expect(niceStep(7, 1)).toBe(10);
  });

  it('rejects a non-positive span', () => {
    expect(() => niceStep(0, 4)).toThrow(RangeError);
  });

  it('covers the data with whole steps and lists every tick', () => {
    expect(niceDomain(0, 188.86, 4)).toEqual({ domain: [0, 200], ticks: [0, 50, 100, 150, 200] });
    expect(niceDomain(42, 61, 4)).toEqual({ domain: [40, 65], ticks: [40, 45, 50, 55, 60, 65] });
  });

  it('gives exact decimal ticks without floating-point drift', () => {
    const { ticks } = niceDomain(0.4, 1, 6);
    expect(ticks).toEqual([0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
  });

  it('still spans one step when min equals max', () => {
    const { domain, ticks } = niceDomain(100, 100, 4);
    expect(domain[1]).toBeGreaterThan(domain[0]);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
  });
});

describe('plotBox', () => {
  it('takes the margins off the frame', () => {
    const frame = { width: 300, height: 200, pad: { top: 10, right: 50, bottom: 20, left: 30 }, font: 11 };
    expect(plotBox(frame)).toEqual({ left: 30, right: 250, top: 10, bottom: 180 });
  });
});

describe('bandCentres', () => {
  it('centres equal bands across the span', () => {
    expect(bandCentres(4, 0, 400)).toEqual([50, 150, 250, 350]);
  });
});

describe('linePath', () => {
  it('moves to the first point and draws lines to the rest, rounded to 0.1', () => {
    expect(linePath([[0, 10], [1.234, 5.678], [2, 0]])).toBe('M0.0 10.0 L1.2 5.7 L2.0 0.0');
  });

  it('is empty for no points', () => {
    expect(linePath([])).toBe('');
  });
});

describe('spreadLabels', () => {
  it('leaves well-separated labels where they are, sorted top to bottom', () => {
    const out = spreadLabels([{ key: 'b', y: 80 }, { key: 'a', y: 20 }], 12, 0, 100);
    expect(out).toEqual([{ key: 'a', y: 20 }, { key: 'b', y: 80 }]);
  });

  it('pushes close labels apart by the gap', () => {
    const out = spreadLabels([{ key: 'a', y: 50 }, { key: 'b', y: 52 }, { key: 'c', y: 53 }], 12, 0, 100);
    expect(out.map((l) => l.y)).toEqual([50, 62, 74]);
  });

  it('shifts the stack up when it would run past the bottom, keeping the gap', () => {
    const out = spreadLabels([{ key: 'a', y: 95 }, { key: 'b', y: 96 }], 12, 0, 100);
    expect(out.map((l) => l.y)).toEqual([88, 100]);
  });

  it('never places a label above the top, even when the stack cannot fit', () => {
    const out = spreadLabels([{ key: 'a', y: 5 }, { key: 'b', y: 6 }, { key: 'c', y: 7 }], 12, 0, 10);
    expect(out.map((l) => l.y)).toEqual([0, 12, 24]);
  });

  it('does not change its input', () => {
    const input = [{ key: 'a', y: 50 }, { key: 'b', y: 51 }];
    spreadLabels(input, 12, 0, 100);
    expect(input).toEqual([{ key: 'a', y: 50 }, { key: 'b', y: 51 }]);
  });
});
