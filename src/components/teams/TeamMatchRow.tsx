'use client'

import Link from 'next/link'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'
import { teamColors, teamDivisionColor } from '@/lib/team-ui'

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
  match: Match
  isHome: boolean
  dark: boolean
}

export function TeamMatchRow({ match: m, isHome: home, dark }: Props) {
  const teamScore = home ? m.home_score : m.away_score
  const oppScore = home ? m.away_score : m.home_score
  const opp = home ? m.away : m.home
  const won = teamScore !== null && oppScore !== null && teamScore > oppScore
  const lost = teamScore !== null && oppScore !== null && teamScore < oppScore
  const drew = teamScore !== null && oppScore !== null && teamScore === oppScore
  const { accent: oppTc, bg: oppTclo } = teamColors(opp?.name || '', dark)
  const resultLabel = won ? 'V' : lost ? 'F' : drew ? 'O' : null
  const resultColor = won ? '#38a088' : lost ? '#e05555' : '#6b7a99'
  const isLive = m.status === 'live'
  const divC = teamDivisionColor(m.division)

  return (
    <Link
      href={`/matches/${m.id}`}
      className="flex items-center gap-3 border-b border-light-border px-5 py-3 no-underline transition-colors hover:bg-light-card dark:border-dark-border dark:hover:bg-dark-card"
    >
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold',
          !resultLabel && 'border border-light-border bg-light-card text-dark-muted dark:border-dark-border dark:bg-dark-card',
        )}
        style={
          resultLabel
            ? {
                background: `${resultColor}22`,
                border: `1.5px solid ${resultColor}`,
                color: resultColor,
              }
            : undefined
        }
      >
        {isLive ? '●' : resultLabel || '—'}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] text-[8px] font-extrabold"
          style={{ background: oppTclo, border: `1.5px solid ${oppTc}`, color: oppTc }}
        >
          {shortName(opp?.name || '')
            .split(' ')
            .map(w => w[0])
            .join('')
            .slice(0, 3)
            .toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold bk-text-primary">{shortName(opp?.name || '')}</div>
          <div className="mt-0.5 flex items-center gap-1">
            <span className="text-[10px] text-dark-muted">
              {home ? 'Hemma' : 'Borta'} · {m.date?.slice(0, 10)}
            </span>
            {m.division && (
              <span
                className="rounded px-[5px] py-px text-[9px] font-bold"
                style={{ color: divC, background: `${divC}18` }}
              >
                {m.division.replace(' Herrar', ' H').replace(' Damer', ' D')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 text-right">
        {teamScore !== null ? (
          <>
            <div className={cn('text-base font-extrabold tabular-nums', won && 'text-gold')}>
              {teamScore} - {oppScore}
            </div>
            <div className="text-[9px] text-dark-muted">MP</div>
          </>
        ) : (
          <div
            className={cn(
              'text-[11px]',
              isLive ? 'font-bold text-red' : 'text-dark-muted',
            )}
          >
            {isLive
              ? '● LIVE'
              : m.date
                ? new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
                : '—'}
          </div>
        )}
      </div>
    </Link>
  )
}
