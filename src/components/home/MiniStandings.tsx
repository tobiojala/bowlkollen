'use client'

import Link from 'next/link'
import { shortName } from '@/lib/utils'
import { cn } from '@/lib/cn'
import {
  homeNoTapHighlight,
  miniStandingsRankStyle,
  miniStandingsZoneBarStyle,
  miniStandingsZoneColor,
} from '@/lib/home-ui'

type TableRow = {
  rank: number
  teamId: string
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  points: number
}

type Props = {
  tableRows: TableRow[]
  tableDiv: 'Elitserien Herrar' | 'Elitserien Damer'
  setTableDiv: (d: 'Elitserien Herrar' | 'Elitserien Damer') => void
  followedIds: Set<string>
}

export default function MiniStandings({ tableRows, tableDiv, setTableDiv, followedIds }: Props) {
  return (
    <div className="px-4 pt-4">
      <div className="mb-2.5 flex items-center">
        <span className="flex-1 text-[10px] font-extrabold tracking-widest text-dark-muted">
          LIGATABELL
        </span>
        {(['Elitserien Herrar', 'Elitserien Damer'] as const).map(div => {
          const isActive = tableDiv === div
          return (
            <button
              key={div}
              type="button"
              onClick={() => setTableDiv(div)}
              className={cn(
                'ml-1.5 cursor-pointer rounded-lg border-none px-2.5 py-1 text-[9px] font-bold',
                isActive
                  ? 'bg-gold text-[#1a1400]'
                  : 'bg-black/6 text-dark-muted dark:bg-white/8',
                homeNoTapHighlight,
              )}
            >
              {div === 'Elitserien Herrar' ? 'Elit H' : 'Elit D'}
            </button>
          )
        })}
      </div>

      {tableRows.length === 0 ? (
        <div
          className={cn(
            'rounded-[14px] border px-6 py-6 text-center text-xs text-dark-muted',
            'border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card',
          )}
        >
          Inga resultat ännu — matcher läggs till via Admin
        </div>
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-light-border dark:border-dark-border">
          <div className="flex items-center border-b border-light-border bg-black/[0.02] dark:border-dark-border dark:bg-white/[0.02]">
            <div className="w-[3px] shrink-0" />
            <div className="grid flex-1 grid-cols-[28px_1fr_26px_34px] px-3 py-[5px]">
              {(['#', 'Lag', 'M', 'MP'] as const).map((h, i) => (
                <span
                  key={h}
                  className={cn(
                    'text-[9px] font-bold text-dark-muted',
                    i >= 2 ? 'text-center' : 'text-left',
                  )}
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          {tableRows.slice(0, 5).map((row, i) => {
            const zc = miniStandingsZoneColor(row.rank)
            const isMyTeam = followedIds.has(row.teamId)
            const rankAccent = row.rank <= 6

            return (
              <Link
                key={row.teamId}
                href={`/teams/${row.teamId}`}
                className={cn(
                  'flex items-center no-underline transition-colors',
                  'hover:bg-light-card dark:hover:bg-dark-card',
                  i > 0 && 'border-t border-light-border dark:border-dark-border',
                  isMyTeam && 'bg-gold/[0.05] dark:bg-gold/[0.06]',
                  homeNoTapHighlight,
                )}
              >
                <div
                  className={cn(
                    'w-[3px] shrink-0 self-stretch',
                    row.rank > 6 && 'bg-black/10 dark:bg-white/12',
                  )}
                  style={row.rank <= 6 ? miniStandingsZoneBarStyle(zc) : undefined}
                />
                <div className="grid flex-1 grid-cols-[28px_1fr_26px_34px] items-center px-3 py-[9px]">
                  <span
                    className={cn(
                      'text-center text-[11px] font-bold',
                      !rankAccent && 'text-dark-muted',
                    )}
                    style={rankAccent ? miniStandingsRankStyle(zc) : undefined}
                  >
                    {row.rank}
                  </span>
                  <span
                    className={cn(
                      'truncate pr-1 text-[13px] bk-text-primary',
                      isMyTeam ? 'font-bold' : 'font-normal',
                    )}
                  >
                    {shortName(row.teamName)}
                  </span>
                  <span className="text-center text-[11px] text-dark-muted tabular-nums">
                    {row.played}
                  </span>
                  <span
                    className={cn(
                      'text-center text-[13px] font-extrabold tabular-nums',
                      row.rank <= 2 ? 'text-gold' : 'bk-text-primary',
                    )}
                  >
                    {row.points}
                  </span>
                </div>
              </Link>
            )
          })}

          <Link
            href="/league"
            className={cn(
              'flex items-center justify-center border-t px-3 py-[9px] text-[11px] font-semibold no-underline',
              'border-light-border bg-black/[0.015] text-dark-muted',
              'dark:border-dark-border dark:bg-white/[0.015]',
              homeNoTapHighlight,
            )}
          >
            Visa hela tabellen →
          </Link>
        </div>
      )}
    </div>
  )
}
