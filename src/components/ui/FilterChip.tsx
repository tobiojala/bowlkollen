import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { homeNoTapHighlight } from '@/lib/home-ui'

type Props = {
  active: boolean
  onClick: () => void
  children: ReactNode
}

export function FilterChip({ active, onClick, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold',
        'transition-colors',
        active
          ? 'border-gold/50 bg-gold/10 text-gold'
          : 'border-light-border bg-light-card text-dark-muted dark:border-dark-border dark:bg-dark-card',
        homeNoTapHighlight,
      )}
    >
      {children}
    </button>
  )
}
