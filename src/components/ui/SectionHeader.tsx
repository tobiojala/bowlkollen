import { cn } from '@/lib/cn'

type Props = {
  label: string
  sub?: string
  className?: string
}

/** Gold dot + uppercase section label (used on home, league, etc.). */
export function SectionHeader({ label, sub, className }: Props) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 border-b border-light-border px-4 py-3',
        'dark:border-dark-border',
        className,
      )}
    >
      <div className="h-2 w-2 shrink-0 rounded-sm bg-gold" />
      <span className="text-[10px] font-extrabold tracking-widest text-dark-muted uppercase">
        {label}
      </span>
      {sub ? <span className="text-[9px] text-dark-muted">{sub}</span> : null}
    </div>
  )
}
