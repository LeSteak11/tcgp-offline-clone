import { describe, expect, it } from 'vitest';
import { SETS, PACKS_FILE, ODDS, POOLS } from '../src/engine/data';
import { validateData } from '../src/engine/validate';
import { RARITIES } from '../src/engine/rarity';

describe('data files', () => {
  it('pass schema/consistency validation with no errors', () => {
    const { errors, warnings } = validateData(SETS, PACKS_FILE, ODDS);
    if (warnings.length) console.warn('data warnings:\n' + warnings.join('\n'));
    expect(errors).toEqual([]);
  });

  it('every slot table sums to 100 ± 0.001', () => {
    for (const tables of [ODDS.slots, ODDS.godPackSlots]) {
      for (const table of tables) {
        const sum = RARITIES.reduce((acc, r) => acc + (table[r] ?? 0), 0);
        expect(Math.abs(sum - 100)).toBeLessThanOrEqual(0.001);
      }
    }
  });

  it('has both v0 sets with expected shape', () => {
    const ids = SETS.map((s) => s.setId).sort();
    expect(ids).toEqual(['A1', 'A1a']);
    const a1 = SETS.find((s) => s.setId === 'A1')!;
    const a1a = SETS.find((s) => s.setId === 'A1a')!;
    expect(a1.officialCount).toBe(226);
    expect(a1a.officialCount).toBe(68);
    expect(a1.cards.length).toBeGreaterThanOrEqual(280);
    expect(a1a.cards.length).toBeGreaterThanOrEqual(80);
  });

  it('every card id resolves to a legal art filename', () => {
    // Art files are saved as public/art/<cardId>.webp — ids must be safe as
    // filenames on every platform (no separators, reserved chars, or spaces).
    for (const set of SETS) {
      for (const card of set.cards) {
        expect(card.id, `card id "${card.id}"`).toMatch(/^[A-Za-z0-9][A-Za-z0-9-]*$/);
      }
    }
  });

  it('every pack has a non-empty pool for every regular-slot rarity', () => {
    for (const pack of PACKS_FILE.packs) {
      const pools = POOLS[pack.id];
      expect(pools, `pools for ${pack.id}`).toBeDefined();
      for (const r of RARITIES) {
        expect(
          pools[r].length,
          `${pack.id} has no ${r} cards`,
        ).toBeGreaterThan(0);
      }
    }
  });
});
