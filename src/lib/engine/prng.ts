// Seeded pseudo-random numbers for the simulator. The engine itself never uses
// randomness. mulberry32 is small, fast and well-distributed enough for Monte
// Carlo work at this scale; it is not cryptographic.

export interface Rng {
  /** Uniform on [0, 1). */
  next(): number;
  uniform(min: number, max: number): number;
  normal(mean?: number, sd?: number): number;
  bernoulli(p: number): boolean;
  /** Picks by relative weight. */
  weighted<T>(options: readonly (readonly [T, number])[]): T;
}

/** Mixes a seed with a stream index so each simulated person has an independent stream. */
export function deriveSeed(seed: number, stream: number): number {
  let h = (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(stream + 0x7f4a7c15, 0xc2b2ae35)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    uniform: (min, max) => min + (max - min) * next(),
    normal: (mean = 0, sd = 1) => {
      // Box-Muller; 1 - next() lies in (0, 1], so the log is finite.
      const r = Math.sqrt(-2 * Math.log(1 - next()));
      return mean + sd * r * Math.cos(2 * Math.PI * next());
    },
    bernoulli: (p) => next() < p,
    weighted: (options) => {
      const total = options.reduce((sum, [, w]) => sum + w, 0);
      let x = next() * total;
      for (const [value, w] of options) {
        x -= w;
        if (x < 0) return value;
      }
      return options[options.length - 1][0];
    },
  };
}
