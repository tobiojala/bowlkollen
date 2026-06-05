'use client'

import Link from 'next/link'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'
import { playerMatchTotalStyle, type PlayerTier } from '@/lib/player-ui'

type Result = {
  id: string
  match_id: string
  games: number[]
  matches?: {
    date?: string
    home?: { name: string }
    away?: { name: string }
  }
}

type Props = {
  results: Result[]
  tier: PlayerTier
}

export function PlayerMatchLogTab({ results, tier }: Props) {
  if (results.length === 0) {
    return <p className="px-6 py-12 text-center text-[13px] text-dark-muted">Inga registrerade resultat ännu</p>
  }

  return (
    <div>
      {results.map(r => {
        const games = (r.games || []).filter((g: number) => g > 0)
        const total = games.reduce((a: number, b: number) => a + b, 0)
        const match = r.matches

        return (
          <Link
            key={r.id}
            href={`/matches/${r.match_id}`}
            className="flex items-center gap-3 border-b border-light-border px-5 py-3.5 no-underline transition-colors hover:bg-light-card dark:border-dark-border dark:hover:bg-dark-card"
          >
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 text-[13px] font-semibold bk-text-primary">
                {match?.home?.name ? shortName(match.home.name) : ''} vs{' '}
                {match?.away?.name ? shortName(match.away.name) : ''}
              </div>
              <div className="mb-2 text-[11px] text-dark-muted">{match?.date?.slice(0, 10) || ''}</div>
              <div className="flex flex-wrap items-center gap-1.5">
                {games.map((g: number, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        'tabular-nums',
                        g >= 250 && 'text-lg font-black text-white',
                        g >= 200 && g < 250 && 'text-base font-bold text-[#5a82b4]',
                        g < 200 && 'text-sm text-dark-muted',
                      )}
                      style={
                        g >= 250
                          ? { textShadow: '0 0 8px rgba(0,240,255,0.5)' }
                          : undefined
                      }
                    >
                      {g}
                    </span>
                    {i < games.length - 1 && (
                      <span className="text-[13px] text-light-border dark:text-dark-border">|</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div
                className="text-[22px] font-black leading-none tabular-nums"
                style={playerMatchTotalStyle(total, tier)}
              >
                {total}
              </div>
              <div className="mt-0.5 text-[9px] tracking-wide text-dark-muted">TOTALT</div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
