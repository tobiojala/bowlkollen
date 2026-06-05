'use client'

import Link from 'next/link'
import { cn } from '@/lib/cn'
import { shortName, shortDiv, countdown, dayDotColor } from '@/lib/utils'
import { homeNoTapHighlight, homeSolidBgStyle } from '@/lib/home-ui'

type Match = {
  id: string; date: string; status: string; division: string
  home_score: number | null; away_score: number | null
  home: { id: string; name: string }; away: { id: string; name: string }
}

type Props = { m: Match; now: number }

/** Example Tailwind migration — copy this pattern for other list rows. */
export default function MatchRow({ m, now }: Props) {
  const dayColor = dayDotColor(m.date.slice(0, 10))
  const hasScore = m.home_score !== null
  const homeWin  = hasScore && m.home_score! > m.away_score!
  const awayWin  = hasScore && m.away_score! > m.home_score!

  return (
    <Link
      href={`/matches/${m.id}`}
      className={cn(
        'flex items-stretch overflow-hidden no-underline',
        'hover:bg-light-card dark:hover:bg-dark-card',
        homeNoTapHighlight,
      )}
    >
      <div className="w-[3px] shrink-0 opacity-70" style={homeSolidBgStyle(dayColor)} />
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-3.5">
        <div
          className={cn(
            'min-w-0 flex-1 truncate text-right text-[15px]',
            homeWin ? 'font-bold bk-text-primary' : hasScore ? 'font-normal text-dark-muted' : 'bk-text-primary',
          )}
        >
          {shortName(m.home?.name || '')}
        </div>

        <div className="flex w-[72px] shrink-0 flex-col items-center text-center">
          {hasScore ? (
            <>
              <div className="flex items-center justify-center gap-1">
                <span className={cn('text-[17px] font-black tabular-nums', homeWin ? 'text-gold' : 'text-dark-muted')}>
                  {m.home_score}
                </span>
                <span className="text-[11px] font-light text-dark-muted">–</span>
                <span className={cn('text-[17px] font-black tabular-nums', awayWin ? 'text-gold' : 'text-dark-muted')}>
                  {m.away_score}
                </span>
              </div>
              <div className="mt-0.5 text-[9px] tracking-wide text-dark-muted">{shortDiv(m.division)}</div>
            </>
          ) : (() => {
            const cd = countdown(m.date, now)
            const timeStr = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
            return (
              <>
                {cd
                  ? <div className="text-sm leading-none font-extrabold text-gold tabular-nums">{cd}</div>
                  : <div className="text-xs text-dark-muted">{timeStr || 'vs'}</div>
                }
                <div className="mt-0.5 text-[9px] tracking-wide text-dark-muted">{shortDiv(m.division)}</div>
              </>
            )
          })()}
        </div>

        <div
          className={cn(
            'min-w-0 flex-1 truncate text-[15px]',
            awayWin ? 'font-bold bk-text-primary' : hasScore ? 'font-normal text-dark-muted' : 'bk-text-primary',
          )}
        >
          {shortName(m.away?.name || '')}
        </div>
      </div>
    </Link>
  )
}
