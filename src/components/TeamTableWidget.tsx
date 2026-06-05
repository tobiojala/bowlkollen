'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { shortName } from '@/lib/utils'
import { cn } from '@/lib/cn'
import { miniStandingsRankStyle, miniStandingsZoneBarStyle } from '@/lib/home-ui'

type Props = {
  teamId: string
  division: string
}

type Standing = {
  teamId: string
  teamName: string
  played: number
  wins: number
  draws: number
  losses: number
  points: number
  diff: number
  ptsFor: number
  ptsAgainst: number
}

export default function TeamTableWidget({ teamId, division }: Props) {
  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('teams').select('id, name'),
      supabase
        .from('matches')
        .select('home_team_id, away_team_id, home_score, away_score')
        .eq('division', division)
        .eq('status', 'completed')
        .not('home_score', 'is', null),
    ]).then(([{ data: teams }, { data: matches }]) => {
      if (!teams || !matches) return

      const teamMap: Record<string, string> = {}
      teams.forEach(t => {
        teamMap[t.id] = t.name
      })

      const table: Record<string, Standing> = {}
      const initTeam = (id: string) => {
        if (!table[id]) {
          table[id] = {
            teamId: id,
            teamName: teamMap[id] || '',
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            points: 0,
            diff: 0,
            ptsFor: 0,
            ptsAgainst: 0,
          }
        }
      }

      matches.forEach(m => {
        initTeam(m.home_team_id)
        initTeam(m.away_team_id)
        const h = table[m.home_team_id]
        const a = table[m.away_team_id]
        const hs = m.home_score!
        const as_ = m.away_score!
        h.played++
        a.played++
        h.ptsFor += hs
        h.ptsAgainst += as_
        a.ptsFor += as_
        a.ptsAgainst += hs
        if (hs > as_) {
          h.wins++
          h.points += 2
          a.losses++
        } else if (as_ > hs) {
          a.wins++
          a.points += 2
          h.losses++
        } else {
          h.draws++
          h.points++
          a.draws++
          a.points++
        }
      })

      const sorted = Object.values(table)
        .map(s => ({ ...s, diff: s.ptsFor - s.ptsAgainst }))
        .sort((a, b) => b.points - a.points || b.diff - a.diff || b.ptsFor - a.ptsFor)

      setStandings(sorted)
      setLoading(false)
    })
  }, [division])

  if (loading || standings.length === 0) return null

  const pos = standings.findIndex(s => s.teamId === teamId)
  if (pos === -1) return null

  const total = standings.length
  const team = standings[pos]
  const above = pos > 0 ? standings[pos - 1] : null
  const below = pos < total - 1 ? standings[pos + 1] : null

  const getZone = (i: number) => {
    if (i < 2) return { label: 'SM-slutspel', color: '#f5c200' }
    if (total <= 8 ? i < 4 : i < 6) return { label: 'Play-off', color: '#5a82b4' }
    if (i === total - 2) return { label: 'Kvalar', color: '#e05555' }
    if (i === total - 1) return { label: 'Nedflyttning', color: '#666666' }
    return null
  }

  const zone = getZone(pos)
  const showFrom = Math.max(0, pos - 2)
  const showTo = Math.min(total - 1, pos + 2)
  const visibleStandings = standings.slice(showFrom, showTo + 1)

  return (
    <div className="border-t border-light-border dark:border-dark-border">
      <div className="flex items-center justify-between px-5 pt-3.5 pb-2">
        <div className="text-[10px] font-extrabold tracking-[2px] text-dark-muted">
          TABELLPOSITION
        </div>
        <Link href="/league" className="text-[11px] font-semibold text-gold no-underline">
          Hela tabellen ›
        </Link>
      </div>

      <div className="flex items-center gap-4 px-5 pt-2 pb-3">
        <div className="min-w-[52px] text-center">
          <div
            className={cn('text-[36px] leading-none font-black', !zone && 'text-gold')}
            style={zone ? miniStandingsRankStyle(zone.color) : undefined}
          >
            {pos + 1}
          </div>
          <div className="text-[9px] tracking-wide text-dark-muted">AV {total}</div>
        </div>
        <div className="flex-1">
          {zone ? (
            <div className="mb-1 text-[11px] font-bold" style={miniStandingsRankStyle(zone.color)}>
              ● {zone.label}
            </div>
          ) : null}
          {above ? (
            <div className="text-xs text-dark-muted">
              <span className="font-bold text-green">▲ {above.points - team.points}p</span> till{' '}
              {shortName(above.teamName)}
            </div>
          ) : null}
          {below ? (
            <div className="mt-0.5 text-xs text-dark-muted">
              <span className="font-bold text-red">▼ {team.points - below.points}p</span> over{' '}
              {shortName(below.teamName)}
            </div>
          ) : null}
        </div>
        <div className="text-right">
          <div className="text-[22px] font-black text-gold">{team.points}p</div>
          <div className="text-[10px] text-dark-muted">{team.played} matcher</div>
        </div>
      </div>

      <div className="border-t border-light-border dark:border-dark-border">
        {showFrom > 0 && (
          <div className="px-5 py-1.5 text-center text-[10px] text-dark-muted">• • •</div>
        )}
        {visibleStandings.map((s, vi) => {
          const realPos = showFrom + vi
          const isThis = s.teamId === teamId
          const z = getZone(realPos)
          const diff = s.ptsFor - s.ptsAgainst

          return (
            <div
              key={s.teamId}
              className={cn(
                'grid grid-cols-[24px_1fr_28px_28px_42px] items-center gap-2 border-b px-5 py-2.25',
                'border-light-border dark:border-dark-border',
                isThis && 'border-l-[3px] border-l-gold bg-gold/[0.06] dark:bg-gold/[0.06]',
              )}
            >
              <div
                className={cn(
                  'text-center text-xs font-bold',
                  isThis ? 'text-gold' : 'text-dark-muted',
                )}
              >
                {realPos + 1}
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                {z ? (
                  <div
                    className="h-[5px] w-[5px] shrink-0 rounded-full"
                    style={miniStandingsZoneBarStyle(z.color)}
                  />
                ) : null}
                <Link
                  href={`/teams/${s.teamId}`}
                  className={cn(
                    'truncate text-[13px] no-underline',
                    isThis ? 'font-bold bk-text-primary' : 'font-normal text-dark-muted',
                  )}
                >
                  {shortName(s.teamName)}
                </Link>
              </div>
              <div className="text-center text-[11px] text-dark-muted tabular-nums">{s.played}</div>
              <div
                className={cn(
                  'text-center text-[11px] font-semibold tabular-nums',
                  diff > 0 && 'text-green',
                  diff < 0 && 'text-red',
                  diff === 0 && 'text-dark-muted',
                )}
              >
                {diff > 0 ? '+' : ''}
                {diff}
              </div>
              <div
                className={cn(
                  'text-right text-sm tabular-nums',
                  isThis ? 'font-black text-gold' : 'font-semibold bk-text-primary',
                )}
              >
                {s.points}p
              </div>
            </div>
          )
        })}
        {showTo < total - 1 && (
          <div className="px-5 py-1.5 text-center text-[10px] text-dark-muted">• • •</div>
        )}
      </div>
    </div>
  )
}
