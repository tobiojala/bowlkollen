import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'

export const homeNoTapHighlight = '[-webkit-tap-highlight-color:transparent]'

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
