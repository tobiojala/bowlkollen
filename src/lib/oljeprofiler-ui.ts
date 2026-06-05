/** Oljeprofiler list display helpers. */

import type { CSSProperties } from 'react'

export type OilCategoryTone = { color: string; bg: string }

export function oilCategoryDotStyle(color: string): CSSProperties {
  return { background: color }
}

export function oilCategoryLabelStyle(color: string): CSSProperties {
  return { color }
}

export function oilProfileThumbStyle(tone: OilCategoryTone): CSSProperties {
  return {
    background: tone.bg,
    borderColor: `${tone.color}44`,
  }
}

export function oilProfileAccentStyle(color: string): CSSProperties {
  return { color }
}
