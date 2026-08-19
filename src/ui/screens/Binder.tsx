import { useMemo, useState } from 'react';
import { PACKS_FILE, getSet } from '../../engine/data';
import { RARITIES } from '../../engine/rarity';
import type { CardType, Rarity } from '../../engine/types';
import { setCompletion, useCollection } from '../../store/collection';
import { useNav } from '../../store/nav';
import { CardFace } from '../components/CardFace';
import { RarityGlyphs } from '../components/RarityGlyphs';

const TYPES: CardType[] = [
  'Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting',
  'Darkness', 'Metal', 'Dragon', 'Colorless', 'Trainer',
];

export function Binder({ setId }: { setId: string }) {
  const owned = useCollection((s) => s.owned);
  const go = useNav((s) => s.go);
  const [packFilter, setPackFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState<Rarity | ''>('');
  const [typeFilter, setTypeFilter] = useState<CardType | ''>('');
  const [ownedFilter, setOwnedFilter] = useState<'' | 'owned' | 'missing'>('');

  const set = getSet(setId);
  const setPacks = PACKS_FILE.packs.filter((p) => p.setId === setId);

  const cards = useMemo(() => {
    if (!set) return [];
    return set.cards.filter((c) => {
      if (packFilter && !c.packs.includes(packFilter)) return false;
      if (rarityFilter && c.rarity !== rarityFilter) return false;
      if (typeFilter && c.type !== typeFilter) return false;
      if (ownedFilter === 'owned' && !owned[c.id]) return false;
      if (ownedFilter === 'missing' && owned[c.id]) return false;
      return true;
    });
  }, [set, packFilter, rarityFilter, typeFilter, ownedFilter, owned]);

  if (!set) return null;
  const comp = setCompletion(owned, set.cards);

  return (
    <div className="binder">
      <div className="binder__header">
        <div className="set-tabs">
          {PACKS_FILE.sets.map((s) => (
            <button
              key={s.id}
              className={`set-tab ${s.id === setId ? 'set-tab--active' : ''}`}
              onClick={() => go({ name: 'binder', setId: s.id })}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="binder__completion">
          {comp.owned}/{comp.total} · {comp.pct}%
        </div>
      </div>

      <div className="binder__filters">
        <select value={packFilter} onChange={(e) => setPackFilter(e.target.value)}>
          <option value="">All packs</option>
          {setPacks.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value as Rarity | '')}
        >
          <option value="">All rarities</option>
          {RARITIES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as CardType | '')}
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={ownedFilter}
          onChange={(e) => setOwnedFilter(e.target.value as '' | 'owned' | 'missing')}
        >
          <option value="">Owned + missing</option>
          <option value="owned">Owned</option>
          <option value="missing">Missing</option>
        </select>
      </div>

      <div className="binder__grid">
        {cards.map((card) => {
          const count = owned[card.id] ?? 0;
          return (
            <button
              key={card.id}
              className="binder-slot"
              onClick={() =>
                go({ name: 'card', cardId: card.id, from: { name: 'binder', setId } })
              }
            >
              {count > 0 ? (
                <>
                  <CardFace card={card} small />
                  {count > 1 && <span className="count-badge">×{count}</span>}
                </>
              ) : (
                <div className="binder-slot__unowned">
                  <span className="binder-slot__silhouette">?</span>
                  <span className="binder-slot__number">#{card.number}</span>
                  <RarityGlyphs rarity={card.rarity} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
