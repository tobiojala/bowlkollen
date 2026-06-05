'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { shortName } from '@/lib/utils'
import { cn } from '@/lib/cn'

type Props = {
  teamId: string
  nextMatch: {
    id: string
    date: string
    venue: string
    home_team_id: string
    away_team_id: string
    home: { id: string; name: string }
    away: { id: string; name: string }
  }
}

export default function NextMatchPreview({ teamId, nextMatch }: Props) {
  const [oppForm, setOppForm] = useState<string[]>([])
  const [h2h, setH2h] = useState<{ wins: number; draws: number; losses: number }>({
    wins: 0,
    draws: 0,
    losses: 0,
  })
  const [loading, setLoading] = useState(true)

  const isHome = nextMatch.home_team_id === teamId
  const opp = isHome ? nextMatch.away : nextMatch.home
  const oppId = opp.id

  const matchDate = new Date(nextMatch.date)
  const days = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  const dateStr = `${days[matchDate.getDay()]} ${matchDate.getDate()} ${months[matchDate.getMonth()]}`
  const timeStr = matchDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase
        .from('matches')
        .select('home_team_id, away_team_id, home_score, away_score')
        .or(`home_team_id.eq.${oppId},away_team_id.eq.${oppId}`)
        .eq('status', 'completed')
        .not('home_score', 'is', null)
        .order('date', { ascending: false })
        .limit(5),
      supabase
        .from('matches')
        .select('home_team_id, away_team_id, home_score, away_score')
        .or(
          `and(home_team_id.eq.${teamId},away_team_id.eq.${oppId}),` +
            `and(home_team_id.eq.${oppId},away_team_id.eq.${teamId})`,
        )
        .eq('status', 'completed')
        .not('home_score', 'is', null),
    ]).then(([{ data: oppMatches }, { data: h2hMatches }]) => {
      if (oppMatches) {
        const form = oppMatches.map(m => {
          const isOppHome = m.home_team_id === oppId
          const oppScore = isOppHome ? m.home_score! : m.away_score!
          const otherScore = isOppHome ? m.away_score! : m.home_score!
          if (oppScore > otherScore) return 'V'
          if (oppScore < otherScore) return 'F'
          return 'O'
        })
        setOppForm(form)
      }

      if (h2hMatches) {
        let wins = 0
        let draws = 0
        let losses = 0
        h2hMatches.forEach(m => {
          const myHome = m.home_team_id === teamId
          const myScore = myHome ? m.home_score! : m.away_score!
          const theirScore = myHome ? m.away_score! : m.home_score!
          if (myScore > theirScore) wins++
          else if (myScore < theirScore) losses++
          else draws++
        })
        setH2h({ wins, draws, losses })
      }
      setLoading(false)
    })
  }, [teamId, oppId])

  return (
    <div className="border-t border-light-border dark:border-dark-border">
      <div className="px-5 pt-3.5 pb-2 text-[10px] font-extrabold tracking-[2px] text-dark-muted">
        NASTA MATCH
      </div>

      <Link
        href={`/matches/${nextMatch.id}`}
        className="block px-5 pb-4 no-underline"
      >
        <div className="mb-3.5 flex items-center gap-2">
          <div className="rounded-lg bg-gold px-2.5 py-1 text-xs font-extrabold text-[#1a1400]">
            {dateStr}
          </div>
          <div className="text-xs font-bold bk-text-primary">{timeStr}</div>
          {nextMatch.venue ? (
            <div className="ml-auto text-[11px] text-dark-muted">📍 {nextMatch.venue}</div>
          ) : null}
        </div>

        <div className="mb-3.5 flex items-center gap-3">
          <div className={cn('flex-1', isHome ? 'text-left' : 'text-right')}>
            <div className="text-base font-extrabold text-gold">
              {shortName(isHome ? nextMatch.home.name : nextMatch.away.name)}
            </div>
            <div className="text-[10px] text-dark-muted">Hemmalag</div>
          </div>
          <div className="text-base font-light text-dark-muted">vs</div>
          <div className={cn('flex-1', isHome ? 'text-right' : 'text-left')}>
            <div className="text-base font-bold bk-text-primary">{shortName(opp.name)}</div>
            <div className="text-[10px] text-dark-muted">Bortalag</div>
          </div>
        </div>

        {!loading && (
          <div
            className={cn(
              'flex gap-4 rounded-xl border p-3.5',
              'border-light-border bg-light-card dark:border-dark-border dark:bg-dark-card',
            )}
          >
            <div className="flex-1">
              <div className="mb-2 text-[10px] font-bold tracking-wide text-dark-muted">
                {shortName(opp.name).toUpperCase()} FORM
              </div>
              {oppForm.length > 0 ? (
                <div className="flex gap-1">
                  {oppForm.map((f, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] text-[9px] font-extrabold',
                        f === 'V' && 'border-green bg-green/13 text-green',
                        f === 'F' && 'border-red bg-red/13 text-red',
                        f === 'O' && 'border-dark-muted text-dark-muted',
                      )}
                    >
                      {f}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-dark-muted">Inga data</div>
              )}
            </div>

            {h2h.wins + h2h.draws + h2h.losses > 0 && (
              <div className="border-l border-light-border pl-4 dark:border-dark-border">
                <div className="mb-2 text-[10px] font-bold tracking-wide text-dark-muted">
                  INBÖRDES
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-center">
                    <div className="text-lg font-black text-green">{h2h.wins}</div>
                    <div className="text-[9px] text-dark-muted">V</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-dark-muted">{h2h.draws}</div>
                    <div className="text-[9px] text-dark-muted">O</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-red">{h2h.losses}</div>
                    <div className="text-[9px] text-dark-muted">F</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Link>
    </div>
  )
}
