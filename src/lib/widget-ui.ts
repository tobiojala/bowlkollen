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
