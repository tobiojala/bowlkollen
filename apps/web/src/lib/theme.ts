// Web JS color values for inline styles / SVG fills. Brand + semantic colours
// (gold/green/red) come from the ONE cross-platform source `@bowlkollen/core`
// so this system can't diverge from brand.ts / native. Surface variants and the
// light palette are still web-only here (core owns the dark near-black set; a
// shared light palette is the next reconciliation step). New code: prefer
// Tailwind classes (bg-gold, text-green, …) or useColors().
import { COLOR as CORE } from '@bowlkollen/core'

export const colors = {
  // Surfaces — near-black, desaturated. Elevation = tonal step, not borders.
  darkBg:       '#0b0d10',
  darkSurface:  '#14171c',
  darkCard:     '#1a1e24',
  darkBorder:   '#242a32',
  darkMuted:    '#828b99',

  lightBg:      '#f5f2ec',
  lightSurface: '#ffffff',
  lightCard:    '#ffffff',
  lightBorder:  '#e8e0d4',
  lightMuted:   '#6b7a8d',

  // Brand + semantic — sourced from core (single source of truth)
  gold:         CORE.gold,    // achievements, active, milestones
  green:        CORE.green,   // form, improvement, positive (#30d47e — canonical)
  red:          CORE.red,     // danger, relegation
  blue:         '#7ab4e8',    // DEPRECATED — removed from the palette; do not use in new code (kept so the un-migrated long tail compiles)
  blueMuted:    '#5a82b4',    // DEPRECATED — see above
  pink:         '#d94a90',    // special events
} as const

export type ColorKey = keyof typeof colors

// Resolved theme object for a given mode — replaces the old colors.ts dark/light objects.
// Components can call: const C = theme(isDark)
export function theme(isDark: boolean) {
  return {
    bg:        isDark ? colors.darkBg       : colors.lightBg,
    surface:   isDark ? colors.darkSurface  : colors.lightSurface,
    card:      isDark ? colors.darkCard     : colors.lightCard,
    border:    isDark ? colors.darkBorder   : colors.lightBorder,
    muted:     isDark ? colors.darkMuted    : colors.lightMuted,
    textMuted: isDark ? colors.darkMuted    : colors.lightMuted, // alias for legacy components
    text:      isDark ? '#f4f5f7'           : '#1a2535',
    accent:    colors.gold,
    green:     colors.green,
    blue:      colors.blue,
    blueMuted: colors.blueMuted,
    red:       colors.red,
  }
}

export type Theme = ReturnType<typeof theme>
