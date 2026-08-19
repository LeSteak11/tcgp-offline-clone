// One-time dev-side data fetch from TCGdex (https://tcgdex.dev).
// Generates data/sets/A1.json and data/sets/A1a.json in our Card schema.
// The app itself never touches the network — this script is dev-only.
//
// Usage: npm run fetch-data
// Raw responses are cached in scripts/.cache/ so re-runs are offline-friendly.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'scripts', '.cache');
const OUT = path.join(ROOT, 'data', 'sets');
const API = 'https://api.tcgdex.net/v2/en';
const CONCURRENCY = 8;

const RARITY_MAP = {
  'One Diamond': 'D1',
  'Two Diamond': 'D2',
  'Three Diamond': 'D3',
  'Four Diamond': 'D4',
  'One Star': 'S1',
  'Two Star': 'S2',
  'Three Star': 'S3',
  'One Shiny': null, // out of scope for v0 (starts with Shining Revelry anyway)
  'Two Shiny': null,
  Crown: 'CROWN',
};

const STAGE_MAP = {
  Basic: 'Basic',
  Stage1: 'Stage 1',
  Stage2: 'Stage 2',
};

// TCGdex booster ids -> our pack ids
const BOOSTER_MAP = {
  'boo_A1-charizard': 'A1-charizard',
  'boo_A1-mewtwo': 'A1-mewtwo',
  'boo_A1-pikachu': 'A1-pikachu',
  'boo_A1a-mew': 'A1a-mew',
};

const ALL_PACKS = {
  A1: ['A1-charizard', 'A1-mewtwo', 'A1-pikachu'],
  A1a: ['A1a-mew'],
};

async function fetchJsonCached(url, cacheKey) {
  const cacheFile = path.join(CACHE, cacheKey + '.json');
  if (existsSync(cacheFile)) {
    return JSON.parse(await readFile(cacheFile, 'utf8'));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const json = await res.json();
  await writeFile(cacheFile, JSON.stringify(json));
  return json;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function toCard(raw, setId) {
  const rarity = RARITY_MAP[raw.rarity];
  if (rarity === undefined) {
    console.warn(`  ! unknown rarity "${raw.rarity}" on ${raw.id}, skipping`);
    return null;
  }
  if (rarity === null) return null; // shiny etc., out of scope

  const number = parseInt(raw.localId, 10);
  const isTrainer = raw.category === 'Trainer';

  let packs = (raw.boosters ?? [])
    .map((b) => BOOSTER_MAP[b.id])
    .filter(Boolean);
  if (packs.length === 0) {
    // Data gap or "appears in every booster of the set" — assign all set packs.
    packs = ALL_PACKS[setId];
  }

  const card = {
    id: raw.id,
    setId,
    number,
    name: raw.name,
    type: isTrainer ? 'Trainer' : (raw.types?.[0] ?? 'Colorless'),
    rarity,
    packs,
  };
  if (!isTrainer && raw.hp) card.hp = raw.hp;
  const stage = isTrainer ? raw.trainerType : STAGE_MAP[raw.stage];
  if (stage === 'Supporter' || stage === 'Item' || STAGE_MAP[raw.stage]) {
    card.stage = stage;
  }
  if (raw.suffix === 'EX') card.isEx = true;
  // Full-art heuristic: any ★/♛ card past the official set count is an alt/full art.
  if (['S1', 'S2', 'S3', 'CROWN'].includes(rarity)) card.isFullArt = true;
  return card;
}

async function buildSet(setId) {
  console.log(`Fetching set ${setId}...`);
  const set = await fetchJsonCached(`${API}/sets/${setId}`, `set-${setId}`);
  console.log(`  ${set.cards.length} cards listed, fetching details...`);
  let done = 0;
  const raws = await mapLimit(set.cards, CONCURRENCY, async (c) => {
    const raw = await fetchJsonCached(`${API}/cards/${c.id}`, `card-${c.id}`);
    if (++done % 50 === 0) console.log(`  ${done}/${set.cards.length}`);
    return raw;
  });
  const cards = raws
    .map((r) => toCard(r, setId))
    .filter(Boolean)
    .sort((a, b) => a.number - b.number);
  const out = {
    _source: 'tcgdex',
    _fetched: new Date().toISOString(),
    setId,
    name: set.name,
    officialCount: set.cardCount.official,
    cards,
  };
  await writeFile(path.join(OUT, `${setId}.json`), JSON.stringify(out, null, 2));
  console.log(`  wrote data/sets/${setId}.json (${cards.length} cards)`);
}

await mkdir(CACHE, { recursive: true });
await mkdir(OUT, { recursive: true });
await buildSet('A1');
await buildSet('A1a');
console.log('Done.');
