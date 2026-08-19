import { useCallback, useEffect, useRef, useState } from 'react';
import { ODDS, POOLS, getPack } from '../../engine/data';
import { openPack } from '../../engine/openPack';
import { randomSeed } from '../../engine/rng';
import { isHighTier, isStarOrAbove } from '../../engine/rarity';
import type { Card, PullResult, Rarity } from '../../engine/types';
import { useCollection } from '../../store/collection';
import { useSettings } from '../../store/settings';
import { useNav } from '../../store/nav';
import { CardFace } from '../components/CardFace';
import { PackArt } from '../components/PackArt';

type Phase = 'arrive' | 'ready' | 'torn' | 'summary';

interface Opened {
  result: PullResult;
  newIds: Set<string>; // cards not owned before this pull
}

function dotClass(rarity: Rarity): string {
  if (rarity === 'CROWN') return 'dot dot--crown';
  if (isStarOrAbove(rarity)) return 'dot dot--star';
  return 'dot dot--diamond';
}

export function OpenPack({ packId }: { packId: string }) {
  const go = useNav((s) => s.go);
  const forceGodPack = useSettings((s) => s.forceGodPack);
  const recordPull = useCollection((s) => s.recordPull);
  const pack = getPack(packId);

  const [opened, setOpened] = useState<Opened | null>(null);
  const [phase, setPhase] = useState<Phase>('arrive');
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [departing, setDeparting] = useState<{ card: Card; key: number } | null>(null);
  const [openCount, setOpenCount] = useState(0); // bumps to re-open another pack
  const tearing = useRef(false);
  const holdUntil = useRef(0); // ignore advance input until this timestamp
  const pointerDownY = useRef<number | null>(null);
  const preloaded = useRef<HTMLImageElement[]>([]);

  // Roll the pack once per opening and record it immediately.
  useEffect(() => {
    const owned = useCollection.getState().owned;
    const result = openPack(packId, POOLS, ODDS, randomSeed(), { forceGodPack });
    const newIds = new Set(result.cards.map((c) => c.id).filter((id) => !owned[id]));
    setOpened({ result, newIds });
    setPhase('arrive');
    setCurrent(0);
    setFlipped(false);
    setDeparting(null);
    recordPull(result);
    const t = setTimeout(() => setPhase('ready'), 500); // pack slide-in
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId, openCount]);

  // Preload all five card images during slide-in/tear so the first flip
  // never shows a blank frame.
  useEffect(() => {
    if (!opened) return;
    preloaded.current = opened.result.cards.map((c) => {
      const img = new Image();
      img.src = `${import.meta.env.BASE_URL}art/${c.id}.webp`;
      return img;
    });
  }, [opened]);

  const tear = useCallback(() => {
    setPhase((p) => (p === 'ready' ? 'torn' : p));
  }, []);

  const total = opened?.result.cards.length ?? 0;
  const currentCard = opened?.result.cards[current];
  const isLast = current === total - 1;

  /** One interaction does everything: reveal the current card, then advance. */
  const advance = useCallback(() => {
    if (!opened || !currentCard || phase !== 'torn') return;
    if (performance.now() < holdUntil.current) return;
    if (!flipped) {
      setFlipped(true);
      // Let the moment land before the next input is accepted — longer for
      // top-tier pulls, which also never auto-advance.
      holdUntil.current = performance.now() + (isHighTier(currentCard.rarity) ? 1500 : 350);
    } else if (isLast) {
      setPhase('summary');
    } else {
      setDeparting({ card: currentCard, key: current });
      setCurrent((i) => i + 1);
      setFlipped(false);
    }
  }, [opened, currentCard, phase, flipped, isLast, current]);

  // Clear the departing card once its exit animation is done.
  useEffect(() => {
    if (!departing) return;
    const t = setTimeout(() => setDeparting(null), 450);
    return () => clearTimeout(t);
  }, [departing]);

  // Auto-advance to summary after the last flip — except on top-tier pulls,
  // which wait for an explicit tap.
  useEffect(() => {
    if (phase === 'torn' && flipped && isLast && currentCard && !isHighTier(currentCard.rarity)) {
      const t = setTimeout(() => setPhase('summary'), 1200);
      return () => clearTimeout(t);
    }
  }, [phase, flipped, isLast, currentCard]);

  // Space advances: tear → reveal/advance.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (phase === 'ready') tear();
      else if (phase === 'torn') advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, tear, advance]);

  if (!pack || !opened) return null;
  const { result, newIds } = opened;
  const epic = flipped && currentCard != null && isHighTier(currentCard.rarity);

  return (
    <div className="open-pack" style={{ '--pack-color': pack.color } as React.CSSProperties}>
      {phase !== 'summary' && (
        <div className="open-stage">
          {(phase === 'arrive' || phase === 'ready') && (
            <div className={`pack-wrap pack-wrap--${phase}`}>
              <div
                onPointerDown={() => { tearing.current = true; }}
                onPointerUp={() => { if (tearing.current) tear(); tearing.current = false; }}
              >
                <PackArt pack={pack} big>
                  <div className="pack-art__tear-strip">✂ click or drag to tear</div>
                </PackArt>
              </div>
              {phase === 'ready' && <p className="hint">Tear the top open (or press space)</p>}
            </div>
          )}

          {phase === 'torn' && (
            <div
              className={`reveal-stage ${epic ? 'reveal-stage--epic' : ''}`}
              role="button"
              aria-label={flipped ? 'Next card' : `Reveal card ${current + 1} of ${total}`}
              onPointerDown={(e) => { pointerDownY.current = e.clientY; }}
              onPointerUp={(e) => {
                if (pointerDownY.current === null) return;
                const dy = pointerDownY.current - e.clientY;
                pointerDownY.current = null;
                // Tap anywhere or swipe up both reveal/advance.
                if (dy > 40 || Math.abs(dy) < 12) advance();
              }}
            >
              {result.isGodPack && <div className="god-banner">RARE PACK!</div>}

              <div className="reveal-progress">
                <span className="reveal-progress__count">{current + 1} / {total}</span>
                <div className="reveal-dots">
                  {result.cards.map((c, i) => {
                    const isRevealed = i < current || (i === current && flipped);
                    return (
                      <span
                        key={i}
                        className={
                          isRevealed
                            ? dotClass(c.rarity)
                            : `dot ${i === current ? 'dot--current' : ''}`
                        }
                      />
                    );
                  })}
                </div>
              </div>

              <div className="reveal-area">
                {epic && <div className="reveal-burst" />}
                {departing && (
                  <div className="reveal-card reveal-card--departing" key={`out-${departing.key}`}>
                    <CardFace card={departing.card} />
                  </div>
                )}
                <div className="reveal-card" key={current}>
                  <div
                    className={[
                      'flip-card',
                      flipped ? 'flip-card--flipped' : '',
                      flipped && currentCard && isHighTier(currentCard.rarity)
                        ? 'flip-card--epic'
                        : flipped && currentCard && isStarOrAbove(currentCard.rarity)
                          ? 'flip-card--glow'
                          : '',
                    ].join(' ')}
                  >
                    <div className="flip-card__inner">
                      <div className="flip-card__back">
                        <div className="card-back"><span>POCKET</span></div>
                      </div>
                      <div className="flip-card__front">
                        {currentCard && <CardFace card={currentCard} />}
                        {currentCard && newIds.has(currentCard.id) && (
                          <span className="new-badge">NEW</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="hint">
                {flipped ? 'Tap, swipe up, or press space for the next card' : 'Tap to reveal'}
              </p>
              <button
                className="btn btn--ghost"
                onPointerUp={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setPhase('summary')}
              >
                Reveal all ≫
              </button>
            </div>
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
            <button className="btn btn--primary" onClick={() => setOpenCount((n) => n + 1)}>
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
