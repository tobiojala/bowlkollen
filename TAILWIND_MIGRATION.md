# Tailwind migration plan

Goal: move the UI from inline `style={{}}` + `useColors()` to **Tailwind v4
utility classes**, without regressing the design system. The token layer is
already done — this is a component-by-component conversion.

## Current state (measured)
- **Tailwind v4** is set up. `tailwind.config.ts` is intentionally empty; all
  design tokens live in the `@theme` block in `src/app/globals.css` and are
  already exposed as utilities (`bg-surface`, `text-ink`, `text-gold`,
  `rounded-pill`, `text-hero`, `duration-fast`, `max-w-app`, …).
- **Scale:** ~2,550 `style={{}}` across **95 files**; **45** components use
  `useColors()`; **19** files use framer-motion; shared classes `.num`,
  `.section-label`, `.glass-row`, `.live-dot`, `.skeleton` live in globals.css.
- Design system is **gold-down / green-positive / no-blue** (see `AGENTS.md`),
  near-black tonal, **dark-first** (light mode is deferred per `LAUNCH_PLAN.md`).

## Decisions (confirm before starting)
1. **Dark-only utilities, drop the `isDark` duals.** Components currently branch
   on `isDark` for light/dark. Light is deferred, and the home redesign already
   shipped dark-only. → Convert to the canonical dark utilities (`bg-bg`,
   `text-ink`, …) and delete the light branches. `--color-light-*` stays defined
   for when light returns; re-introducing it later is a `dark:`-variant pass, not
   a rewrite. **(Recommended — halves the work and matches the launch.)**
2. **Keep the shared CSS classes** (`.num`, `.section-label`, `.glass-row`,
   `.live-dot`, `.skeleton`, keyframes). They're already clean, token-based, and
   reused 40+ times. Don't expand them to inline utilities.
3. **Coexistence is fine.** Inline styles and Tailwind can live side-by-side
   during the migration — we don't block on 100%. Ship per-component.

## Token mapping cheat-sheet
`useColors()` `C.*` (dark values) → utility:
| C.* | Tailwind | note |
|---|---|---|
| `C.bg` | `bg-bg` | #0b0d10 |
| `C.surface` | `bg-surface` | #14171c |
| `C.card` | `bg-dark-card` | #1a1e24 |
| `C.border` | `border-dark-border` | hairline; prefer tonal step |
| `C.text` | `text-ink` | #f4f5f7 |
| `C.textMuted` / `C.muted` | `text-dark-muted` | #828b99 |
| `C.accent` | `text-gold` / `bg-gold` | #f5c200 |
| `C.green` | `text-green` | #5dcaa5 — positives only |
| `C.red` | `text-red` | #e05555 |

Home `HC.*` → utility: `HC.BG`→`bg-bg`, `HC.SURFACE`→`bg-surface`,
`HC.SURFACE2`→`bg-surface-2`, `HC.INK`→`text-ink`, `HC.INK2`→`text-ink-2`,
`HC.INK3`→`text-ink-3`, `HC.INK4`→`text-ink-4`, `HC.GOLD`→`text-gold`,
`HC.GREEN`→`text-green`, `HC.RED`→`text-red`, `HC.HAIRLINE`→`border-hairline`.

Other scales: radius → `rounded-{sm,md,lg,xl,pill}`; type → `text-{hero,title,
body,caption,label}`; motion → `duration-{fast,normal,…}`, `ease-{out,spring}`;
width → `max-w-app`. Tabular numerals → keep `.num` (it also sets the display
font) or use `tabular-nums`.

> ⚠️ **Muted mismatch to unify:** `C.textMuted` (#828b99, → `text-dark-muted`)
> and `HC.INK3` (rgba white 40 %, → `text-ink-3`) are two different "muted"s.
> Map each to its exact match to stay pixel-identical now; track a follow-up to
> standardise on `text-ink-3` repo-wide.

## What stays inline (do NOT convert)
- **Computed/dynamic colours:** hue-from-name avatars, `divisionColor`,
  score-tone colours, anything derived at runtime → keep `style={{}}` or
  `bg-[var(--x)]` arbitrary values.
- **framer-motion** `animate`/`style`/`layout` props — leave as-is.
- **Complex one-offs:** Nav/BottomNav glass (backdrop-filter, multi-layer
  shadows, SVG lens) — keep inline or as a dedicated class; not worth utilities.

## Per-component conversion recipe
1. Replace static `style={{}}` props with `className` utilities from the table.
2. Move conditional styling to `clsx`/template `className` (e.g.
   `homeWin ? 'text-gold' : 'text-ink-3'`).
3. Drop the `isDark` branch (decision 1); remove now-unused `useColors()` if the
   component no longer reads `C`/`isDark`.
4. Leave dynamic/motion values inline.
5. Verify: `npx tsc --noEmit`, `npm run test`, and **eyeball the route in a
   running dev server** (use the `verify`/`run` skill) — diff against the live
   look before/after.

## Ordering (leaf-first, highest-reuse first)
**Phase 0 — prep:** add `clsx` (or keep template strings); add the `.num`/
`.section-label` note to `AGENTS.md`; optionally a codemod-assist for the
mechanical `color:`/`background:`/`padding:` cases (review every diff — no blind
apply).

**Phase 1 — shared primitives & high-reuse** (compounding benefit):
`PlayerCard`, `components/widgets/Widgets`, the home `_components/*`
(LiveCard, MatchRow, StandingsCard, HonorList, HomeHero, TournamentCard),
profile section/sheet shells.

**Phase 2 — the spine** (already on-system, the showcase): `/` home,
`/matches/[id]` (MatchHero, MatchClient, ScoreChip), `/players/[id]` view.

**Phase 3 — primary nav pages:** schema, teams/Klubbar, tavlingar, puls,
league, mer, profile, legal, oljeprofiler.

**Phase 4 — chrome:** Nav, BottomNav, NavTitle, Footer (mostly keep the glass
inline; convert the static bits).

**Phase 5 — long-tail / internal:** admin, hallar, klotshopar, compare,
team/intern, laguttagning/tillganglighet, reset-password, login.

## Guardrails (after each phase)
- `tsc` + `npm run test` green; build attempted where env allows.
- Once a file is converted, no `style={{}}` should remain except the
  documented dynamic/motion exceptions.
- **End-state lint guard:** enable a rule to flag new static inline styles
  (e.g. `react/forbid-dom-props` for `style`, or a custom check) so we don't
  regress — turn it on only after Phase 5.

## Effort
Large but mechanical and parallelisable by file. Budget by phase, not all at
once; each file is independently shippable and verifiable. Inline + Tailwind
coexist throughout, so there's no risky big-bang cutover.
