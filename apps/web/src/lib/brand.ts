/**
 * Bowlkollen brand tokens — single source of truth.
 *
 * CSS variables (globals.css @theme) are the canonical values.
 * These TS exports mirror them for use in inline-style components.
 * When adding a new token: add it here AND in globals.css @theme.
 */

// ── Colors ────────────────────────────────────────────────────────────────────

export const COLOR = {
  // Backgrounds — tonal elevation, never borders
  bg:       '#0b0d10',
  surface:  '#14171c',
  surface2: '#1c2127',

  // Ink — opacity scale, dark-first
  ink:  '#f4f5f7',
  ink2: 'rgba(244,245,247,0.72)',  // senior-legible (WCAG AA)
  ink3: 'rgba(244,245,247,0.56)',  // floor for real text
  ink4: 'rgba(244,245,247,0.34)',  // hairlines / disabled / decoration only

  hairline: 'rgba(244,245,247,0.07)',

  // Brand accent — one gold, used sparingly
  gold:  '#f5c200',

  // Semantic
  green: '#30d47e',   // positive: wins, gains, improvement
  red:   '#e05555',   // negative: losses, relegation, danger

  // Blue is removed from new code
  // Use ink for info/comparison, green for positive outcomes
} as const

// ── Typography ────────────────────────────────────────────────────────────────

export const FONT = {
  display: "var(--font-display, 'Barlow Condensed', system-ui)",  // wordmark / brand only
  body:    "var(--font-body, 'DM Sans', system-ui)",              // all other text
  score:   "var(--font-score, 'Sora', system-ui)",                // scores & stat numbers (600/700/800)
} as const

// ── Type scale (mobile-first, nothing below 11px) ─────────────────────────────

export const TYPE = {
  hero:    52,   // fullscreen score / season stat
  title:   24,   // page/section title
  body:    16,   // main content — readable floor (senior-first)
  caption: 14,   // supporting detail — smallest for a value/date/label
  label:   12,   // uppercase metadata, badges (decoration)
  micro:   11,   // absolute floor — decoration only, never real text
} as const

// ── Spacing — 8pt grid ────────────────────────────────────────────────────────

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

// ── Border radius ─────────────────────────────────────────────────────────────

export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,    // Surface — rounded-2xl — use everywhere
  xl:   20,
  pill: 9999,
} as const

// ── Motion ────────────────────────────────────────────────────────────────────

export const MOTION = {
  fast:   0.15,
  normal: 0.24,
  slow:   0.40,
  spring: { type: 'spring', stiffness: 300, damping: 30 } as const,
} as const
