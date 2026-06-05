/** Tävlingar card display helpers (dynamic status tones). */

import type { CSSProperties } from 'react'

const GOLD = '#f5c200'

export type TavlingStatus = 'pagaende' | 'avslutad' | 'kommande'

export function tavlingCardShellStyle(opts: {
  hasBanner: boolean
  cardBg: string
  cardBorder: string
}): CSSProperties {
  const { hasBanner, cardBg, cardBorder } = opts
  return {
    background: hasBanner ? 'transparent' : cardBg,
    border: `1px solid ${cardBorder}`,
  }
}

export function tavlingBannerOverlayStyle(): CSSProperties {
  return {
    background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.75) 100%)',
  }
}

export function tavlingAccentBarStyle(accentBar: string): CSSProperties {
  return { background: accentBar }
}

export function tavlingBodyBgStyle(cardBg: string): CSSProperties {
  return { background: cardBg }
}

export function tavlingLiveDotGlowStyle(): CSSProperties {
  return { boxShadow: `0 0 5px ${GOLD}` }
}

export function tavlingCardTheme(
  status: TavlingStatus,
  dark: boolean,
): {
  accentBar: string
  cardBg: string
  cardBorder: string
} {
  const isPagaende = status === 'pagaende'
  const isDone = status === 'avslutad'

  const accentBar = isPagaende
    ? `linear-gradient(90deg,${GOLD},rgba(245,194,0,0.15))`
    : isDone
      ? `linear-gradient(90deg,${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'},transparent)`
      : 'linear-gradient(90deg,#f5c200,rgba(245,194,0,0.15))'

  const cardBg = isPagaende
    ? dark
      ? 'rgba(245,194,0,0.07)'
      : 'rgba(245,194,0,0.04)'
    : isDone
      ? 'transparent'
      : dark
        ? 'rgba(245,194,0,0.05)'
        : 'rgba(245,194,0,0.03)'

  const cardBorder = isPagaende
    ? 'rgba(245,194,0,0.25)'
    : isDone
      ? dark
        ? 'rgba(255,255,255,0.07)'
        : 'rgba(0,0,0,0.07)'
      : dark
        ? 'rgba(245,194,0,0.15)'
        : 'rgba(245,194,0,0.2)'

  return { accentBar, cardBg, cardBorder }
}
