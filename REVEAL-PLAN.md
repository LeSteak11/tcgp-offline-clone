# Task brief: one-at-a-time reveal at full scale

## Goal

Replace the 5-card fan with a single large card revealed one at a time, and make the
whole opening sequence physically bigger. The fan is the main thing making this feel
like a spreadsheet instead of a pack opening.

## What's constraining size today

Three hardcoded values, all in `src/ui/app.css`:

| Rule | Current | Problem |
|---|---|---|
| `.open-pack` | `width: min(440px, 100%)` | Caps the entire opening stage at 440px |
| `.card-face` | `width: 128px; height: 178px` | Card size hardcoded in px |
| `.flip-card` | `width: 128px; height: 178px` | Duplicated, must stay in sync by hand |

`.card-face--small` (104×145) duplicates it a third time. Card size needs to become a
variable before anything else here is workable.

---

## Tickets

### 1. Card sizing becomes a variable

- Define `--card-w` on a container and derive everything from it:
  `width: var(--card-w); aspect-ratio: 2.5 / 3.5;` — the real trading card ratio, and
  it removes the need to maintain a separate height.
- `.card-face`, `.flip-card`, and `.card-face--small` all read from it instead of
  carrying their own pixel values.
- Set per context: binder grid small, reveal stage large, detail view largest.
- No visual change expected in the binder from this ticket. It's groundwork — do it
  first and confirm the binder still looks identical.

### 2. Reveal stage: one card at a time

Replace `.card-fan` and the 5-button `flip-card` grid with a single centered card.

**Behavior:**
- One card fills the stage — target `--card-w` around `min(340px, 78vw)`, roughly 2.6x
  today's 128px.
- Click anywhere / press space / swipe up reveals the current card.
- Once revealed, the same interaction advances to the next card, which arrives
  face-down.
- After the 5th, go to summary as it does now.
- A small position indicator — `2 / 5` — and five dots showing which are already
  revealed. Dots colored by rarity once revealed, so the run so far reads at a glance.
- Keep the existing card-back design, scaled up.

**Transitions (CSS only, per the project rule):**
- Incoming card slides up from below with a slight overshoot.
- Flip stays the existing `rotateY` — it just gets bigger.
- Outgoing card scales down and fades toward the dot indicator.

**Do not** remove the summary grid. Five-up is right *there* — it's the recap. The
problem is only that the reveal itself was five-up.

### 3. Make the rare pull land

Right now `flip-card--glow` fires the same 0.8s flash for a One Star and a Crown. That
flattens the best moment in the app.

- Scale the effect by rarity: D1–D4 plain, S1/S2 a brightening sweep, S3/CROWN a
  full-stage treatment — background darkens, radial burst behind the card, longer
  hold before advance is allowed.
- On S3/CROWN, suppress auto-advance entirely and require an explicit tap. Let the
  player look at it.
- `isStarOrAbove` already exists in `src/engine/rarity.ts`; add a helper there for the
  higher tier rather than putting rarity logic in the component.

### 4. Preload art before the tear

Now that cards are real 48 KB webp files, the first flip can show a blank frame while
the image loads. Since the pull is already rolled during `arrive`, preload all five
images during the pack-slide-in and tear, before any card is revealed. `new Image()`
in an effect is enough — no library.

### 5. Fixes to pick up along the way

- `OpenPack.tsx:65` hardcodes `[0, 1, 2, 3, 4]`. Derive from `result.cards.length`.
- `.open-pack` has `min-height: 640px` which will fight the larger stage. Re-check.
- Honor `prefers-reduced-motion`: skip slides and flips, reveal instantly. Currently
  unhandled anywhere in `app.css`.
- Add a "reveal all" / skip control for when you're opening in bulk. One-at-a-time is
  better for the first pack and worse for the twentieth.

---

## Order

1 → 2 → 4 → 3 → 5. Sizing first (everything depends on it), then the flow, then
preload before polish so the rare-pull work is judged against real art.

## Definition of done

- Reveal shows one card at a time at roughly 2.6x the current size.
- Click, space, and swipe all advance; the sequence ends at the existing summary.
- Progress indicator shows position and which cards are already revealed.
- No art pop-in on first flip.
- Crown and Three Star pulls visibly outrank Two Diamond ones.
- Binder and card detail unchanged in appearance.
- `npm test` green.
- Screenshot of a mid-reveal card and a rare pull, per the CLAUDE.md rule.

## Out of scope

Sound (explicitly out of scope in CLAUDE.md). Any engine change — odds, pools, and RNG
are untouched; this is a pure `src/ui/` task. No new dependencies; CSS animations only.
