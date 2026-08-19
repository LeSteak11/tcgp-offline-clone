import type { Card, OddsTable, PullResult, Rarity, SlotTable } from './types';
import type { PackPools } from './pool';
import { RARITIES, rarityRank } from './rarity';
import { mulberry32, weightedIndex, pickUniform, type Rng } from './rng';

function rollRarity(table: SlotTable, rng: Rng): Rarity {
  const weights = RARITIES.map((r) => table[r] ?? 0);
  return RARITIES[weightedIndex(weights, rng)];
}

/**
 * If the rolled rarity has no cards in this pack, fall back to the next lower
 * rarity with a non-empty pool (then upward as a last resort). Never crashes.
 */
function resolvePool(
  pools: Record<Rarity, Card[]>,
  rarity: Rarity,
  packId: string,
): Card[] {
  if (pools[rarity]?.length) return pools[rarity];
  for (let i = rarityRank(rarity) - 1; i >= 0; i--) {
    if (pools[RARITIES[i]]?.length) {
      console.warn(
        `openPack: empty pool for ${packId}/${rarity}, falling back to ${RARITIES[i]}`,
      );
      return pools[RARITIES[i]];
    }
  }
  for (let i = rarityRank(rarity) + 1; i < RARITIES.length; i++) {
    if (pools[RARITIES[i]]?.length) {
      console.warn(
        `openPack: empty pool for ${packId}/${rarity}, falling back UP to ${RARITIES[i]}`,
      );
      return pools[RARITIES[i]];
    }
  }
  throw new Error(`openPack: pack ${packId} has no cards at all`);
}

export interface OpenPackOptions {
  forceGodPack?: boolean; // debug only
}

export function openPack(
  packId: string,
  pools: PackPools,
  odds: OddsTable,
  seed: number,
  options: OpenPackOptions = {},
): PullResult {
  const rng = mulberry32(seed);
  const packPools = pools[packId];
  if (!packPools) throw new Error(`openPack: unknown pack "${packId}"`);

  const isGodPack = options.forceGodPack || rng() < odds.godPackChance;
  const slotTables = isGodPack ? odds.godPackSlots : odds.slots;

  const cards: Card[] = slotTables.map((table) => {
    const rarity = rollRarity(table, rng);
    return pickUniform(resolvePool(packPools, rarity, packId), rng);
  });

  return { packId, cards, isGodPack, timestamp: Date.now(), seed };
}
