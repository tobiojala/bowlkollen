'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'
import { seasonResultTone, teamColors, type SeasonMatchResult } from '@/lib/team-ui'

type Props = { teamId: string }

type Match = {
  id: string
  date: string
  round: number
  status: string
  home_score: number | null
  away_score: number | null
  home_team_id: string
  away_team_id: string
  venue: string
  home: { id: string; name: string }
  away: { id: string; name: string }
}

export default function SeasonTimeline({ teamId }: Props) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRound, setExpandedRound] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('matches')
      .select(
        'id, date, round, status, home_score, away_score, home_team_id, away_team_id, venue, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)',
      )
      .or('home_team_id.eq.' + teamId + ',away_team_id.eq.' + teamId)
      .not('round', 'is', null)
      .order('round')
      .then(({ data }) => {
        if (data) setMatches(data as unknown as Match[])
        setLoading(false)
      })
  }, [teamId])

  if (loading || matches.length === 0) return null

  const isHome = (m: Match) => m.home_team_id === teamId

  const getResult = (m: Match): SeasonMatchResult => {
    if (m.home_score === null) return 'upcoming'
    const my = isHome(m) ? m.home_score : m.away_score!
    const opp = isHome(m) ? m.away_score! : m.home_score
    if (my > opp!) return 'win'
    if (my < opp!) return 'loss'
    return 'draw'
  }

  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b)
  const byRound: Record<number, Match[]> = {}
  matches.forEach(m => {
    if (!byRound[m.round]) byRound[m.round] = []
    byRound[m.round].push(m)
  })

  const played = matches.filter(m => m.home_score !== null)
  const wins = played.filter(m => getResult(m) === 'win').length
  const losses = played.filter(m => getResult(m) === 'loss').length
  const draws = played.filter(m => getResult(m) === 'draw').length

  return (
    <div className="border-t border-light-border dark:border-dark-border">
      <div className="flex items-center justify-between px-5 pt-3.5 pb-2.5">
        <div className="text-[10px] font-extrabold tracking-[2px] text-dark-muted">SASONGSÖVERSIKT</div>
        <div className="text-[11px] text-dark-muted">
          <span className="font-bold text-[#3d6090] dark:text-[#5a82b4]">{wins}V</span>{' '}
          <span>{draws}O</span>{' '}
          <span className="font-bold text-[#d63b3b] dark:text-[#e05555]">{losses}F</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 px-5 pb-3.5">
        {rounds.map(round => {
          const roundMatches = byRound[round]
          const results = roundMatches.map(getResult)
          const mainResult: SeasonMatchResult = results.includes('win')
            ? 'win'
            : results.includes('draw')
              ? 'draw'
              : results.includes('loss')
                ? 'loss'
                : 'upcoming'
          const tone = seasonResultTone(mainResult)
          const isExpanded = expandedRound === round
          const hasMultiple = roundMatches.length > 1

          return (
            <button
              key={round}
              type="button"
              onClick={() => setExpandedRound(isExpanded ? null : round)}
              className={cn(
                'flex min-w-9 cursor-pointer flex-col items-center gap-0.5 rounded-lg border px-2 py-1.5',
                '[-webkit-tap-highlight-color:transparent]',
                isExpanded ? cn(tone.bg, tone.border) : 'border-light-border bg-transparent dark:border-dark-border',
              )}
            >
              <div className="text-[9px] font-semibold text-dark-muted">O{round}</div>
              <div
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] text-[9px] font-extrabold',
                  tone.bg,
                  tone.border,
                  tone.text,
                )}
              >
                {hasMultiple ? roundMatches.length : tone.label}
              </div>
            </button>
          )
        })}
      </div>

      {expandedRound !== null && byRound[expandedRound] && (
        <div className="border-t border-light-border dark:border-dark-border">
          <div className="px-5 pt-2.5 pb-1.5 text-[11px] font-bold tracking-wide text-dark-muted">
            OMGANG {expandedRound}
          </div>
          {byRound[expandedRound].map(m => {
            const result = getResult(m)
            const tone = seasonResultTone(result)
            const opp = isHome(m) ? m.away : m.home
            const myScore = isHome(m) ? m.home_score : m.away_score
            const oppScore = isHome(m) ? m.away_score : m.home_score
            const oppStyle = teamColors(opp?.name || '', false)
            const oppStyleDark = teamColors(opp?.name || '', true)

            return (
              <a
                key={m.id}
                href={'/matches/' + m.id}
                className={cn(
                  'flex items-center gap-3 border-b px-5 py-2.75 no-underline',
                  'border-light-border dark:border-dark-border',
                  tone.bg,
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-[1.5px] text-[11px] font-extrabold',
                    tone.badgeBg,
                    tone.border,
                    tone.text,
                  )}
                >
                  {tone.label}
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border-[1.5px] text-[8px] font-extrabold dark:hidden"
                    style={{
                      background: oppStyle.bg,
                      borderColor: oppStyle.accent,
                      color: oppStyle.accent,
                    }}
                  >
                    {shortName(opp?.name || '')
                      .split(' ')
                      .map((w: string) => w[0])
                      .join('')
                      .slice(0, 3)
                      .toUpperCase()}
                  </div>
                  <div
                    className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border-[1.5px] text-[8px] font-extrabold dark:flex"
                    style={{
                      background: oppStyleDark.bg,
                      borderColor: oppStyleDark.accent,
                      color: oppStyleDark.accent,
                    }}
                  >
                    {shortName(opp?.name || '')
                      .split(' ')
                      .map((w: string) => w[0])
                      .join('')
                      .slice(0, 3)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold bk-text-primary">
                      {shortName(opp?.name || '')}
                    </div>
                    <div className="text-[10px] text-dark-muted">
                      {isHome(m) ? 'Hemma' : 'Borta'} · {m.date?.slice(0, 10)}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {myScore !== null ? (
                    <>
                      <div className={cn('text-base font-extrabold', tone.text)}>
                        {myScore} - {oppScore}
                      </div>
                      <div className="text-[9px] text-dark-muted">MP</div>
                    </>
                  ) : (
                    <div className="text-[11px] text-dark-muted">
                      {new Date(m.date).toLocaleTimeString('sv-SE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
