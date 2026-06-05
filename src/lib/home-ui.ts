import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'

/** Shared tap-highlight reset — use on links/buttons across the app. */
export const homeNoTapHighlight = '[-webkit-tap-highlight-color:transparent]'

export function homeSolidBgStyle(color: string): CSSProperties {
  return { background: color }
}

export function homeDivisionChipColorStyle(color: string): CSSProperties {
  return { color }
}

export function miniStandingsZoneColor(rank: number): string {
  if (rank <= 2) return '#f5c200'
  if (rank <= 6) return '#38a088'
  return 'rgba(0,0,0,0.1)'
}

export function miniStandingsZoneBarStyle(color: string): CSSProperties {
  return { background: color }
}

export function miniStandingsRankStyle(color: string): CSSProperties {
  return { color }
}

export function homeHeroSlideBgStyle(bg: string): CSSProperties {
  return { background: bg }
}

export function homeStaggerDelayStyle(index: number, stepMs = 35): CSSProperties {
  return { animationDelay: `${index * stepMs}ms` }
}

export function homeProfileScoreBarStyle(
  height: number,
  barColor: string | undefined,
  dimmed: boolean,
): CSSProperties {
  return {
    height,
    background: barColor,
    opacity: dimmed ? 0.7 : 1,
  }
}

export function homeSkeletonMaxWidthStyle(pct: number): CSSProperties {
  return { maxWidth: `${pct}%` }
}

export const homeDivisionChip = cn(
  'ml-auto rounded px-2 py-0.75 text-[9px] font-bold tracking-wide bg-black/6',
)

export const homeHeroTopBarLive = 'h-[3px] bg-linear-to-r from-gold to-gold/25'
export const homeHeroTopBarUpcoming = 'h-[3px] bg-linear-to-r from-[#5a82b4] to-[#5a82b4]/25'

export function homeHeroModeTabClass(active: boolean, mode: 'live' | 'upcoming') {
  return cn(
    'flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5',
    !active && 'border-light-border bg-black/4 dark:border-dark-border dark:bg-white/5',
    active &&
      mode === 'live' &&
      'border-transparent bg-gold/12 outline outline-gold/40',
    active &&
      mode === 'upcoming' &&
      'border-transparent bg-[#5a82b4]/12 outline outline-[#5a82b4]/40',
  )
}

export function homeHeroModeLabelClass(active: boolean, mode: 'live' | 'upcoming') {
  return cn(
    'text-[10px] font-extrabold tracking-wide',
    !active && 'text-dark-muted',
    active && mode === 'live' && 'text-gold',
    active && mode === 'upcoming' && 'text-[#5a82b4]',
  )
}

export function homeHeroModeCountClass(active: boolean, mode: 'live' | 'upcoming') {
  return cn(
    'rounded-lg px-1.5 py-px text-[9px] font-bold',
    !active && 'text-dark-muted',
    active && mode === 'live' && 'bg-gold/18 text-gold',
    active && mode === 'upcoming' && 'bg-[#5a82b4]/18 text-[#5a82b4]',
  )
}

export const homePulsDivisionChip = cn(
  'rounded px-2 py-0.75 text-[9px] font-bold tracking-wide bg-black/6',
)

export function homePulsTopBarStyle(color: string): CSSProperties {
  return { background: `linear-gradient(90deg,${color},${color}30)` }
}

export type ZoneTone = 'top' | 'mid' | 'bot'

export function teamZoneTone(inTopZone: boolean, inBotZone: boolean): ZoneTone {
  if (inTopZone) return 'top'
  if (inBotZone) return 'bot'
  return 'mid'
}

export function teamZoneAccent(tone: ZoneTone): string {
  if (tone === 'top') return '#f5c200'
  if (tone === 'bot') return '#e05555'
  return '#38a088'
}

export function teamZoneTopBarStyle(accent: string): CSSProperties {
  return { background: `linear-gradient(90deg,${accent},${accent}20)` }
}

export function teamZoneAccentStyle(accent: string): CSSProperties {
  return { color: accent }
}

export function teamZoneGradientBarStyle(
  topZoneRank: number,
  total: number,
  botZoneRank: number,
): CSSProperties {
  const topPct = (topZoneRank / total) * 100
  const botPct = ((botZoneRank - 1) / total) * 100
  return {
    background: `linear-gradient(90deg, #f5c200 0%, #f5c200 ${topPct}%, #38a088 ${topPct}%, #38a088 ${botPct}%, #e05555 ${botPct}%, #e05555 100%)`,
  }
}

export function teamZoneDotStyle(accent: string, dotPct: number): CSSProperties {
  return {
    left: `calc(${dotPct}% - 7px)`,
    background: accent,
    boxShadow: `0 0 8px ${accent}60`,
  }
}

export function teamZoneProgressWidth(pct: number): CSSProperties {
  return { width: `${pct}%` }
}

export function teamZoneRelegationBarStyle(
  toBotZone: number,
  widthPct: number,
): CSSProperties {
  return {
    width: `${widthPct}%`,
    ...(toBotZone <= 3 ? { background: '#e05555' } : {}),
  }
}
