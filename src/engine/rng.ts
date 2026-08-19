/** Seedable PRNG (mulberry32). Deterministic for tests; UI seeds from Date.now(). */
export type Rng = () => number; // returns [0, 1)

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
}

/** Pick an index from a list of non-negative weights (need not sum to 1). */
export function weightedIndex(weights: number[], rng: Rng): number {
  let total = 0;
  for (const w of weights) total += w;
  let roll = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll < 0) return i;
  }
  return weights.length - 1; // float edge case
}

export function pickUniform<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}
