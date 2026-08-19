import type { Rarity } from './types';

export const RARITIES: Rarity[] = ['D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3', 'CROWN'];

/** Ordering index: higher = rarer. */
export function rarityRank(r: Rarity): number {
  return RARITIES.indexOf(r);
}

/** Glyph string, e.g. D3 -> "◇◇◇", S2 -> "★★", CROWN -> "♛". */
export function rarityGlyphs(r: Rarity): string {
  switch (r) {
    case 'D1': return '◇';
    case 'D2': return '◇◇';
    case 'D3': return '◇◇◇';
    case 'D4': return '◇◇◇◇';
    case 'S1': return '★';
    case 'S2': return '★★';
    case 'S3': return '★★★';
    case 'CROWN': return '♛';
  }
}

export function isStarOrAbove(r: Rarity): boolean {
  return rarityRank(r) >= rarityRank('S1');
}

/** Top-tier pulls (★★★ / ♛) that get the full-stage reveal treatment. */
export function isHighTier(r: Rarity): boolean {
  return r === 'S3' || r === 'CROWN';
}
