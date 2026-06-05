import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  rounded?: string
}

/**
 * Floating glass pill (nav buttons). Children render above glass layers.
 */
export function GlassPill({
  children,
  className,
  rounded = 'rounded-[22px]',
  ...props
}: Props) {
  return (
    <div className={cn('relative', className)} {...props}>
      <div className={cn('bk-glass', rounded)} aria-hidden />
      <div className={cn('bk-glass-rim', rounded)} aria-hidden />
      <div className="relative z-[1] flex size-full items-center">{children}</div>
    </div>
  )
}
