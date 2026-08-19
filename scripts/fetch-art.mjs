// One-time dev-side art fetch from TCGdex assets (https://tcgdex.dev).
// Reads the image URLs already stored in scripts/.cache/card-*.json (written by
// fetch-data.mjs) and downloads each card's high.webp into public/art/.
// The app itself never touches the network — this script is dev-only.
//
// Usage: npm run fetch-art
// Idempotent: files already in public/art/ are skipped, so re-runs resume cheaply.

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'scripts', '.cache');
const OUT = path.join(ROOT, 'public', 'art');
const CONCURRENCY = 8;
const RETRIES = 2;
const USER_AGENT = 'tcgp-offline-clone/0.1 (personal offline project; one-time art fetch)';

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function downloadOne({ cardId, imageBase }) {
  const dest = path.join(OUT, `${cardId}.webp`);
  if (existsSync(dest)) return { status: 'skipped', bytes: 0 };

  const url = `${imageBase}/high.webp`;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(dest, buf);
      return { status: 'downloaded', bytes: buf.length };
    } catch (e) {
      if (attempt === RETRIES) {
        console.warn(`  ! ${cardId}: ${e.message} (${url})`);
        return { status: 'failed', bytes: 0 };
      }
      await sleep(500 * (attempt + 1));
    }
  }
}

// Set logos (used as pack-wrapper branding) live at a fixed assets URL.
async function fetchSetLogos() {
  const packsFile = JSON.parse(
    await readFile(path.join(ROOT, 'data', 'packs.json'), 'utf8'),
  );
  const dir = path.join(OUT, 'sets');
  await mkdir(dir, { recursive: true });
  for (const set of packsFile.sets) {
    const dest = path.join(dir, `${set.id}.png`);
    if (existsSync(dest)) continue;
    const url = `https://assets.tcgdex.net/en/tcgp/${set.id}/logo.png`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      console.log(`  set logo ${set.id}.png`);
    } catch (e) {
      console.warn(`  ! set logo ${set.id}: ${e.message} (${url})`);
    }
  }
}

const cacheFiles = (await readdir(CACHE)).filter((f) => f.startsWith('card-'));
const jobs = [];
for (const file of cacheFiles) {
  const raw = JSON.parse(await readFile(path.join(CACHE, file), 'utf8'));
  if (!raw.image) {
    console.warn(`  ! ${raw.id ?? file}: no image field, skipping`);
    continue;
  }
  jobs.push({ cardId: raw.id, imageBase: raw.image });
}

await mkdir(OUT, { recursive: true });
await fetchSetLogos();
console.log(`Fetching art for ${jobs.length} cards (high.webp, concurrency ${CONCURRENCY})...`);

let done = 0;
const results = await mapLimit(jobs, CONCURRENCY, async (job) => {
  const r = await downloadOne(job);
  if (++done % 50 === 0) console.log(`  ${done}/${jobs.length}`);
  return r;
});

const tally = { downloaded: 0, skipped: 0, failed: 0, bytes: 0 };
for (const r of results) {
  tally[r.status]++;
  tally.bytes += r.bytes;
}
console.log(
  `Done. downloaded: ${tally.downloaded}, skipped: ${tally.skipped}, ` +
    `failed: ${tally.failed}, total: ${(tally.bytes / 1024 / 1024).toFixed(1)} MB`,
);
