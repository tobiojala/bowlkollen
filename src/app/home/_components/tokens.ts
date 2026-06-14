// Dark design-system palette for the redesigned home feed — same near-black
// tonal tokens the mockup + redesigned profile use, as inline-style constants.

export const HC = {
  BG: '#0b0d10', SURFACE: '#14171c', SURFACE2: '#1c2127',
  INK: '#f4f5f7',
  INK2: 'rgba(244,245,247,0.64)',
  INK3: 'rgba(244,245,247,0.40)',
  INK4: 'rgba(244,245,247,0.24)',
  GOLD: '#f5c200', GREEN: '#5dcaa5', RED: '#e05555',
  HAIRLINE: 'rgba(244,245,247,0.07)',
} as const

/** Tone for a match score relative to the field. */
export const scoreTone = (g: number) => (g >= 250 ? HC.GOLD : g >= 200 ? HC.INK : HC.INK3)
