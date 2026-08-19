# Roadmap: 1.4 and 1.5

## 1.4 — Pack art + ship-readiness

### Finding: there is no pack art to download

TCGdex's booster records carry only `{ id, name }` — no image field. I probed five URL
patterns (`/boosters/{id}`, `/tcgp/A1/boosters/…`, `/tcgp/A1/charizard/…`, etc.); all
404. Pack art is not in the source we use.

What TCGdex *does* serve:

| Asset | URL | Size |
|---|---|---|
| Set logo | `https://assets.tcgdex.net/en/tcgp/{setId}/logo.png` | ~68 KB |
| Set symbol | `https://assets.tcgdex.net/univ/tcgp/{setId}/symbol.png` | ~0.7 KB |

### Approach: build pack art from art we already have

Each pack is named for a Pokémon whose Crown-rarity full art is already in
`public/art/`:

| Pack | Namesake card | Rarity |
|---|---|---|
| A1-charizard | `A1-284` | CROWN full art |
| A1-mewtwo | `A1-286` | CROWN full art |
| A1-pikachu | `A1-285` | CROWN full art |
| A1a-mew | `A1a-086` | CROWN full art |

Compose the pack cover in CSS from three layers: the namesake art as the hero (scaled
and masked to the pack's upper portion), the pack's existing `color` from
`data/packs.json` as the wrapper gradient, and the set logo across the top. Add the
existing foil sweep over it.

This needs no new download source, works offline, and matches how the real packs are
designed — each one fronts its namesake.

**Tickets**

1. **Extend `packs.json`** with `heroCardId` and `setLogo` per pack. Data, not code —
   per the repo rule that code never hardcodes card lists.
2. **`scripts/fetch-art.mjs`**: also fetch set logos to `public/art/sets/{setId}.png`.
   Same idempotent/resume behavior. Small change, same script.
3. **`PackArt` component** replacing the current `.pack-art` div — layered hero art +
   gradient + logo + foil. Used by both the pack picker and the opening slide-in.
4. **Fallback** to today's flat colored wrapper when the hero image is missing, matching
   how `CardFace` degrades.

### Also in 1.4 — the things flagged as not-done

5. **Verify `npm run build && npm run preview` works fully offline.** This is the
   project's entire premise and it has never been run. `base: './'` is untested against
   a production bundle, and 22 MB of art in `public/` may or may not survive the build
   the way we assume. Do this **first in 1.4**, not last — if it's broken, it changes
   what everything else has to look like.
6. **README** — run, fetch art, edit odds/cards, offline build.
7. **Housekeeping** — commit or delete the untracked `ART-PLAN.md` / `REVEAL-PLAN.md`
   / this file; document the two A1 cards skipped upstream for rarity `"None"` in the
   README's known-gaps section.

---

## 1.5 — UI and non-battle game features

### First: a scope conflict to resolve

`CLAUDE.md` currently lists as out of scope: *battle, decks, missions, hourglasses/
timers, shop, currency, pack points/crafting, wonder pick, trading, friends, sound,
login/accounts.*

Most of "other stuff from the actual game" lives on that list. That list was a
deliberate choice to keep this a collection + pack-opening toy. **Decide what to lift
before the dev starts**, and edit `CLAUDE.md` in the same commit — don't leave the repo
contradicting itself the way the art policy did.

My read on the candidates:

| Feature | Verdict |
|---|---|
| **Wonder Pick** | Best candidate to unban. Self-contained, no economy, genuinely fun, reuses the reveal stage |
| **Pack points / crafting** | Requires a currency and a full economy loop. Big scope, changes the project's character |
| **Missions** | Needs goals + rewards + a currency to pay out. Skip |
| **Timers / hourglasses** | Actively makes a personal offline toy worse. Hard skip |
| **Shop / trading / friends** | Meaningless single-player and offline. Skip |

### The headline feature I'd build instead

**Immersive card view.** TCG Pocket's signature non-battle moment: tap a full art and
it tilts in 3D against the light with a holo sheen tracking the pointer. It is not on
the banned list, it needs no economy, and we already have 372 real full-card images
plus rarity data marking which are `isFullArt`.

CSS transforms and gradients only — no WebGL, per the repo rule. Reference technique:
`simeydotme/pokemon-cards-css` (MIT), which does exactly this for real TCG scans.

This is the highest ratio of "feels like the real game" to effort available.

### Rest of 1.5

1. **Home screen.** There isn't one — the app opens on a tab bar. A proper home:
   featured pack carousel with the new pack art, collection completion per set, recent
   pulls, and an "open" entry point.
2. **Immersive card view** (above), wired into card detail and reachable from a rare
   reveal.
3. **Richer card detail.** `scripts/.cache/` already has `illustrator` and
   `description` (dex flavor text) for every card, and neither is in our `Card` schema
   or on screen. Add both in `fetch-data.mjs` and render them. Cheap, high texture.
4. **Binder polish.** The grid works but is plain: sort controls, a rarity-sorted view,
   set-completion emblem when a set hits 100%.
5. **Pull history / log.** Every pull is already recorded for the detail-screen stats.
   Surface it as a timeline — cheap, and it makes the collection feel earned.

---

## Sequencing note

Do **1.4 ticket 5 (offline build verification) before anything else in 1.4.** It's the
only remaining unknown that can invalidate work already done, and it's an hour.

The screenshot-review gap is the other real risk — the UI has been verified by DOM
only, never looked at. The binder screenshot confirms art and layout are landing, but
the reveal stage at 340px, the rare-pull burst, and the new pack art all need eyes
before 1.5 builds on top of them.
