import type { Card, Rarity } from './types';
import { RARITIES } from './rarity';

/** pool[packId][rarity] = cards of that rarity that can drop in that pack. */
export type PackPools = Record<string, Record<Rarity, Card[]>>;

export function buildPools(cards: Card[]): PackPools {
  const pools: PackPools = {};
  for (const card of cards) {
    for (const packId of card.packs) {
      if (!pools[packId]) {
        pools[packId] = Object.fromEntries(
          RARITIES.map((r) => [r, []]),
        ) as unknown as Record<Rarity, Card[]>;
      }
      pools[packId][card.rarity].push(card);
    }
  }
  return pools;
}
