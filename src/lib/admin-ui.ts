import { cn } from '@/lib/cn'

export const adminInputClass = cn(
  'w-full rounded-lg border border-light-border bg-light-surface px-3 py-2.5 text-sm outline-none',
  'text-light-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text',
)

export const adminLabelClass =
  'mb-1.5 block text-[11px] font-bold tracking-wide text-dark-muted uppercase'

export const adminCardClass = cn(
  'rounded-[14px] border border-light-border bg-light-card p-6',
  'dark:border-dark-border dark:bg-dark-card',
)

export const adminSurfaceCardClass = cn(
  'rounded-lg border border-light-border bg-light-surface p-3.5',
  'dark:border-dark-border dark:bg-dark-surface',
)

export const adminSectionTitleClass = 'mb-4 text-[13px] font-bold tracking-wide text-gold'

export const adminPrimaryBtnClass =
  'cursor-pointer rounded-lg border-0 bg-gold px-5 py-2.75 text-sm font-extrabold text-[#1a1400] disabled:opacity-60'

export const adminGhostBtnClass = cn(
  'cursor-pointer rounded-lg border border-light-border bg-light-surface px-3.5 py-1.5 text-xs text-dark-muted',
  'dark:border-dark-border dark:bg-dark-surface',
)

export const adminIconBtnClass = cn(
  'cursor-pointer whitespace-nowrap rounded-lg border-0 bg-gold px-3 py-1.75 text-xs font-bold text-[#1a1400]',
)

export function adminFlashClass(isError: boolean) {
  return cn(
    'mb-6 rounded-[10px] border px-4 py-3 text-[13px] font-semibold',
    isError
      ? 'border-[#ffaaaa] bg-[#fff0f0] text-[#e05555] dark:border-red-900 dark:bg-[#2a1212]'
      : 'border-[#aaffcc] bg-[#f0fff4] text-[#4caf7d] dark:border-green-900 dark:bg-[#122a1a]',
  )
}

export function adminTabClass(active: boolean, isLiveTab?: boolean) {
  return cn(
    'flex-1 cursor-pointer rounded-lg border px-2.25 py-2.25 text-xs font-bold',
    active
      ? cn(
          'border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card',
          isLiveTab ? 'text-[#e05555]' : 'text-gold',
        )
      : 'border-transparent bg-transparent text-dark-muted',
  )
}

export function adminStatusChipClass(status: string, active: boolean) {
  return cn(
    'cursor-pointer rounded-md border px-3 py-1 text-[11px] font-bold',
    active
      ? 'border-gold/30 bg-gold text-[#1a1400]'
      : 'border-light-border bg-light-surface text-dark-muted dark:border-dark-border dark:bg-dark-surface',
    status === 'live' && !active && 'text-[#4caf7d]',
  )
}

export function adminMatchStatusBadge(status: string) {
  if (status === 'live') {
    return 'rounded-md bg-[#e8f5ee] px-2 py-0.5 text-[10px] font-bold text-[#4caf7d] dark:bg-[#0a3a1a]'
  }
  if (status === 'completed') {
    return 'rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-bold text-dark-muted dark:bg-white/5'
  }
  return 'rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-bold text-dark-muted dark:bg-white/5'
}
