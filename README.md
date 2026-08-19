# tcgp-offline-clone

A personal, fully offline clone of Pokémon TCG Pocket's **collection and pack-opening**
loop. Two sets (Genetic Apex, Mythical Island), correct published pull rates, a binder,
and nothing else — no battling, currency, timers, or accounts. Not for distribution.

## Run

```bash
npm install
npm run fetch-art   # one-time: downloads card art (network needed only here)
npm run dev         # dev server at http://localhost:5173
```

Production build (works with networking disabled — everything is bundled or local):

```bash
npm run build
npm run preview     # serves dist/ at http://localhost:4173
```

Note: your collection is saved in IndexedDB **per origin**, so the dev server (5173)
and preview server (4173) each have their own save. Use Debug → Export/Import JSON to
move a collection between them.

## Card art

Art is not committed to the repo. `npm run fetch-art` downloads every card's full-card
image (~22 MB of webp) from TCGdex into `public/art/`, plus set logos into
`public/art/sets/`. The script is idempotent — re-running skips existing files, so an
interrupted fetch resumes. Without art the app still works: cards render as generated
type-colored placeholder frames, and pack wrappers fall back to flat colors.

## Editing odds and cards

All game data is JSON in `data/` — code never hardcodes cards or rates:

- `data/odds.json` — per-slot rarity percentages (each slot must sum to 100) and the
  god-pack chance. Edit freely; `npm test` validates the tables.
- `data/sets/A1.json`, `data/sets/A1a.json` — card lists. Regenerate from TCGdex with
  `npm run fetch-data`, or hand-edit.
- `data/packs.json` — pack definitions: which set, theme color, namesake hero card,
  set logos.

The odds engine (`src/engine/`) is pure TypeScript with a seeded RNG. `npm test` runs
a 200k-pack simulation asserting the distribution matches the tables, plus data
consistency checks.

## Debug tools

The Debug tab has: force god pack, roll N packs with a rarity histogram, give any card
by ID, export/import collection JSON, and full reset.

## Known gaps

- `A1-265` and `A1-279` are skipped: TCGdex reports their rarity as `"None"`, so they
  can't be placed in a rarity pool. The binder therefore shows 284 A1 cards, not 286.
- v0 covers A1 and A1a only; no shiny rarities (they start with Shining Revelry).
- Card data accuracy is "internally consistent", not audited per card — rarities and
  pack assignments come straight from TCGdex.
