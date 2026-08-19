// Single import point for all bundled game data. JSON is bundled by Vite;
// editing data/*.json during `npm run dev` hot-reloads the app.
import a1Json from '../../data/sets/A1.json';
import a1aJson from '../../data/sets/A1a.json';
import packsJson from '../../data/packs.json';
import oddsJson from '../../data/odds.json';
import type { Card, OddsTable, PacksFile, SetFile } from './types';
import { buildPools, type PackPools } from './pool';

export const SETS: SetFile[] = [a1Json, a1aJson] as unknown as SetFile[];
export const PACKS_FILE: PacksFile = packsJson as PacksFile;
export const ODDS: OddsTable = oddsJson as unknown as OddsTable;

export const ALL_CARDS: Card[] = SETS.flatMap((s) => s.cards);

export const CARDS_BY_ID: Map<string, Card> = new Map(
  ALL_CARDS.map((c) => [c.id, c]),
);

export const POOLS: PackPools = buildPools(ALL_CARDS);

export function getSet(setId: string): SetFile | undefined {
  return SETS.find((s) => s.setId === setId);
}

export function getPack(packId: string) {
  return PACKS_FILE.packs.find((p) => p.id === packId);
}
