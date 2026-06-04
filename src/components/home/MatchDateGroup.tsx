'use client'

import MatchRow from '@/components/home/MatchRow'
import { cn } from '@/lib/cn'
import { dayDotColor, dateLabel } from '@/lib/utils'

type Match = {
  id: string
  date: string
  status: string
  division: string
  home_score: number | null
  away_score: number | null
  home: { id: string; name: string }
  away: { id: string; name: string }
}

type Props = {
  date: string
  matches: Match[]
  now: number
  isExpanded: boolean
  limit: number
  onToggle: () => void
  squareDot?: boolean
}

export function MatchDateGroup({
  date,
  matches,
  now,
  isExpanded,
  limit,
  onToggle,
  squareDot,
}: Props) {
  const visible = isExpanded ? matches : matches.slice(0, limit)
  const hidden = matches.length - limit

  return (
    <div
      className={cn(
        'mb-3 overflow-hidden rounded-[14px] border',
        'border-light-border dark:border-dark-border',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 border-b px-3.5 py-2.5',
          'border-light-border bg-black/[0.02] dark:border-dark-border dark:bg-white/[0.025]',
        )}
      >
        <div
          className={cn('h-1.5 w-1.5 shrink-0', squareDot ? 'rounded-sm' : 'rounded-full')}
          style={{ background: dayDotColor(date) }}
        />
        <span className="text-[11px] font-bold bk-text-primary">{dateLabel(date)}</span>
        <span className="ml-0.5 text-[10px] text-dark-muted">· {matches.length} matcher</span>
      </div>

      {visible.map((m, i) => (
        <div
          key={m.id}
          className={cn(
            i > 0 && 'border-t border-light-border dark:border-dark-border',
          )}
        >
          <MatchRow m={m} now={now} />
        </div>
      ))}

      {hidden > 0 && (
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex w-full cursor-pointer items-center justify-center gap-1 border-0 border-t py-2.5',
            'border-light-border bg-transparent text-[11px] font-semibold text-dark-muted',
            'dark:border-dark-border',
          )}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {isExpanded ? '↑ Visa färre' : `Visa alla ${matches.length} matcher ↓`}
        </button>
      )}
    </div>
  )
}
