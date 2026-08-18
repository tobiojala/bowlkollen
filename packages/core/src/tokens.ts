// Bowlkollen design tokens — the ONE cross-platform source of truth.
//
// Both apps read these so web and native can't drift apart on colour, type
// scale, spacing, or radius:
//   web    → apps/web/src/lib/brand.ts   re-exports these (+ CSS-var FONT, MOTION)
//   native → apps/mobile/theme.ts        re-exports these (+ RN-family FONT)
//
// Platform-agnostic values only — no CSS vars, no RN font families, no React.
// FONT stays per-app (web = CSS var strings, native = RN family names) and
// MOTION stays web-only (framer-motion config). See PARITY.md foundational row.

// ── Colours — near-black tonal, one gold accent, semantic green/red ───────────
// The senior-first contrast rule (AGENTS.md): ink / ink2 / ink3 all clear WCAG
// AA (~4.5:1) on `bg`; ink4 is sub-threshold — hairlines / disabled / decoration
// only, never readable text. Gold is the single brand accent, used sparingly.
// No blue — removed from the palette.
export const COLOR = {
  // Backgrounds — tonal elevation, never borders
  bg:       '#0b0d10',
  surface:  '#14171c',
  surface2: '#1c2127',

  // Ink — opacity scale, dark-first
  ink:  '#f4f5f7',
  ink2: 'rgba(244,245,247,0.72)',
  ink3: 'rgba(244,245,247,0.56)',
  ink4: 'rgba(244,245,247,0.34)',

  hairline: 'rgba(244,245,247,0.07)',

  // Brand accent — one gold
  gold: '#f5c200',

  // Semantic
  green: '#30d47e',   // positive: wins, gains, improvement
  red:   '#e05555',   // negative: losses, relegation, danger
} as const

// ── Type scale — senior-first, nothing below 11px ────────────────────────────
// body = readable floor; caption = smallest a value/date/label may use;
// label / micro = decoration only (faint uppercase tags), never meaningful text.
export const TYPE = {
  hero:    52,
  title:   24,
  body:    16,
  caption: 14,
  label:   12,
  micro:   11,
} as const

// ── Spacing — 8pt grid ───────────────────────────────────────────────────────
export const SPACE = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  6:  24,
  8:  32,
  12: 48,
  16: 64,
} as const

// ── Border radius ────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  pill: 9999,
} as const
