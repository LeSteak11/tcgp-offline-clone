import type { Rarity } from '../../engine/types';
import { rarityGlyphs } from '../../engine/rarity';

const CLASS: Record<Rarity, string> = {
  D1: 'glyph-diamond', D2: 'glyph-diamond', D3: 'glyph-diamond', D4: 'glyph-diamond',
  S1: 'glyph-star', S2: 'glyph-star', S3: 'glyph-star',
  CROWN: 'glyph-crown',
};

export function RarityGlyphs({ rarity }: { rarity: Rarity }) {
  return (
    <span className={`rarity-glyphs ${CLASS[rarity]}`} title={rarity}>
      {rarityGlyphs(rarity)}
    </span>
  );
}
