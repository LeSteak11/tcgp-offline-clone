# Task brief: real card artwork

## Context

370 cards total (A1: 284, A1a: 86). `public/art/` exists and is empty. `CardFace.tsx`
already supports a per-card art override with an `onError` fallback to the generated
monogram, so the loading path is built — this task fills it.

## What I already verified

**The image URLs are already on disk.** Every one of the 374 files in `scripts/.cache/`
contains an `image` field:

```json
"image": "https://assets.tcgdex.net/en/tcgp/A1/001"
```

TCGdex appends a size/format suffix to that base. Measured on A1-001:

| Variant | Size | 370-card total |
|---|---|---|
| `low.webp` | 15 KB | ~5.6 MB |
| `high.webp` | 48 KB | ~18 MB |
| `low.png` | 59 KB | ~22 MB |
| `high.png` | 285 KB | ~105 MB |

**Use `high.webp`.** Sharp enough for full-card display, ~18 MB total, and 6x smaller
than the PNG equivalent.

This means **no metadata re-fetch is needed** — the art script reads the existing
cache. No network calls for card data, only for the images themselves.

---

## The design decision that has to be made first

**TCGdex serves complete card images, not artwork crops.** The file at
`.../A1/001/high.webp` is the entire Bulbasaur card: frame, name, HP, attacks, border.

`CardFace.tsx` currently renders the image into a small `.card-face__art` panel, with
its own header (name + HP), meta row (stage, ex), and footer (rarity glyphs, card id)
drawn around it. Dropping full-card images into that panel gives you **a card inside a
card** — doubled names, doubled HP, nested borders.

Two ways out:

**Option A — full-card mode (recommended).** When art exists, `CardFace` renders the
image as the entire card and skips all generated chrome. When it doesn't, it falls back
to the current placeholder exactly as it works today. Both paths keep the same outer
dimensions, border radius, and the `--shiny` / `--crown` rarity effects layered on top.

**Option B — crop the art window.** Extract just the illustration from each full card
and keep the generated frame. Requires per-rarity crop rectangles (full-arts have no
art window at all), so it breaks on exactly the cards that matter most.

Go with A. It's less work and it's what the real app looks like.

---

## Tickets

### 1. `scripts/fetch-art.mjs` — new script

- Read every `scripts/.cache/card-*.json`; take the `image` field.
- Skip records with no `image` (some may lack it).
- Download `${image}/high.webp` → `public/art/<cardId>.webp`.
- **Idempotent**: skip any file that already exists, so re-runs resume cheaply.
- Concurrency 8, matching `fetch-data.mjs`. Set a descriptive `User-Agent`.
- Retry each URL twice on failure with a short backoff; log and continue on permanent
  failure rather than aborting the run.
- Print a summary: downloaded / skipped / failed, and total bytes.
- Wire up as `npm run fetch-art` in `package.json`.
- Mirror the existing header comment style in `fetch-data.mjs`: dev-only, one-time,
  never called at runtime.

### 2. `CardFace.tsx` — full-card mode

- Change the extension from `.png` to `.webp` in the `src` (one line).
- When the image loads, render it alone as the full card face — no header, meta, or
  footer.
- When it errors, keep today's placeholder output unchanged.
- Preserve outer sizing, `small` variant, border radius, and the `card-face--shiny` /
  `card-face--crown` effects in both modes.
- Add whatever CSS the full-card mode needs alongside the existing `.card-face` rules.

### 3. `CLAUDE.md` — fix the contradiction

Line 4-5 currently reads:

> No copyrighted art — cards render as generated placeholders

That rule is what this task breaks, so it has to be rewritten in the same commit.
Replace with something like: art is fetched locally for personal offline use via
`npm run fetch-art`, is never committed, and the placeholder renderer remains the
fallback when art is absent. Add `npm run fetch-art` to the Commands section.

### 4. `.gitignore` — do not commit the art

Add `public/art/*` with a `!public/art/.gitkeep` exception. 18 MB of official card
images in git history is both repo bloat and the one thing that turns a private
offline project into distribution. The script regenerates them on demand; that's the
point.

### 5. Tests

- `npm test` must pass.
- Add a data-validation test asserting every card id resolves to a legal art filename
  (no path separators or characters that break on Windows).
- Do **not** add a test requiring art files to exist — the repo is valid without them.

---

## Order

1 → 4 → 2 → 3 → 5. Get `.gitignore` in before the first download so 370 images never
touch the index.

## Definition of done

- `npm run fetch-art` populates `public/art/` with ~370 `.webp` files, resumable.
- Cards render as real full-card art in the collection and in pack opening.
- Deleting `public/art/` and reloading still works — placeholders everywhere, no errors.
- `npm test` green, `git status` clean after a fetch.
- Screenshot of a pack opening with real art, per the existing CLAUDE.md rule.

## Out of scope

Art for sets beyond A1/A1a. Crop extraction. Image optimization beyond picking the
webp variant. Any runtime network fetching — the app stays fully offline.
