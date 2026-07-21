// Canonical design tokens as typed JS constants.
// These mirror the @theme values in globals.css exactly.
// Use these in components that still need JS color values (inline styles, SVG fills, etc.)
// New code: prefer Tailwind classes (bg-gold, text-green, border-dark-border, etc.)

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

  // Brand
  gold:         '#f5c200',   // achievements, active, milestones
  green:        '#5dcaa5',   // form, improvement, positive
  blue:         '#7ab4e8',   // DEPRECATED — removed from the palette; do not use in new code (kept so the un-migrated long tail compiles)
  blueMuted:    '#5a82b4',   // DEPRECATED — see above
  red:          '#e05555',   // danger, relegation
  pink:         '#d94a90',   // special events
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
