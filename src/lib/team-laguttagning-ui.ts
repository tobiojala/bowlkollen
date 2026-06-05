import { cn } from '@/lib/cn'

export type LineupTier = {
  label: string
  color: string
  bg: string
  border: string
  textColor: string
  cardBg: string
}

export function calcLineupRating(
  avg: number,
  best: number,
  over200: number,
  hasData: boolean,
): number {
  if (!hasData) return Math.min(55, Math.round(avg * 0.3))
  return Math.min(99, Math.round(avg * 0.4 + (best / 4 / 10) * 0.4 + over200 * 1.5))
}

export function getLineupTier(rating: number): LineupTier {
  if (rating >= 95) {
    return {
      label: 'LEGEND',
      color: '#f5c200',
      bg: 'rgba(245,194,0,0.12)',
      border: '#c9960a',
      textColor: '#f5c200',
      cardBg: 'linear-gradient(160deg,#1a1608 0%,#0d1520 100%)',
    }
  }
  if (rating >= 85) {
    return {
      label: 'ELITE',
      color: '#afa9ec',
      bg: 'rgba(127,119,221,0.12)',
      border: '#7f77dd',
      textColor: '#afa9ec',
      cardBg: 'linear-gradient(160deg,#1c1640 0%,#0d1520 100%)',
    }
  }
  if (rating >= 75) {
    return {
      label: 'PRO',
      color: '#5dcaa5',
      bg: 'rgba(29,158,117,0.12)',
      border: '#1d9e75',
      textColor: '#5dcaa5',
      cardBg: 'linear-gradient(160deg,#0f1f1a 0%,#0d1520 100%)',
    }
  }
  if (rating >= 60) {
    return {
      label: 'VETERAN',
      color: '#ef9f27',
      bg: 'rgba(186,117,23,0.12)',
      border: '#ba7517',
      textColor: '#ef9f27',
      cardBg: 'linear-gradient(160deg,#1a1608 0%,#0d1520 100%)',
    }
  }
  return {
    label: 'ROOKIE',
    color: '#8899aa',
    bg: 'rgba(255,255,255,0.04)',
    border: '#2a3858',
    textColor: '#8899aa',
    cardBg: '#141e2e',
  }
}

export function lineupAvailabilityColor(av: string) {
  if (av === 'yes') return '#1d9e75'
  if (av === 'maybe') return '#f5c200'
  return '#e24b4a'
}

export function lineupFormDotClass(result: string) {
  if (result === 'V') return 'bg-[#1d9e75]'
  if (result === 'F') return 'bg-[#e24b4a]'
  return 'bg-dark-muted'
}

export const laguttagningPageRoot = cn(
  'pb-20 font-sans text-light-text dark:text-dark-text',
  'has-[[data-split=true]]:pb-0',
)

export const laguttagningHeader = cn(
  'border-b border-light-border px-5 pb-3.5 pt-4',
  'bg-[#e8f0f8] dark:border-dark-border dark:bg-[#0d1a2e]',
)

export const laguttagningBackLink = cn(
  'mb-3 flex items-center gap-1 text-xs text-dark-muted no-underline',
)

export const laguttagningEyebrow = cn(
  'mb-1 text-[11px] font-bold tracking-widest text-dark-muted',
)

export const laguttagningTitle = 'text-lg font-extrabold'

export const laguttagningMeta = 'mt-0.5 text-xs text-dark-muted'

export const laguttagningRatingBox = cn(
  'rounded-xl border border-light-border bg-light-card px-3.5 py-2 text-center',
  'dark:border-dark-border dark:bg-dark-card',
)

export const laguttagningRatingValue = 'text-[22px] font-black text-gold'

export const laguttagningRatingLabel = 'text-[9px] tracking-wide text-dark-muted'

export const laguttagningPublishedBadge = cn(
  'mt-2 inline-block rounded-md px-2.5 py-0.5 text-[11px] font-bold',
  'bg-[rgba(29,158,117,0.15)] text-[#5dcaa5]',
)

export const laguttagningAvailStrip = cn(
  'border-b border-light-border px-5 py-2.5',
  'bg-[#e8f0f8] dark:border-dark-border dark:bg-[#0d1a2e]',
)

export const laguttagningBordCard = cn(
  'mb-2.5 overflow-hidden rounded-[14px] border border-light-border',
  'bg-light-card dark:border-dark-border dark:bg-dark-card',
)

export const laguttagningBordHeader = cn(
  'flex items-center justify-between border-b border-light-border px-3.5 py-[7px]',
  'bg-gold/6 dark:border-dark-border dark:bg-gold/5',
)

export const laguttagningBordLabel = 'text-[11px] font-extrabold tracking-widest text-gold'

export const laguttagningReserveHeader = cn(
  'border-b border-light-border px-3.5 py-[7px] bg-black/[0.02] dark:border-dark-border dark:bg-white/[0.02]',
)

export const laguttagningReserveLabel = 'text-[11px] font-extrabold tracking-widest text-dark-muted'

export const laguttagningGridSplit = 'grid grid-cols-2'

export const laguttagningGridBorderR = 'border-r border-light-border dark:border-dark-border'

export function laguttagningSlotRow(active: boolean, compact?: boolean) {
  return cn(
    'flex cursor-pointer items-center gap-2 transition-colors',
    compact ? 'min-h-11 px-2.5 py-2' : 'min-h-[54px] px-3.5 py-[11px]',
    'border-b border-[#e8f0f8] dark:border-[#1c2840]',
    active && 'bg-gold/4 dark:bg-gold/6',
  )
}

export function laguttagningEmptySlot(active: boolean) {
  return cn(
    'flex shrink-0 items-center justify-center rounded-full border border-dashed',
    'text-base leading-none',
    active ? 'border-gold text-gold' : 'border-light-border text-dark-muted dark:border-dark-border',
  )
}

export const laguttagningDraftBtn = cn(
  'cursor-pointer rounded-xl border border-light-border bg-transparent px-3 py-3.5 text-[13px] font-bold text-dark-muted',
  'disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-border',
)

export const laguttagningPublishBtn = cn(
  'cursor-pointer rounded-xl border-none bg-gold px-3 py-3.5 text-[13px] font-extrabold text-[#1a1400]',
  'disabled:cursor-not-allowed disabled:opacity-60',
)

export const laguttagningSplitRoot = 'flex min-h-[400px] h-[calc(100vh-280px)]'

export const laguttagningSplitLeft = cn(
  'w-[45%] overflow-y-auto border-r border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-bg',
)

export const laguttagningSplitRight = cn(
  'flex-1 overflow-y-auto bg-[#f8fafc] p-2 dark:bg-[#141e2e]',
)

export const laguttagningSplitDone = cn(
  'cursor-pointer rounded-md border-none bg-gold px-2.5 py-0.5 text-[10px] font-bold text-[#1a1400]',
)

export function laguttagningMiniBordCard(active: boolean) {
  return cn(
    'mx-2 my-1 overflow-hidden rounded-[10px] border bg-light-card dark:bg-dark-card',
    active ? 'border-gold' : 'border-light-border dark:border-dark-border',
  )
}

export const laguttagningPlayerCard = cn(
  'relative cursor-pointer overflow-hidden rounded-[14px] border-[1.5px] transition-transform',
  'hover:enabled:scale-[1.02]',
)

export const laguttagningPlayerCardUsed = 'cursor-default opacity-35'

export const laguttagningDialWrap = 'mt-3'

export const laguttagningDialRow = 'mb-2.5 flex items-end justify-around'

export const laguttagningDialCell = 'text-center'

export const laguttagningDialRing = 'relative mx-auto'

export const laguttagningDialCenter = 'absolute inset-0 flex flex-col items-center justify-center'

export const laguttagningDialLabel = 'mt-1 text-[9px] tracking-wide text-dark-muted'

export const laguttagningDialFooter = cn(
  'border-t border-[#d0d8e8] pt-2 dark:border-[#1c2840]',
)

export const laguttagningDialAnalysis = 'text-xs text-[#534ab7] dark:text-[#afa9ec]'
