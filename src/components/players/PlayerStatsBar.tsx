import { cn } from '@/lib/cn'
import type { PlayerTier } from '@/lib/player-ui'

type Stat = { label: string; value: number; color: string }

type Props = {
  stats: Stat[]
  tier: PlayerTier
}

export function PlayerStatsBar({ stats, tier }: Props) {
  return (
    <div className="mt-4 grid grid-cols-4 border-y border-light-border dark:border-dark-border">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            'px-1 py-3.5 text-center',
            i < 3 && 'border-r border-light-border dark:border-dark-border',
            i === 3 && 'bg-transparent',
          )}
          style={i === 3 ? { background: tier.bg } : undefined}
        >
          <div
            className={cn(
              'font-black leading-none tabular-nums',
              i === 3 ? 'text-xl' : 'text-[22px]',
            )}
            style={{ color: s.color }}
          >
            {s.value || '—'}
          </div>
          <div className="mt-1 text-[8px] tracking-wide text-dark-muted">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
