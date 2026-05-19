'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

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

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

export default function NextMatchPreview({ teamId, nextMatch }: Props) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [oppForm, setOppForm] = useState<string[]>([])
  const [h2h, setH2h] = useState<{ wins: number; draws: number; losses: number }>({ wins: 0, draws: 0, losses: 0 })
  const [loading, setLoading] = useState(true)

  const isHome = nextMatch.home_team_id === teamId
  const opp = isHome ? nextMatch.away : nextMatch.home
  const oppId = opp.id

  const matchDate = new Date(nextMatch.date)
  const days = ['Söndag','Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag']
  const months = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']
  const dateStr = days[matchDate.getDay()] + ' ' + matchDate.getDate() + ' ' + months[matchDate.getMonth()]
  const timeStr = matchDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

  const oppHue = oppId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const oppTc = 'hsl(' + oppHue + ',50%,45%)'
  const oppTclo = theme === 'dark' ? 'hsl(' + oppHue + ',40%,15%)' : 'hsl(' + oppHue + ',40%,92%)'

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      // Opponent last 5 matches
      supabase.from('matches')
        .select('home_team_id, away_team_id, home_score, away_score')
        .or('home_team_id.eq.' + oppId + ',away_team_id.eq.' + oppId)
        .eq('status', 'completed')
        .not('home_score', 'is', null)
        .order('date', { ascending: false })
        .limit(5),
      // Head to head
      supabase.from('matches')
        .select('home_team_id, away_team_id, home_score, away_score')
        .or(
          'and(home_team_id.eq.' + teamId + ',away_team_id.eq.' + oppId + '),' +
          'and(home_team_id.eq.' + oppId + ',away_team_id.eq.' + teamId + ')'
        )
        .eq('status', 'completed')
        .not('home_score', 'is', null),
    ]).then(([{ data: oppMatches }, { data: h2hMatches }]) => {
      // Opponent form
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

      // H2H
      if (h2hMatches) {
        let wins = 0, draws = 0, losses = 0
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

  const formColor = (f: string) => f === 'V' ? C.green : f === 'F' ? '#e05555' : C.textMuted

  return (
    <div style={{ borderTop: '1px solid ' + C.border }}>
      <div style={{ padding: '14px 20px 8px', fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 2 }}>
        NASTA MATCH
      </div>

      <a href={'/matches/' + nextMatch.id} style={{ display: 'block', textDecoration: 'none', padding: '0 20px 16px' }}>

        {/* Date and venue */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ background: '#f5c200', color: '#1a1400', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 800 }}>
            {dateStr}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{timeStr}</div>
          {nextMatch.venue && (
            <div style={{ fontSize: 11, color: C.textMuted, marginLeft: 'auto' }}>📍 {nextMatch.venue}</div>
          )}
        </div>

        {/* Teams */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, textAlign: isHome ? 'left' : 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.accent }}>
              {shortName(isHome ? nextMatch.home.name : nextMatch.away.name)}
            </div>
            <div style={{ fontSize: 10, color: C.textMuted }}>Hemmalag</div>
          </div>
          <div style={{ fontSize: 16, color: C.textMuted, fontWeight: 300 }}>vs</div>
          <div style={{ flex: 1, textAlign: isHome ? 'right' : 'left' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
              {shortName(opp.name)}
            </div>
            <div style={{ fontSize: 10, color: C.textMuted }}>Bortalag</div>
          </div>
        </div>

        {/* Opponent info */}
        {!loading && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 14, display: 'flex', gap: 16 }}>

            {/* Opponent form */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 8 }}>
                {shortName(opp.name).toUpperCase()} FORM
              </div>
              {oppForm.length > 0 ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  {oppForm.map((f, i) => (
                    <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: formColor(f) + '22', border: '1.5px solid ' + formColor(f), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: formColor(f) }}>
                      {f}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: C.textMuted }}>Inga data</div>
              )}
            </div>

            {/* H2H */}
            {(h2h.wins + h2h.draws + h2h.losses) > 0 && (
              <div style={{ borderLeft: '1px solid ' + C.border, paddingLeft: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 8 }}>
                  INBÖRDES
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: C.green }}>{h2h.wins}</div>
                    <div style={{ fontSize: 9, color: C.textMuted }}>V</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: C.textMuted }}>{h2h.draws}</div>
                    <div style={{ fontSize: 9, color: C.textMuted }}>O</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#e05555' }}>{h2h.losses}</div>
                    <div style={{ fontSize: 9, color: C.textMuted }}>F</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </a>
    </div>
  )
}
