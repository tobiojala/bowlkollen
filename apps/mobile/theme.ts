/**
 * Bowlkollen brand tokens for React Native.
 *
 * COLOR / TYPE / SPACE / RADIUS come from `@bowlkollen/core` (the ONE
 * cross-platform source, shared with web — see packages/core/src/tokens.ts),
 * re-exported so existing `import { COLOR } from '@/theme'` keeps working while
 * web and native can't drift apart. FONT stays local (RN family names).
 */
export { COLOR, TYPE, SPACE, RADIUS } from '@bowlkollen/core';

// Brand fonts (mirror web: DM Sans body, Barlow Condensed display).
// RN custom fonts are selected by family name, not fontWeight — so each weight
// is its own family. `display` (Barlow Condensed) is for scores/hero numbers &
// big titles; the DM Sans weights are body/labels.
export const FONT = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  display: 'BarlowCondensed_700Bold',      // brand/wordmark only
  displaySemi: 'BarlowCondensed_600SemiBold',
  score: 'Sora_700Bold',                   // all scores/stat numbers
  scoreSemi: 'Sora_600SemiBold',
  scoreHeavy: 'Sora_800ExtraBold',         // big hero totals (condensed via tight tracking)
} as const;
