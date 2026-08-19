# PM Handoff — tcgp-offline-clone

## Your role

You are the **project manager** for this project. The developer is a Claude Code
session working directly in the repository on the owner's machine. You do not touch
code. Your job: turn the owner's goals into **task briefs**, sequence them, resolve
scope questions, and review the dev's completion reports.

How the loop has worked so far (keep it):

- You write a self-contained markdown brief: goal, context, findings you've verified,
  numbered tickets, explicit ordering, definition of done, out-of-scope list. The
  owner pastes it to the dev session verbatim.
- The dev implements, verifies in the browser via DOM inspection, runs tests, then
  reports back with what was done, what was verified, and anything owed.
- **The owner commits manually via GitHub Desktop.** The dev supplies commit
  summary + description text; it never runs `git commit` itself. Commit descriptions
  end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Briefs that included "the design decision to make first" sections and verdict
  tables have worked well — the dev follows them closely.

## The project

A personal, **fully offline** clone of Pokémon TCG Pocket's collection + pack-opening
loop. Single-page web app, localhost only, not for distribution. **v0 scope:** two
sets — Genetic Apex (A1) and Mythical Island (A1a). Explicitly banned (per CLAUDE.md):
battle, decks, missions, hourglasses/timers, shop, currency, pack points/crafting,
wonder pick, trading, friends, sound, login/accounts.

**Stack:** Vite 5 + React 18 + TypeScript (strict), Zustand, IndexedDB via `idb`,
plain CSS with CSS-only animations (no WebGL/canvas — hard rule), Vitest.
No runtime network calls of any kind — verified against the production bundle.

**Repo rules (CLAUDE.md, enforced so far):**
- `src/engine/` has zero React imports; UI never rolls RNG directly.
- All card/pack/odds data is JSON in `data/`; code never hardcodes card lists.
- Animations CSS-only. `npm test` before finishing any task. Screenshot after UI
  changes (see "Known issues" — currently blocked).
- Card art is fetched locally, gitignored, never committed; every art consumer
  degrades to a generated placeholder when files are missing.

## Repository layout

```
data/
  sets/A1.json, A1a.json   # 284 + 86 cards, fetched from TCGdex, real rarities/packs
  packs.json               # 4 packs (Charizard/Mewtwo/Pikachu/Mew) + sets, heroCardId, logos
  odds.json                # published Genetic Apex offering rates, editable
scripts/
  fetch-data.mjs           # one-time card-data fetch from TCGdex (cached in scripts/.cache/)
  fetch-art.mjs            # one-time art fetch: 372 card webps (~22 MB) + set logos
src/
  engine/                  # types, rarity (+isHighTier), rng (mulberry32), pool,
                           # openPack (god-pack roll, empty-pool fallback), validate, data
  store/                   # collection (IndexedDB, history, export/import), settings, nav
  ui/
    App.tsx                # tab bar: Packs / Binder / Debug; state-based routing
    screens/               # Home, OpenPack, Binder, CardDetail, Debug
    components/            # CardFace, PackArt, RarityGlyphs
    app.css                # single global stylesheet, all animations
tests/                     # openPack.test.ts (200k-pack simulation), data.test.ts
docs/                      # ROADMAP-1.4-1.5.md, this file
public/art/                # gitignored; populated by npm run fetch-art
```

## What is built and verified (v1.4)

- **Odds engine** — seeded, deterministic, per-pack rarity pools. 200k-pack
  simulation matches the published rates (slots 1–3 always ◇; slot-4/5 tables; god
  pack ≈ 0.05%). Per-card rates fall out of pool sizes. 13/13 tests green.
- **Real data + art** — card lists, rarities, and pack assignments from TCGdex's API
  (booster fields, not guesses). Full-card webp art for all 372 cards; CardFace shows
  the image as the entire face, or a generated type-colored placeholder if absent.
- **Pack opening** — pack slide-in → tear strip → **one-at-a-time reveal** at
  ~340px: tap/space/swipe-up reveals then advances, progress dots colored by rarity,
  rarity-tiered effects (plain / star sweep / S3+CROWN full-stage darken + radial
  burst + input hold + no auto-advance), art preloaded during the tear, "Reveal all"
  skip, `prefers-reduced-motion` honored, 5-up summary with NEW badges.
- **Pack art** — wrappers composed from the namesake crown card's art (masked hero)
  + pack color gradient + set logo + foil sweep; per-layer fallback.
- **Binder** — per-set grid, owned/unowned, count badges, filters (pack/rarity/type/
  owned), completion %, card detail (stats, drop packs, times pulled).
- **Persistence** — IndexedDB auto-save, export/import JSON, reset. Note: saves are
  per-origin, so dev (5173) and preview (4173) have separate collections (documented).
- **Debug** — unlimited packs, force god pack, roll-N histogram, give card by ID.
- **Offline build** — `npm run build && npm run preview` verified: art survives the
  build, zero external requests.

Card sizing is a `--card-w` CSS variable with `aspect-ratio: 2.5/3.5` — binder 104px,
reveal `min(340px, 78vw)`, detail `min(380px, 90vw)`.

## Known issues / debts

1. **No human (or model) has ever *seen* the UI.** All verification is DOM-based; the
   dev's browser-pane screenshots fail because the pane isn't displayed on the
   owner's screen. First time the pane is open, a full visual review of reveal
   stage, rare-pull burst, and pack art is owed. Treat this as the top risk.
2. `A1-265` / `A1-279` skipped (TCGdex rarity `"None"`) — documented in README.
3. The dev's test runs polluted the dev-origin collection slightly (a few packs incl.
   one god pack). Debug → Reset clears it if the owner cares.
4. React StrictMode is intentionally off (pull recording is effect-based; StrictMode
   would double-count). Documented in `src/main.tsx`.

## Decided and pending for 1.5

Proposed in `docs/ROADMAP-1.4-1.5.md`, **awaiting the owner's scope decision**:

- **Pending decision:** unban Wonder Pick (the roadmap's recommendation) or keep the
  ban list intact. Whatever is decided, CLAUDE.md must be edited in the same commit
  that implements it — the repo must not contradict itself.
- Planned 1.5 content: proper home screen (pack carousel, completion, recent pulls);
  **immersive card view** (3D tilt + pointer-tracking holo sheen, CSS-only,
  reference: simeydotme/pokemon-cards-css, MIT) — the headline; richer card detail
  (illustrator + flavor text already sit unused in `scripts/.cache/`, need adding to
  the Card schema in `fetch-data.mjs`); binder sort controls + completion emblem;
  pull-history timeline (data already recorded).

## Practical notes for writing briefs

- Commands: `npm run dev` (5173), `npm test`, `npm run build` / `preview` (4173),
  `npm run fetch-data`, `npm run fetch-art` — the fetch scripts are dev-only and
  resumable; everything else is offline.
- The dev verifies claims empirically (probing APIs, measuring sizes) — briefs that
  state verified findings with numbers get faithful implementations; the dev will
  also push back or flag when reality diverges from the brief.
- Keep tickets ordered and small; state the definition of done as observable
  behavior; always include an out-of-scope line to prevent creep.
- The engine is finished and tested — treat `src/engine/` changes as exceptional and
  justify them explicitly in any brief that touches them.
