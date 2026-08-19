# tcgp-offline-clone

Personal, offline clone of Pokémon TCG Pocket's **collection + pack-opening** loop only.
Not for distribution. Card art is fetched locally for personal offline use via
`npm run fetch-art` into `public/art/` and is **never committed** (gitignored).
When an art file is absent, `src/ui/components/CardFace.tsx` falls back to a
generated placeholder frame, so the repo is fully functional without art.

## Rules

- `src/engine/` has **zero React imports**. Pure TypeScript, testable in isolation.
- UI never rolls RNG directly — all randomness goes through `src/engine/rng.ts` / `openPack.ts`.
- All card/pack/odds data lives in `data/` as JSON. Code never hardcodes card lists or odds.
- Animations are CSS-only (transitions/keyframes). No PixiJS/WebGL/canvas particle systems.
- No network calls at runtime. `scripts/fetch-data.mjs` is a one-time dev-side data fetch.
- Run `npm test` before finishing any task.
- After UI changes, take a screenshot and look at it before moving on.

## Commands

- `npm run dev` — dev server
- `npm test` — Vitest (odds engine + data validation)
- `npm run fetch-data` — regenerate `data/` from TCGdex (network required, dev-only)
- `npm run fetch-art` — download card art to `public/art/` (network required, dev-only, resumable)
- `npm run build && npm run preview` — production build, works fully offline

## Out of scope (do not build)

Battle, decks, missions, hourglasses/timers, shop, currency, pack points/crafting,
wonder pick, trading, friends, sound, login/accounts. v0 = Genetic Apex (A1) +
Mythical Island (A1a) only; no shiny rarities.
