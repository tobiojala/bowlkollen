/** Remotion PlayerShareCard (1080×1080) layout and dynamic style helpers. */

import type { CSSProperties } from 'react'

export const SHARE_CARD_SIZE = 1080

export const SHARE_CARD_LAYOUT = {
  cardW: 420,
  cardH: 630,
  cardX: (SHARE_CARD_SIZE - 420) / 2,
  cardY: 140,
} as const

export function shareCardRootStyle(): CSSProperties {
  return { fontFamily: 'system-ui, sans-serif' }
}

export function shareCardBgStyle(opacity: number): CSSProperties {
  return {
    opacity,
    background: 'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(20,30,55,1) 0%, #070d16 100%)',
  }
}

export function shareCardGridStyle(opacity: number): CSSProperties {
  return {
    opacity: opacity * 0.18,
    backgroundImage:
      'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
    backgroundSize: '54px 54px',
  }
}

export function shareCardTierGlowStyle(opts: {
  cardX: number
  cardY: number
  cardW: number
  cardH: number
  tierGlow: string
  glowSize: number
  cardOpacity: number
}): CSSProperties {
  const { cardX, cardY, cardW, cardH, tierGlow, glowSize, cardOpacity } = opts
  return {
    position: 'absolute',
    left: cardX + cardW / 2 - 200,
    top: cardY + cardH / 2 - 200,
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: tierGlow,
    filter: `blur(${glowSize}px)`,
    opacity: cardOpacity * 0.9,
  }
}

export function shareCardFrameStyle(opts: {
  cardX: number
  cardY: number
  cardW: number
  cardH: number
  cardScale: number
  cardOpacity: number
  tierAccent: string
  tierGlow: string
}): CSSProperties {
  const { cardX, cardY, cardW, cardH, cardScale, cardOpacity, tierAccent, tierGlow } = opts
  return {
    position: 'absolute',
    left: cardX,
    top: cardY,
    width: cardW,
    height: cardH,
    transform: `scale(${cardScale})`,
    transformOrigin: 'center center',
    opacity: cardOpacity,
    borderRadius: 28,
    overflow: 'hidden',
    background: 'linear-gradient(160deg, #1a1400 0%, #0d1118 60%, #1a0a00 100%)',
    border: `2.5px solid ${tierAccent}`,
    boxShadow: `inset 0 0 60px ${tierGlow}, 0 0 60px ${tierGlow}`,
  }
}

export function shareCardAvatarImgStyle(): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 10%',
  }
}

export function shareCardInitialsWrapStyle(): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 160,
  }
}

export function shareCardInitialsCircleStyle(
  tierBg: string,
  tierAccent: string,
): CSSProperties {
  return {
    width: 160,
    height: 160,
    borderRadius: '50%',
    background: tierBg,
    border: `3px solid ${tierAccent}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 56,
    fontWeight: 900,
    color: tierAccent,
  }
}

export function shareCardVignetteStyle(): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.70) 62%, rgba(0,0,0,0.97) 100%)',
  }
}

export function shareCardShimmerStyle(
  shimmerX: number,
  shimmerOpacity: number,
  tierAccent: string,
): CSSProperties {
  return {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: shimmerX,
    width: 120,
    background: `linear-gradient(90deg, transparent, ${tierAccent}aa, transparent)`,
    opacity: shimmerOpacity,
    transform: 'skewX(-12deg)',
  }
}

export function shareCardInnerBorderStyle(
  tierAccent: string,
  tierGlow: string,
): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    borderRadius: 28,
    border: `2px solid ${tierAccent}`,
    boxShadow: `inset 0 0 40px ${tierGlow}`,
    pointerEvents: 'none',
  }
}

export function shareCardTopRowStyle(): CSSProperties {
  return {
    position: 'absolute',
    top: 18,
    left: 20,
    right: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
}

export function shareCardTierBadgeStyle(tierBg: string, tierAccent: string): CSSProperties {
  return {
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: 2,
    padding: '5px 16px',
    borderRadius: 30,
    background: tierBg,
    border: `1px solid ${tierAccent}`,
    color: tierAccent,
  }
}

export function shareCardSeasonStyle(): CSSProperties {
  return {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
    fontWeight: 600,
  }
}

export function shareCardBottomPanelStyle(): CSSProperties {
  return {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '20px 22px 24px',
    background: 'rgba(0,0,0,0.80)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(255,255,255,0.10)',
  }
}

export function shareCardNameStyle(): CSSProperties {
  return {
    fontSize: 30,
    fontWeight: 900,
    color: '#fff',
    letterSpacing: 0.2,
    lineHeight: 1.1,
  }
}

export function shareCardTeamStyle(tierAccent: string): CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 700,
    color: tierAccent,
    letterSpacing: 2,
    marginTop: 3,
    textTransform: 'uppercase',
  }
}

export function shareCardStatGridStyle(): CSSProperties {
  return { display: 'flex', gap: 8, marginTop: 14 }
}

export function shareCardStatBoxStyle(): CSSProperties {
  return {
    flex: 1,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '10px 4px',
    textAlign: 'center',
    border: '0.5px solid rgba(255,255,255,0.12)',
  }
}

export function shareCardStatValueStyle(): CSSProperties {
  return { fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1 }
}

export function shareCardStatLabelStyle(): CSSProperties {
  return {
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 4,
    letterSpacing: 1.2,
  }
}

export function shareCardFooterRowStyle(): CSSProperties {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  }
}

export function shareCardStarsStyle(tierAccent: string): CSSProperties {
  return { fontSize: 18, letterSpacing: 2, color: tierAccent }
}

export function shareCardRatingStyle(tierAccent: string): CSSProperties {
  return {
    fontSize: 11,
    color: tierAccent,
    fontWeight: 700,
    marginTop: 2,
    letterSpacing: 1,
  }
}

export function shareCardRarityStyle(): CSSProperties {
  return { fontSize: 11, color: 'rgba(255,255,255,0.40)', letterSpacing: 1 }
}

export function shareCardSerialStyle(): CSSProperties {
  return {
    fontSize: 9,
    color: 'rgba(255,255,255,0.22)',
    letterSpacing: 2,
    marginTop: 2,
  }
}

export function shareCardRarityColStyle(): CSSProperties {
  return { textAlign: 'right' }
}

export function shareCardBrandingWrapStyle(cardY: number, bgOpacity: number): CSSProperties {
  return {
    position: 'absolute',
    top: cardY - 80,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    opacity: bgOpacity,
  }
}

export function shareCardBrandingTextStyle(): CSSProperties {
  return { fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: -1 }
}

export function shareCardBrandingGoldStyle(): CSSProperties {
  return { color: '#f5c200' }
}

export function shareCardBottomCtaStyle(textY: number, textOpacity: number): CSSProperties {
  return {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    textAlign: 'center',
    transform: `translateY(${textY}px)`,
    opacity: textOpacity,
  }
}

export function shareCardBottomCtaTextStyle(): CSSProperties {
  return {
    fontSize: 14,
    color: 'rgba(255,255,255,0.30)',
    letterSpacing: 3,
    fontWeight: 600,
  }
}
