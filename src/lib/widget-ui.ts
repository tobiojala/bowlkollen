import { cn } from '@/lib/cn'

/** Default widget card chrome (legacy `base()`). */
export function widgetShell(className?: string) {
  return cn(
    'flex h-full flex-col overflow-hidden rounded-[20px] border p-3.5',
    'border-black/6 bg-white dark:border-white/7 dark:bg-white/[0.04]',
    className,
  )
}

export const widgetLink = 'no-underline'

export const widgetEyebrow = 'text-[9px] font-bold tracking-[1.5px]'
export const widgetEyebrowGold = cn(widgetEyebrow, 'text-gold')
export const widgetEyebrowMuted = cn(widgetEyebrow, 'text-dark-muted')
export const widgetEyebrowBlue = cn(widgetEyebrow, 'text-[#4a90d9]')
export const widgetEyebrowHeart = cn(widgetEyebrow, 'text-[#e05555]')

export const widgetEmpty = 'flex flex-1 items-center justify-center text-xs text-dark-muted'

/** Availability “yes” (legacy `C.green`). */
export const widgetYes = 'text-[#3d6090] dark:text-[#5a82b4]'
export const widgetNo = 'text-[#d63b3b] dark:text-[#e05555]'

export const widgetIconMuted = 'text-dark-muted'

export const widgetNoTapHighlight = '[-webkit-tap-highlight-color:transparent]'

export function widgetProgressWidthStyle(pct: number): import('react').CSSProperties {
  return { width: `${Math.max(5, Math.min(95, pct))}%` }
}

export function widgetOutcomeBadgeClass(won: boolean, drew: boolean) {
  if (won) return 'border-[#1d9e75] bg-[#1d9e75]/13 text-[#1d9e75]'
  if (drew) return 'border-gold bg-gold/13 text-gold'
  return 'border-[#e24b4a] bg-[#e24b4a]/13 text-[#e24b4a]'
}

export function widgetTierBorderClass(rating: number) {
  if (rating >= 95) return 'border-gold/20'
  if (rating >= 85) return 'border-[#afa9ec]/20'
  if (rating >= 75) return 'border-[#5dcaa5]/20'
  if (rating >= 60) return 'border-[#ef9f27]/20'
  return 'border-dark-muted/20'
}

export function widgetTierAccentClass(rating: number) {
  if (rating >= 95) return 'text-gold'
  if (rating >= 85) return 'text-[#afa9ec]'
  if (rating >= 75) return 'text-[#5dcaa5]'
  if (rating >= 60) return 'text-[#ef9f27]'
  return 'text-dark-muted'
}

export function widgetTierBadgeClass(rating: number) {
  const accent = widgetTierAccentClass(rating)
  if (rating >= 95) return cn(accent, 'bg-gold/13')
  if (rating >= 85) return cn(accent, 'bg-[#afa9ec]/13')
  if (rating >= 75) return cn(accent, 'bg-[#5dcaa5]/13')
  if (rating >= 60) return cn(accent, 'bg-[#ef9f27]/13')
  return cn(accent, 'bg-dark-muted/10')
}

export const widgetAvailBtnBase = cn(
  'flex-1 cursor-pointer rounded-[10px] border-[1.5px] py-2 text-xs font-bold',
  widgetNoTapHighlight,
)

export const widgetAvailYesBtn = cn(
  widgetAvailBtnBase,
  'border-[#3d6090]/27 bg-[#3d6090]/10 text-[#3d6090]',
  'dark:border-[#5a82b4]/27 dark:bg-[#5a82b4]/10 dark:text-[#5a82b4]',
)

export const widgetAvailMaybeBtn = cn(widgetAvailBtnBase, 'border-gold/27 bg-gold/10 text-gold')

export const widgetAvailNoBtn = cn(
  widgetAvailBtnBase,
  'border-[#d63b3b]/27 bg-[#d63b3b]/10 text-[#d63b3b]',
  'dark:border-[#e05555]/27 dark:bg-[#e05555]/10 dark:text-[#e05555]',
)

export const widgetMiniTeamBadge = cn(
  'flex shrink-0 items-center justify-center font-extrabold',
)

/** Team-colored mini badge (HSL from team name). */
export function widgetTeamBadgeStyle(tc: { bg: string; border: string; text: string }) {
  return {
    background: tc.bg,
    border: `1px solid ${tc.border}`,
    color: tc.text,
  } as const
}

export function widgetTeamBadgeBorder2(tc: { bg: string; border: string; text: string }) {
  return {
    background: tc.bg,
    border: `2px solid ${tc.border}`,
    color: tc.text,
  } as const
}
