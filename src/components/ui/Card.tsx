import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Props = {
  children: ReactNode
  className?: string
}

/** Standard content card — light/dark surfaces from design tokens. */
export function Card({ children, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-light-border bg-light-card',
        'dark:border-dark-border dark:bg-dark-card',
        className,
      )}
    >
      {children}
    </div>
  )
}
