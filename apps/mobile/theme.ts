/**
 * Bowlkollen brand tokens for React Native.
 * Mirrors apps/web/src/lib/brand.ts — plain values (no CSS vars).
 * When packages/core is extracted, these move there and both apps import them.
 */

export const COLOR = {
  // Backgrounds — tonal elevation, never borders
  bg: '#0b0d10',
  surface: '#14171c',
  surface2: '#1c2127',

  // Ink — opacity scale, dark-first
  ink: '#f4f5f7',
  ink2: 'rgba(244,245,247,0.64)',
  ink3: 'rgba(244,245,247,0.40)',
  ink4: 'rgba(244,245,247,0.24)',

  hairline: 'rgba(244,245,247,0.07)',

  // Brand accent — one gold, used sparingly
  gold: '#f5c200',

  // Semantic
  green: '#30d47e',
  red: '#e05555',
} as const;

export const TYPE = {
  hero: 52,
  title: 24,
  body: 15,
  caption: 13,
  label: 11,
  micro: 9,
} as const;

export const SPACE = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
  16: 64,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
} as const;

// Brand fonts (mirror web: DM Sans body, Barlow Condensed display).
// RN custom fonts are selected by family name, not fontWeight — so each weight
// is its own family. `display` (Barlow Condensed) is for scores/hero numbers &
// big titles; the DM Sans weights are body/labels.
export const FONT = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  display: 'BarlowCondensed_700Bold',
  displaySemi: 'BarlowCondensed_600SemiBold',
} as const;
