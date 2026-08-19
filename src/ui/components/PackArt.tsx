import { useState, type ReactNode } from 'react';
import type { Pack } from '../../engine/types';
import { PACKS_FILE } from '../../engine/data';

/**
 * Pack wrapper art composed from assets we already have: the namesake card's
 * full art as the hero, the pack color as the wrapper gradient, the set logo
 * across the top, and a foil sweep. Each layer degrades independently — with
 * no hero/logo image this is exactly the old flat colored wrapper.
 */
export function PackArt({
  pack,
  big,
  children,
}: {
  pack: Pack;
  big?: boolean;
  children?: ReactNode;
}) {
  const [heroOk, setHeroOk] = useState(true);
  const [logoOk, setLogoOk] = useState(true);
  const set = PACKS_FILE.sets.find((s) => s.id === pack.setId);

  return (
    <div
      className={`pack-art ${big ? 'pack-art--big' : ''}`}
      style={{ '--pack-color': pack.color } as React.CSSProperties}
    >
      {heroOk && pack.heroCardId && (
        <img
          className="pack-art__hero"
          src={`${import.meta.env.BASE_URL}art/${pack.heroCardId}.webp`}
          alt=""
          draggable={false}
          onError={() => setHeroOk(false)}
        />
      )}
      <div className="pack-art__foil" />
      {logoOk && set?.logo ? (
        <img
          className="pack-art__logo"
          src={`${import.meta.env.BASE_URL}${set.logo}`}
          alt={set.name}
          draggable={false}
          onError={() => setLogoOk(false)}
        />
      ) : (
        <span className="pack-art__set">{set?.name}</span>
      )}
      <span className="pack-art__label">{pack.name}</span>
      {children}
    </div>
  );
}
