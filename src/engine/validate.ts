import type { OddsTable, PacksFile, SetFile } from './types';
import { RARITIES } from './rarity';

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

const VALID_TYPES = new Set([
  'Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting',
  'Darkness', 'Metal', 'Dragon', 'Colorless', 'Trainer',
]);

export function validateData(
  sets: SetFile[],
  packsFile: PacksFile,
  odds: OddsTable,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const packIds = new Set(packsFile.packs.map((p) => p.id));
  const setIds = new Set(packsFile.sets.map((s) => s.id));
  const rarities = new Set(RARITIES);

  for (const pack of packsFile.packs) {
    if (!setIds.has(pack.setId)) {
      errors.push(`pack ${pack.id} references unknown set ${pack.setId}`);
    }
  }

  const seenCardIds = new Set<string>();
  for (const set of sets) {
    if (!setIds.has(set.setId)) {
      errors.push(`set file ${set.setId} not declared in packs.json`);
    }
    for (const card of set.cards) {
      const ctx = `card ${card.id}`;
      if (seenCardIds.has(card.id)) errors.push(`${ctx}: duplicate id`);
      seenCardIds.add(card.id);
      if (card.setId !== set.setId) errors.push(`${ctx}: setId mismatch`);
      if (!rarities.has(card.rarity)) errors.push(`${ctx}: bad rarity ${card.rarity}`);
      if (!VALID_TYPES.has(card.type)) errors.push(`${ctx}: bad type ${card.type}`);
      if (!Number.isInteger(card.number) || card.number < 1) {
        errors.push(`${ctx}: bad number ${card.number}`);
      }
      if (card.packs.length === 0) {
        // Secret-rarity cards without pack data would be unobtainable.
        const isSecret = card.number > set.officialCount;
        (isSecret ? warnings : errors).push(`${ctx}: no packs assigned`);
      }
      for (const p of card.packs) {
        if (!packIds.has(p)) errors.push(`${ctx}: unknown pack ${p}`);
      }
    }
  }

  for (const pack of packsFile.packs) {
    if (pack.heroCardId && !seenCardIds.has(pack.heroCardId)) {
      errors.push(`pack ${pack.id}: heroCardId ${pack.heroCardId} not in any set`);
    }
  }

  validateOdds(odds, errors);
  return { errors, warnings };
}

export function validateOdds(odds: OddsTable, errors: string[]): void {
  if (odds.godPackChance < 0 || odds.godPackChance > 1) {
    errors.push(`godPackChance out of range: ${odds.godPackChance}`);
  }
  for (const [name, tables] of [
    ['slots', odds.slots],
    ['godPackSlots', odds.godPackSlots],
  ] as const) {
    if (tables.length !== 5) {
      errors.push(`${name} must have 5 entries, has ${tables.length}`);
      continue;
    }
    tables.forEach((table, i) => {
      const sum = RARITIES.reduce((acc, r) => acc + (table[r] ?? 0), 0);
      if (Math.abs(sum - 100) > 0.001) {
        errors.push(`${name}[${i}] sums to ${sum}, expected 100`);
      }
    });
  }
}
