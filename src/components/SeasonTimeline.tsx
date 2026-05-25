'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

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

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

export default function SeasonTimeline({ teamId }: Props) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRound, setExpandedRound] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('matches')
      .select('id, date, round, status, home_score, away_score, home_team_id, away_team_id, venue, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
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

  const getResult = (m: Match) => {
    if (m.home_score === null) return 'upcoming'
    const my = isHome(m) ? m.home_score : m.away_score!
    const opp = isHome(m) ? m.away_score! : m.home_score
    if (my > opp!) return 'win'
    if (my < opp!) return 'loss'
    return 'draw'
  }

  const resultColor = (result: string) => {
    if (result === 'win') return C.green
    if (result === 'loss') return '#e05555'
    if (result === 'draw') return C.textMuted
    return C.border
  }

  const resultBg = (result: string) => {
    if (result === 'win') return theme === 'dark' ? 'rgba(196,144,64,0.15)' : 'rgba(160,112,48,0.1)'
    if (result === 'loss') return theme === 'dark' ? 'rgba(224,85,85,0.15)' : 'rgba(192,57,43,0.1)'
    if (result === 'draw') return theme === 'dark' ? 'rgba(107,122,153,0.15)' : 'rgba(107,122,141,0.1)'
    return C.card
  }

  const resultLabel = (result: string) => {
    if (result === 'win') return 'V'
    if (result === 'loss') return 'F'
    if (result === 'draw') return 'O'
    return '·'
  }

  // Group by round
  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b)
  const byRound: Record<number, Match[]> = {}
  matches.forEach(m => {
    if (!byRound[m.round]) byRound[m.round] = []
    byRound[m.round].push(m)
  })

  // Stats
  const played = matches.filter(m => m.home_score !== null)
  const wins = played.filter(m => getResult(m) === 'win').length
  const losses = played.filter(m => getResult(m) === 'loss').length
  const draws = played.filter(m => getResult(m) === 'draw').length

  return (
    <div style={{ borderTop: '1px solid ' + C.border }}>
      <div style={{ padding: '14px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 2 }}>SASONGSÖVERSIKT</div>
        <div style={{ fontSize: 11, color: C.textMuted }}>
          <span style={{ color: C.green, fontWeight: 700 }}>{wins}V</span>
          {' '}<span style={{ color: C.textMuted }}>{draws}O</span>
          {' '}<span style={{ color: '#e05555', fontWeight: 700 }}>{losses}F</span>
        </div>
      </div>

      {/* Round dots overview */}
      <div style={{ padding: '0 20px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {rounds.map(round => {
          const roundMatches = byRound[round]
          const results = roundMatches.map(getResult)
          const mainResult = results.includes('win') ? 'win' : results.includes('draw') ? 'draw' : results.includes('loss') ? 'loss' : 'upcoming'
          const isExpanded = expandedRound === round
          const hasMultiple = roundMatches.length > 1

          return (
            <button key={round}
              onClick={() => setExpandedRound(isExpanded ? null : round)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                background: isExpanded ? resultBg(mainResult) : 'transparent',
                border: '1px solid ' + (isExpanded ? resultColor(mainResult) : C.border),
                borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
                minWidth: 36, WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 600 }}>O{round}</div>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: resultBg(mainResult),
                border: '1.5px solid ' + resultColor(mainResult),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800, color: resultColor(mainResult)
              }}>
                {hasMultiple ? roundMatches.length : resultLabel(mainResult)}
              </div>
            </button>
          )
        })}
      </div>

      {/* Expanded round detail */}
      {expandedRound !== null && byRound[expandedRound] && (
        <div style={{ borderTop: '1px solid ' + C.border }}>
          <div style={{ padding: '10px 20px 6px', fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1 }}>
            OMGANG {expandedRound}
          </div>
          {byRound[expandedRound].map(m => {
            const result = getResult(m)
            const opp = isHome(m) ? m.away : m.home
            const myScore = isHome(m) ? m.home_score : m.away_score
            const oppScore = isHome(m) ? m.away_score : m.home_score
            const oppHue = (opp?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
            const oppTc = 'hsl(' + oppHue + ',50%,45%)'
            const oppTclo = theme === 'dark' ? 'hsl(' + oppHue + ',40%,15%)' : 'hsl(' + oppHue + ',40%,92%)'

            return (
              <a key={m.id} href={'/matches/' + m.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: '1px solid ' + C.border, textDecoration: 'none', background: resultBg(result) }}
              >
                {/* Result badge */}
                <div style={{ width: 28, height: 28, borderRadius: 8, background: resultColor(result) + '22', border: '1.5px solid ' + resultColor(result), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: resultColor(result), flexShrink: 0 }}>
                  {resultLabel(result)}
                </div>

                {/* Opponent */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: oppTclo, border: '1.5px solid ' + oppTc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: oppTc, flexShrink: 0 }}>
                    {shortName(opp?.name || '').split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortName(opp?.name || '')}
                    </div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>
                      {isHome(m) ? 'Hemma' : 'Borta'} · {m.date?.slice(0, 10)}
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {myScore !== null ? (
                    <>
                      <div style={{ fontSize: 16, fontWeight: 800, color: resultColor(result) }}>
                        {myScore} - {oppScore}
                      </div>
                      <div style={{ fontSize: 9, color: C.textMuted }}>MP</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: C.textMuted }}>
                      {new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
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
