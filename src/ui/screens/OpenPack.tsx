import { useCallback, useEffect, useRef, useState } from 'react';
import { ODDS, POOLS, getPack } from '../../engine/data';
import { openPack } from '../../engine/openPack';
import { randomSeed } from '../../engine/rng';
import { isStarOrAbove } from '../../engine/rarity';
import type { PullResult } from '../../engine/types';
import { useCollection } from '../../store/collection';
import { useSettings } from '../../store/settings';
import { useNav } from '../../store/nav';
import { CardFace } from '../components/CardFace';

type Phase = 'arrive' | 'ready' | 'torn' | 'summary';

interface Opened {
  result: PullResult;
  newIds: Set<string>; // cards not owned before this pull
}

export function OpenPack({ packId }: { packId: string }) {
  const go = useNav((s) => s.go);
  const forceGodPack = useSettings((s) => s.forceGodPack);
  const recordPull = useCollection((s) => s.recordPull);
  const pack = getPack(packId);

  const [opened, setOpened] = useState<Opened | null>(null);
  const [phase, setPhase] = useState<Phase>('arrive');
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [openCount, setOpenCount] = useState(0); // bumps to re-open another pack
  const tearing = useRef(false);

  // Roll the pack once per opening and record it immediately.
  useEffect(() => {
    const owned = useCollection.getState().owned;
    const result = openPack(packId, POOLS, ODDS, randomSeed(), { forceGodPack });
    const newIds = new Set(result.cards.map((c) => c.id).filter((id) => !owned[id]));
    setOpened({ result, newIds });
    setPhase('arrive');
    setFlipped(new Set());
    recordPull(result);
    const t = setTimeout(() => setPhase('ready'), 500); // pack slide-in
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId, openCount]);

  const tear = useCallback(() => {
    setPhase((p) => (p === 'ready' ? 'torn' : p));
  }, []);

  const flip = useCallback((i: number) => {
    setFlipped((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  }, []);

  // Space advances: tear → flip next → summary.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (phase === 'ready') tear();
      else if (phase === 'torn') {
        const next = [0, 1, 2, 3, 4].find((i) => !flipped.has(i));
        if (next !== undefined) flip(next);
        else setPhase('summary');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, flipped, tear, flip]);

  // Auto-advance to summary shortly after the last flip.
  useEffect(() => {
    if (phase === 'torn' && flipped.size === 5) {
      const t = setTimeout(() => setPhase('summary'), 900);
      return () => clearTimeout(t);
    }
  }, [phase, flipped]);

  if (!pack || !opened) return null;
  const { result, newIds } = opened;

  return (
    <div className="open-pack" style={{ '--pack-color': pack.color } as React.CSSProperties}>
      {phase !== 'summary' && (
        <div className="open-stage">
          {(phase === 'arrive' || phase === 'ready') && (
            <div className={`pack-wrap pack-wrap--${phase}`}>
              <div
                className="pack-art pack-art--big"
                onPointerDown={() => { tearing.current = true; }}
                onPointerUp={() => { if (tearing.current) tear(); tearing.current = false; }}
              >
                <div className="pack-art__tear-strip">✂ click or drag to tear</div>
                <div className="pack-art__foil" />
                <span className="pack-art__label">{pack.name}</span>
                <span className="pack-art__set">{result.isGodPack ? '…' : ''}</span>
              </div>
              {phase === 'ready' && <p className="hint">Tear the top open (or press space)</p>}
            </div>
          )}

          {phase === 'torn' && (
            <>
              {result.isGodPack && <div className="god-banner">RARE PACK!</div>}
              <div className="card-fan">
                {result.cards.map((card, i) => {
                  const isFlipped = flipped.has(i);
                  const glow = isFlipped && isStarOrAbove(card.rarity);
                  return (
                    <button
                      key={i}
                      className={[
                        'flip-card',
                        isFlipped ? 'flip-card--flipped' : '',
                        glow ? 'flip-card--glow' : '',
                      ].join(' ')}
                      style={{ '--i': i } as React.CSSProperties}
                      onClick={() => flip(i)}
                      aria-label={isFlipped ? card.name : `Reveal card ${i + 1}`}
                    >
                      <div className="flip-card__inner">
                        <div className="flip-card__back">
                          <div className="card-back">
                            <span>POCKET</span>
                          </div>
                        </div>
                        <div className="flip-card__front">
                          <CardFace card={card} />
                          {newIds.has(card.id) && <span className="new-badge">NEW</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="hint">Click each card to reveal (space flips the next one)</p>
            </>
          )}
        </div>
      )}

      {phase === 'summary' && (
        <div className="open-summary">
          <h2>
            {pack.name} pack{result.isGodPack && <span className="god-tag"> · RARE PACK</span>}
          </h2>
          <div className="summary-cards">
            {result.cards.map((card, i) => (
              <div key={i} className="summary-card">
                <CardFace card={card} small />
                {newIds.has(card.id) && <span className="new-badge">NEW</span>}
              </div>
            ))}
          </div>
          <div className="summary-actions">
            <button
              className="btn btn--primary"
              onClick={() => setOpenCount((n) => n + 1)}
            >
              Open another
            </button>
            <button className="btn" onClick={() => go({ name: 'binder', setId: pack.setId })}>
              Binder
            </button>
            <button className="btn" onClick={() => go({ name: 'home' })}>
              Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
