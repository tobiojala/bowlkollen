/**
 * Bowlkollen brand tokens for web.
 *
 * COLOR / TYPE / SPACE / RADIUS are the cross-platform tokens from
 * `@bowlkollen/core` (shared with native — see packages/core/src/tokens.ts),
 * re-exported here so every `import { COLOR } from '@/lib/brand'` keeps working
 * but reads the ONE source of truth. FONT (CSS vars) and MOTION (framer) are
 * web-only and stay local. globals.css @theme must mirror the core colours.
 */
export { COLOR, TYPE, SPACE, RADIUS } from '@bowlkollen/core'

// ── Typography (web-only — CSS-var families) ──────────────────────────────────

export const FONT = {
  display: "var(--font-display, 'Barlow Condensed', system-ui)",  // wordmark / brand only
  body:    "var(--font-body, 'DM Sans', system-ui)",              // all other text
  score:   "var(--font-score, 'Sora', system-ui)",                // scores & stat numbers (600/700/800)
} as const

// ── Motion (web-only — framer-motion) ─────────────────────────────────────────

export const MOTION = {
  fast:   0.15,
  normal: 0.24,
  slow:   0.40,
  spring: { type: 'spring', stiffness: 300, damping: 30 } as const,
} as const
