import { describe, expect, it } from 'vitest';
import { ODDS, POOLS } from '../src/engine/data';
import { openPack } from '../src/engine/openPack';
import { RARITIES } from '../src/engine/rarity';
import type { Rarity } from '../src/engine/types';

const N = 200_000;
const PACK = 'A1-charizard';

interface SimStats {
  godPacks: number;
  slotRarity: Record<Rarity, number>[]; // per-slot counts (regular packs only)
  cardCounts: Map<string, number>; // per-card counts across all slots
}

function simulate(n: number): SimStats {
  const stats: SimStats = {
    godPacks: 0,
    slotRarity: Array.from({ length: 5 }, () =>
      Object.fromEntries(RARITIES.map((r) => [r, 0])) as Record<Rarity, number>,
    ),
    cardCounts: new Map(),
  };
  for (let seed = 1; seed <= n; seed++) {
    const result = openPack(PACK, POOLS, ODDS, seed);
    if (result.isGodPack) {
      stats.godPacks++;
    } else {
      result.cards.forEach((card, slot) => {
        stats.slotRarity[slot][card.rarity]++;
      });
    }
    for (const card of result.cards) {
      stats.cardCounts.set(card.id, (stats.cardCounts.get(card.id) ?? 0) + 1);
    }
  }
  return stats;
}

const stats = simulate(N);
const regular = N - stats.godPacks;

describe(`openPack — ${N.toLocaleString()} simulated ${PACK} packs`, () => {
  it('prints the rarity histogram', () => {
    const rows = stats.slotRarity.map((counts, slot) => ({
      slot: slot + 1,
      ...Object.fromEntries(
        RARITIES.map((r) => [r, ((counts[r] / regular) * 100).toFixed(3) + '%']),
      ),
    }));
    console.table(rows);
    console.log(`god packs: ${stats.godPacks} (${((stats.godPacks / N) * 100).toFixed(4)}%)`);
  });

  it('slots 1–3 are always D1 in regular packs', () => {
    for (let slot = 0; slot < 3; slot++) {
      expect(stats.slotRarity[slot].D1).toBe(regular);
    }
  });

  it('slot 4/5 rarity frequencies match the odds table within tolerance', () => {
    for (const slot of [3, 4]) {
      for (const r of RARITIES) {
        const expected = ODDS.slots[slot][r] / 100;
        const observed = stats.slotRarity[slot][r] / regular;
        // binomial std dev + small absolute floor for the very rare tails
        const sd = Math.sqrt((expected * (1 - expected)) / regular);
        const tolerance = 4 * sd + 0.0002;
        expect(
          Math.abs(observed - expected),
          `slot ${slot + 1} ${r}: expected ${expected}, observed ${observed}`,
        ).toBeLessThanOrEqual(tolerance);
      }
    }
  });

  it('god pack rate ≈ 0.05%', () => {
    const expected = ODDS.godPackChance;
    const sd = Math.sqrt((expected * (1 - expected)) / N);
    expect(Math.abs(stats.godPacks / N - expected)).toBeLessThanOrEqual(4 * sd + 0.0001);
  });

  it('per-card CROWN rate is in the ballpark of published numbers', () => {
    // Reference: Charizard ex ♛ ≈ 0.013% slot 4 + 0.053% slot 5 ≈ 0.066% per pack
    // (plus a tiny god-pack contribution). Our engine: (0.04 + 0.16)% ÷ crownPoolSize.
    const crownPool = POOLS[PACK].CROWN;
    const perCardExpected =
      (ODDS.slots[3].CROWN + ODDS.slots[4].CROWN) / 100 / crownPool.length;
    expect(perCardExpected).toBeGreaterThan(0.0004); // ~0.066% when pool=3
    expect(perCardExpected).toBeLessThan(0.001);

    const crownPulls = crownPool.reduce(
      (acc, c) => acc + (stats.cardCounts.get(c.id) ?? 0),
      0,
    );
    const observedPerCard = crownPulls / crownPool.length / N;
    // Very rare event over 200k packs — just require the right order of magnitude.
    expect(observedPerCard).toBeGreaterThan(perCardExpected * 0.4);
    expect(observedPerCard).toBeLessThan(perCardExpected * 2.5);
  });

  it('all 5 slots draw only S1/S2/S3/CROWN in god packs', () => {
    // Deterministically find seeds that trigger god packs.
    let found = 0;
    for (let seed = 1; found < 20 && seed <= 500_000; seed++) {
      const result = openPack(PACK, POOLS, ODDS, seed);
      if (!result.isGodPack) continue;
      found++;
      for (const card of result.cards) {
        expect(['S1', 'S2', 'S3', 'CROWN']).toContain(card.rarity);
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  it('every pulled card actually belongs to the opened pack', () => {
    for (let seed = 1; seed <= 1000; seed++) {
      const result = openPack(PACK, POOLS, ODDS, seed);
      for (const card of result.cards) {
        expect(card.packs).toContain(PACK);
      }
    }
  });

  it('is deterministic for a given seed', () => {
    const a = openPack(PACK, POOLS, ODDS, 12345);
    const b = openPack(PACK, POOLS, ODDS, 12345);
    expect(a.cards.map((c) => c.id)).toEqual(b.cards.map((c) => c.id));
  });
});
