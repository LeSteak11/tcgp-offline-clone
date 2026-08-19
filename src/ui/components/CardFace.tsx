import { useState } from 'react';
import type { Card, CardType } from '../../engine/types';
import { RarityGlyphs } from './RarityGlyphs';

export const TYPE_COLORS: Record<CardType, string> = {
  Grass: '#4caf50',
  Fire: '#e8542e',
  Water: '#2196f3',
  Lightning: '#f2c31b',
  Psychic: '#8e5bd8',
  Fighting: '#b3562e',
  Darkness: '#37474f',
  Metal: '#90a4ae',
  Dragon: '#c8a24b',
  Colorless: '#bdbdbd',
  Trainer: '#607d8b',
};

/**
 * Placeholder card renderer. No copyrighted art — a type-colored frame with
 * name/HP/stage/rarity/id. If public/art/<cardId>.png exists it is shown in
 * the artwork panel instead of the generated monogram.
 */
export function CardFace({ card, small }: { card: Card; small?: boolean }) {
  const [hasArt, setHasArt] = useState(true);
  const color = TYPE_COLORS[card.type];
  const crown = card.rarity === 'CROWN';
  const starPlus = card.rarity.startsWith('S') || crown;

  return (
    <div
      className={[
        'card-face',
        small ? 'card-face--small' : '',
        starPlus ? 'card-face--shiny' : '',
        crown ? 'card-face--crown' : '',
      ].join(' ')}
      style={{ '--type-color': color } as React.CSSProperties}
    >
      <div className="card-face__header">
        <span className="card-face__name">{card.name}</span>
        {card.hp != null && <span className="card-face__hp">{card.hp} HP</span>}
      </div>
      <div className="card-face__art">
        {hasArt ? (
          <img
            src={`${import.meta.env.BASE_URL}art/${card.id}.png`}
            alt=""
            onError={() => setHasArt(false)}
            draggable={false}
          />
        ) : (
          <span className="card-face__monogram">{card.name.charAt(0)}</span>
        )}
      </div>
      <div className="card-face__meta">
        {card.stage && <span className="card-face__stage">{card.stage}</span>}
        {card.isEx && <span className="card-face__ex">ex</span>}
      </div>
      <div className="card-face__footer">
        <RarityGlyphs rarity={card.rarity} />
        <span className="card-face__id">{card.id}</span>
      </div>
    </div>
  );
}
