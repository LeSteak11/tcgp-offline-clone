import { useState } from 'react';
import { PACKS_FILE, getSet } from '../../engine/data';
import { setCompletion, useCollection } from '../../store/collection';
import { useNav } from '../../store/nav';
import { PackArt } from '../components/PackArt';

export function Home() {
  const [setId, setSetId] = useState('A1');
  const owned = useCollection((s) => s.owned);
  const go = useNav((s) => s.go);

  const packs = PACKS_FILE.packs.filter((p) => p.setId === setId);

  return (
    <div className="home">
      <div className="set-tabs">
        {PACKS_FILE.sets.map((set) => {
          const cards = getSet(set.id)?.cards ?? [];
          const comp = setCompletion(owned, cards);
          return (
            <button
              key={set.id}
              className={`set-tab ${set.id === setId ? 'set-tab--active' : ''}`}
              onClick={() => setSetId(set.id)}
            >
              <span className="set-tab__name">{set.name}</span>
              <span className="set-tab__completion">{comp.pct}% complete</span>
            </button>
          );
        })}
      </div>

      <div className="pack-grid">
        {packs.map((pack) => (
          <div key={pack.id} className="pack-tile">
            <PackArt pack={pack} />
            <button
              className="btn btn--primary"
              onClick={() => go({ name: 'open', packId: pack.id })}
            >
              Open pack
            </button>
          </div>
        ))}
      </div>

      <button className="btn" onClick={() => go({ name: 'binder', setId })}>
        View binder
      </button>
    </div>
  );
}
