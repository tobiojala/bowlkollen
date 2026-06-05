import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'

/** Full collectible-card tier (holo, gradients) — not the simple profile tier in player-ui.ts */
export type PlayerCardTier = {
  label: string
  rarity: string
  accent: string
  cardBg: string
  panelBg: string
  borderColor: string
  glowColor: string
  holoColors: [string, string, string, string, string, string, string]
  shimmerColor: string
  tierGradient: string
  particles: boolean
  bg: string
  topBg: string
}

export function calcPlayerCardRating(
  avg: number,
  best: number,
  over200: number,
  hasData: boolean,
): number {
  if (!hasData) return Math.min(55, Math.round(avg * 0.3))
  return Math.min(99, Math.round(avg * 0.4 + (best / 4 / 10) * 0.4 + over200 * 1.5))
}

export function getPlayerCardTier(rating: number): PlayerCardTier {
  if (rating >= 95) {
    return {
      label: 'LEGEND',
      rarity: 'HOLO RARE ✦✦✦',
      accent: '#f5c200',
      cardBg: 'linear-gradient(160deg, #1a1400 0%, #0d1118 50%, #1a0a00 100%)',
      panelBg: 'rgba(0,0,0,0.72)',
      borderColor: 'rgba(245,194,0,0.80)',
      glowColor: 'rgba(245,194,0,0.40)',
      holoColors: ['255,0,0', '255,165,0', '255,255,0', '0,200,100', '0,100,255', '160,0,255', '255,0,180'],
      shimmerColor: 'rgba(255,220,80,0.70)',
      tierGradient: 'linear-gradient(90deg, #8a5e00, #f5c200, #ffd940, #f5c200, #8a5e00)',
      particles: true,
      bg: 'rgba(245,194,0,0.12)',
      topBg: 'linear-gradient(135deg,#1a1400,#0d1520)',
    }
  }
  if (rating >= 85) {
    return {
      label: 'ELITE',
      rarity: 'ULTRA RARE ✦✦',
      accent: '#b8a9f0',
      cardBg: 'linear-gradient(160deg, #140d30 0%, #0d1118 50%, #1a0d3a 100%)',
      panelBg: 'rgba(5,3,20,0.72)',
      borderColor: 'rgba(127,119,221,0.75)',
      glowColor: 'rgba(127,119,221,0.35)',
      holoColors: ['180,150,255', '120,80,240', '200,160,255', '100,60,220', '220,200,255', '80,40,200', '160,120,255'],
      shimmerColor: 'rgba(180,160,255,0.65)',
      tierGradient: 'linear-gradient(90deg, #2a1a70, #7f77dd, #a090ee, #7f77dd, #2a1a70)',
      particles: false,
      bg: 'rgba(127,119,221,0.12)',
      topBg: 'linear-gradient(135deg,#1c1640,#0d1520)',
    }
  }
  if (rating >= 75) {
    return {
      label: 'PRO',
      rarity: 'RARE ✦',
      accent: '#5dcaa5',
      cardBg: 'linear-gradient(160deg, #071a10 0%, #0d1118 50%, #091f14 100%)',
      panelBg: 'rgba(0,8,5,0.72)',
      borderColor: 'rgba(29,158,117,0.75)',
      glowColor: 'rgba(29,158,117,0.30)',
      holoColors: ['0,255,150', '0,200,100', '80,255,180', '0,170,80', '100,255,200', '0,140,70', '40,220,140'],
      shimmerColor: 'rgba(80,210,160,0.60)',
      tierGradient: 'linear-gradient(90deg, #0a4a30, #1d9e75, #30c490, #1d9e75, #0a4a30)',
      particles: false,
      bg: 'rgba(29,158,117,0.12)',
      topBg: 'linear-gradient(135deg,#0a1f16,#0d1520)',
    }
  }
  if (rating >= 60) {
    return {
      label: 'VETERAN',
      rarity: 'UNCOMMON',
      accent: '#ef9f27',
      cardBg: 'linear-gradient(160deg, #180e00 0%, #0d1118 50%, #1a0e00 100%)',
      panelBg: 'rgba(8,5,0,0.72)',
      borderColor: 'rgba(186,117,23,0.65)',
      glowColor: 'rgba(186,117,23,0.25)',
      holoColors: ['255,200,0', '240,150,0', '255,220,80', '200,120,0', '255,180,40', '180,100,0', '255,160,0'],
      shimmerColor: 'rgba(240,160,40,0.55)',
      tierGradient: 'linear-gradient(90deg, #5a3000, #ba7517, #e09020, #ba7517, #5a3000)',
      particles: false,
      bg: 'rgba(186,117,23,0.12)',
      topBg: 'linear-gradient(135deg,#1a1206,#0d1520)',
    }
  }
  return {
    label: 'ROOKIE',
    rarity: 'COMMON',
    accent: '#8899aa',
    cardBg: 'linear-gradient(160deg, #111820 0%, #0d1118 100%)',
    panelBg: 'rgba(0,3,8,0.72)',
    borderColor: 'rgba(100,120,160,0.45)',
    glowColor: 'rgba(100,120,160,0.15)',
    holoColors: ['180,200,220', '150,170,200', '200,215,230', '130,155,185', '210,220,235', '120,145,175', '190,205,225'],
    shimmerColor: 'rgba(180,200,220,0.45)',
    tierGradient: 'linear-gradient(90deg, #1a2535, #3d5070, #4a6080, #3d5070, #1a2535)',
    particles: false,
    bg: 'rgba(255,255,255,0.04)',
    topBg: 'linear-gradient(135deg,#141e2e,#0d1520)',
  }
}

export function playerCardStarDisplay(rating: number) {
  const s = Math.round(rating / 20)
  return { filled: s, empty: 5 - s }
}

export function buildPlayerCardHoloStyle(
  tier: PlayerCardTier,
  mousePos: { x: number; y: number },
  isHovered: boolean,
): CSSProperties {
  const mx = mousePos.x
  const my = mousePos.y
  const intensity = Math.min(1, Math.hypot(mx - 0.5, my - 0.5) * 2.6)
  const hc = tier.holoColors
  const angle = Math.round(mx * 120 + 30)

  return {
    position: 'absolute',
    inset: 0,
    borderRadius: 18,
    mixBlendMode: 'screen',
    opacity: isHovered ? 1 : 0.38,
    transition: 'opacity 200ms',
    pointerEvents: 'none',
    background: `
      radial-gradient(ellipse 75% 90% at ${Math.round(mx * 100)}% ${Math.round(my * 100)}%,
        rgba(${hc[0]}, ${(0.22 * intensity).toFixed(3)}),
        rgba(${hc[2]}, ${(0.17 * intensity).toFixed(3)}) 25%,
        rgba(${hc[4]}, ${(0.15 * intensity).toFixed(3)}) 50%,
        rgba(${hc[6]}, ${(0.12 * intensity).toFixed(3)}) 70%,
        transparent 85%
      ),
      repeating-linear-gradient(
        ${angle}deg,
        rgba(${hc[0]}, 0.045) 0%, rgba(${hc[1]}, 0.045) 7%,
        rgba(${hc[2]}, 0.045) 14%, rgba(${hc[3]}, 0.045) 21%,
        rgba(${hc[4]}, 0.045) 28%, rgba(${hc[5]}, 0.045) 35%,
        rgba(${hc[6]}, 0.045) 42%, rgba(${hc[0]}, 0.045) 49%
      )
    `,
  }
}

export const playerCardFace = 'relative h-[330px] w-[220px] overflow-hidden rounded-[18px]'

export const playerCardPhoto = 'absolute inset-0 h-full w-full object-cover object-[center_15%]'

export const playerCardPhotoPlaceholder = cn(
  'absolute inset-0 flex items-center justify-center pb-[100px]',
)

export const playerCardVignette = cn(
  'pointer-events-none absolute inset-0',
  'bg-[linear-gradient(to_bottom,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0)_28%,rgba(0,0,0,0.55)_62%,rgba(0,0,0,0.95)_100%)]',
)

export const playerCardShimmer = cn(
  'pointer-events-none absolute top-0 bottom-0 left-0 w-[26%]',
  'animate-[shimmerSweep_2s_ease-in-out_1_forwards]',
)

export const playerCardTopRow = 'absolute top-[11px] right-3 left-3 flex items-center justify-between'

export const playerCardSeason = cn(
  'text-[8px] font-semibold tracking-wide text-white/58',
  'drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]',
)

export const playerCardBottomPanel = cn(
  'absolute right-0 bottom-0 left-0 px-[13px] pt-3 pb-3.5',
  'border-t border-white/9 backdrop-blur-[14px]',
)

export const playerCardName = cn(
  'mb-0.5 text-[17px] leading-tight font-extrabold tracking-wide text-white',
  'drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]',
)

export const playerCardTeam = 'mb-2 text-[8px] font-bold tracking-widest uppercase'

export const playerCardStatGrid = 'mb-2 flex gap-1'

export const playerCardStatBox = cn(
  'flex-1 rounded-lg border border-white/11 bg-white/[0.07] px-0.5 py-[5px] text-center',
)

export const playerCardStatValue = 'text-sm leading-none font-bold tracking-tight text-white'

export const playerCardStatLabel = 'mt-0.5 text-[5.5px] tracking-wide text-white/48'

export const playerCardFooterRow = 'flex items-end justify-between'

export const playerCardStars = 'text-[11px] leading-none tracking-widest'

export const playerCardEmptyStars = 'text-white/12'

export const playerCardRatingLabel = 'mt-0.5 text-[6.5px] font-bold tracking-wide'

export const playerCardRarity = 'text-right text-[6.5px] font-semibold tracking-wide text-white/40'

export const playerCardSerial = 'mt-px text-[5.5px] tracking-widest text-white/22'

export const playerCardBack = cn(
  'relative flex h-[330px] w-[220px] flex-col overflow-hidden rounded-[18px] bg-[#0d1520]',
)

export const playerCardBackHeader = cn(
  'relative flex h-[76px] shrink-0 items-center justify-center overflow-hidden',
)

export const playerCardBackStripe = cn(
  'pointer-events-none absolute inset-0 opacity-10',
  'bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(255,255,255,0.12)_8px,rgba(255,255,255,0.12)_9px)]',
)

export const playerCardBackBody = 'flex flex-1 flex-col gap-[5px] overflow-hidden p-2.5'

export const playerCardBackSectionTitle = 'mb-[5px] text-[7px] font-bold tracking-widest'

export const playerCardBackStatRow = cn(
  'flex items-center justify-between border-b border-white/6 py-[2.5px]',
)

export const playerCardBackStatLabel = 'text-[9px] text-white/45'

export const playerCardBackStatValue = 'text-[10px] font-bold text-white'

export const playerCardBackFooter = cn(
  'flex shrink-0 items-center justify-between border-t border-white/8 px-3 pt-1.5 pb-2',
)

export const playerCardBackFooterText = 'text-[7px] tracking-wide text-white/25'

export const playerCardPerspective = cn(
  'h-[330px] w-[220px] cursor-pointer [-webkit-tap-highlight-color:transparent]',
)

export const playerCardFlipInner = 'relative h-full w-full [transform-style:preserve-3d] [will-change:transform]'

export const playerCardFaceHidden = cn(
  'absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]',
)

export const playerCardFaceBack = cn(playerCardFaceHidden, '[transform:rotateY(180deg)]')

export const playerCardExportHost = 'pointer-events-none absolute top-[-9999px] left-[-9999px]'

export function playerCardBgStyle(background: string): CSSProperties {
  return { background }
}

export function playerCardInitialsStyle(tier: PlayerCardTier): CSSProperties {
  const hc = tier.holoColors
  return {
    background: `rgba(${hc[0]}, 0.12)`,
    border: `2px solid ${tier.borderColor}`,
    color: tier.accent,
  }
}

export function playerCardShimmerGradientStyle(tier: PlayerCardTier): CSSProperties {
  return {
    background: `linear-gradient(90deg, transparent 0%, ${tier.shimmerColor} 50%, transparent 100%)`,
  }
}

export function playerCardInsetBorderStyle(tier: PlayerCardTier): CSSProperties {
  return {
    border: `1.5px solid ${tier.borderColor}`,
    boxShadow: `inset 0 0 28px ${tier.glowColor}, inset 0 1.5px 0 rgba(255,255,255,0.22)`,
  }
}

export function playerCardTierBadgeStyle(tier: PlayerCardTier): CSSProperties {
  return {
    background: tier.tierGradient,
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    boxShadow: `0 2px 8px ${tier.glowColor}`,
  }
}

type LegendParticle = { left: string; bottom: string; delay: string; size: number }

export function playerCardParticleStyle(
  tier: PlayerCardTier,
  p: LegendParticle,
  i: number,
): CSSProperties {
  return {
    left: p.left,
    bottom: p.bottom,
    width: p.size,
    height: p.size,
    background: tier.accent,
    animation: `${i % 2 === 0 ? 'particleRise' : 'particleRise2'} ${2 + i * 0.4}s ease-out infinite`,
    animationDelay: p.delay,
    boxShadow: `0 0 4px ${tier.accent}`,
  }
}

export function playerCardAccentStyle(tier: PlayerCardTier): CSSProperties {
  return { color: tier.accent }
}

export function playerCardPanelBgStyle(background: string): CSSProperties {
  return { background }
}

export function playerCardBackHeaderStyle(topBg: string): CSSProperties {
  return { background: topBg }
}

export function playerCardBackStripeStyle(borderColor: string): CSSProperties {
  return { background: borderColor }
}

export function playerCardBackSectionStyle(tier: PlayerCardTier): CSSProperties {
  return { background: tier.bg, borderColor: `${tier.borderColor}55` }
}

export function playerCardBackAchStyle(tier: PlayerCardTier): CSSProperties {
  return { background: tier.bg, color: tier.accent }
}

export function playerCardBackInsetStyle(tier: PlayerCardTier): CSSProperties {
  return {
    border: `1.5px solid ${tier.borderColor}`,
    boxShadow: `inset 0 0 25px ${tier.glowColor}`,
  }
}

export function playerCardDropShadowStyle(tier: PlayerCardTier): CSSProperties {
  return {
    filter: `drop-shadow(0 20px 36px rgba(0,0,0,0.55)) drop-shadow(0 4px 12px ${tier.glowColor})`,
  }
}

export function playerCardPerspectiveInlineStyle(): CSSProperties {
  return { perspective: 900 }
}

export function playerCardFlipTransformStyle(
  tx: number,
  ty: number,
  baseRotY: number,
  transition: string,
): CSSProperties {
  return {
    transform: `rotateX(${tx}deg) rotateY(${baseRotY + ty}deg)`,
    transition,
  }
}

export function playerCardSummaryStyle(tier: PlayerCardTier): CSSProperties {
  return { background: tier.bg, borderColor: `${tier.borderColor}44` }
}

export function playerCardShareBtnStyle(tier: PlayerCardTier): CSSProperties {
  return {
    background: tier.bg,
    borderColor: `${tier.borderColor}66`,
    color: tier.accent,
  }
}

export const LEGEND_PARTICLES = [
  { left: '14%', bottom: '42%', delay: '0s', size: 4 },
  { left: '78%', bottom: '56%', delay: '0.7s', size: 3 },
  { left: '52%', bottom: '50%', delay: '1.3s', size: 3.5 },
  { left: '24%', bottom: '62%', delay: '0.4s', size: 2.5 },
  { left: '68%', bottom: '44%', delay: '1.8s', size: 3 },
] as const
