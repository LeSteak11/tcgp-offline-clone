import { create } from 'zustand';
import type { PullResult } from '../engine/types';
import { CARDS_BY_ID } from '../engine/data';
import { kvGet, kvSet, kvClear } from './db';

/** Compact pull record kept in history (cards stored by id). */
export interface PullRecord {
  packId: string;
  cardIds: string[];
  isGodPack: boolean;
  timestamp: number;
  seed: number;
}

export interface CollectionExport {
  version: 1;
  owned: Record<string, number>;
  history: PullRecord[];
}

interface CollectionState {
  loaded: boolean;
  owned: Record<string, number>; // cardId -> copies owned
  history: PullRecord[];
  load: () => Promise<void>;
  recordPull: (result: PullResult) => void;
  giveCard: (cardId: string, count?: number) => boolean;
  resetAll: () => Promise<void>;
  exportJson: () => string;
  importJson: (json: string) => { ok: boolean; error?: string };
}

const HISTORY_LIMIT = 2000;

function persist(state: Pick<CollectionState, 'owned' | 'history'>) {
  void kvSet('collection', {
    version: 1,
    owned: state.owned,
    history: state.history,
  } satisfies CollectionExport);
}

export const useCollection = create<CollectionState>((set, get) => ({
  loaded: false,
  owned: {},
  history: [],

  load: async () => {
    const saved = await kvGet<CollectionExport>('collection');
    set({
      loaded: true,
      owned: saved?.owned ?? {},
      history: saved?.history ?? [],
    });
  },

  recordPull: (result) => {
    const owned = { ...get().owned };
    for (const card of result.cards) {
      owned[card.id] = (owned[card.id] ?? 0) + 1;
    }
    const record: PullRecord = {
      packId: result.packId,
      cardIds: result.cards.map((c) => c.id),
      isGodPack: result.isGodPack,
      timestamp: result.timestamp,
      seed: result.seed,
    };
    const history = [...get().history, record].slice(-HISTORY_LIMIT);
    set({ owned, history });
    persist({ owned, history });
  },

  giveCard: (cardId, count = 1) => {
    if (!CARDS_BY_ID.has(cardId)) return false;
    const owned = { ...get().owned };
    owned[cardId] = (owned[cardId] ?? 0) + count;
    set({ owned });
    persist({ owned, history: get().history });
    return true;
  },

  resetAll: async () => {
    await kvClear();
    set({ owned: {}, history: [] });
  },

  exportJson: () => {
    const { owned, history } = get();
    return JSON.stringify(
      { version: 1, owned, history } satisfies CollectionExport,
      null,
      2,
    );
  },

  importJson: (json) => {
    try {
      const data = JSON.parse(json) as CollectionExport;
      if (data.version !== 1 || typeof data.owned !== 'object' || data.owned === null) {
        return { ok: false, error: 'Unrecognized format (expected version 1 export)' };
      }
      const owned: Record<string, number> = {};
      for (const [id, n] of Object.entries(data.owned)) {
        if (CARDS_BY_ID.has(id) && Number.isInteger(n) && n > 0) owned[id] = n;
      }
      const history = Array.isArray(data.history) ? data.history.slice(-HISTORY_LIMIT) : [];
      set({ owned, history });
      persist({ owned, history });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
}));

/** Distinct cards owned in a set / total cards in the set. */
export function setCompletion(
  owned: Record<string, number>,
  setCards: { id: string }[],
): { owned: number; total: number; pct: number } {
  let count = 0;
  for (const c of setCards) if (owned[c.id]) count++;
  return {
    owned: count,
    total: setCards.length,
    pct: setCards.length ? Math.round((count / setCards.length) * 100) : 0,
  };
}
