'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

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

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

export default function TeamTableWidget({ teamId, division }: Props) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('teams').select('id, name'),
      supabase.from('matches')
        .select('home_team_id, away_team_id, home_score, away_score')
        .eq('division', division)
        .eq('status', 'completed')
        .not('home_score', 'is', null),
    ]).then(([{ data: teams }, { data: matches }]) => {
      if (!teams || !matches) return

      const teamMap: Record<string, string> = {}
      teams.forEach(t => { teamMap[t.id] = t.name })

      const table: Record<string, Standing> = {}
      const initTeam = (id: string) => {
        if (!table[id]) table[id] = { teamId: id, teamName: teamMap[id] || '', played: 0, wins: 0, draws: 0, losses: 0, points: 0, diff: 0, ptsFor: 0, ptsAgainst: 0 }
      }

      matches.forEach(m => {
        initTeam(m.home_team_id)
        initTeam(m.away_team_id)
        const h = table[m.home_team_id]
        const a = table[m.away_team_id]
        const hs = m.home_score!
        const as_ = m.away_score!
        h.played++; a.played++
        h.ptsFor += hs; h.ptsAgainst += as_
        a.ptsFor += as_; a.ptsAgainst += hs
        if (hs > as_) { h.wins++; h.points += 2; a.losses++ }
        else if (as_ > hs) { a.wins++; a.points += 2; h.losses++ }
        else { h.draws++; h.points++; a.draws++; a.points++ }
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

  // Zone
  const getZone = (i: number) => {
    if (i < 2) return { label: 'SM-slutspel', color: '#f5c200' }
    if (total <= 8 ? i < 4 : i < 6) return { label: 'Play-off', color: '#5a82b4' }
    if (i === total - 2) return { label: 'Kvalar', color: '#e05555' }
    if (i === total - 1) return { label: 'Nedflyttning', color: '#666666' }
    return null
  }

  const zone = getZone(pos)

  // Show 2 above and 2 below (or fewer if at top/bottom)
  const showFrom = Math.max(0, pos - 2)
  const showTo = Math.min(total - 1, pos + 2)
  const visibleStandings = standings.slice(showFrom, showTo + 1)

  return (
    <div style={{ margin: '0 0 0', borderTop: '1px solid ' + C.border }}>
      <div style={{ padding: '14px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 2 }}>TABELLPOSITION</div>
        <a href="/league" style={{ fontSize: 11, color: C.accent, textDecoration: 'none', fontWeight: 600 }}>
          Hela tabellen ›
        </a>
      </div>

      {/* Position hero */}
      <div style={{ padding: '8px 20px 12px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'center', minWidth: 52 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: zone ? zone.color : C.accent, lineHeight: 1 }}>{pos + 1}</div>
          <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 0.5 }}>AV {total}</div>
        </div>
        <div style={{ flex: 1 }}>
          {zone && (
            <div style={{ fontSize: 11, fontWeight: 700, color: zone.color, marginBottom: 4 }}>
              ● {zone.label}
            </div>
          )}
          <div style={{ display: 'flex', gap: 16 }}>
            {above && (
              <div style={{ fontSize: 12, color: C.textMuted }}>
                <span style={{ color: C.green, fontWeight: 700 }}>▲ {above.points - team.points}p</span>
                {' '}till {shortName(above.teamName)}
              </div>
            )}
          </div>
          {below && (
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              <span style={{ color: '#e05555', fontWeight: 700 }}>▼ {team.points - below.points}p</span>
              {' '}over {shortName(below.teamName)}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.accent }}>{team.points}p</div>
          <div style={{ fontSize: 10, color: C.textMuted }}>{team.played} matcher</div>
        </div>
      </div>

      {/* Mini table */}
      <div style={{ borderTop: '1px solid ' + C.border }}>
        {showFrom > 0 && (
          <div style={{ padding: '6px 20px', fontSize: 10, color: C.textMuted, textAlign: 'center' }}>• • •</div>
        )}
        {visibleStandings.map((s, vi) => {
          const realPos = showFrom + vi
          const isThis = s.teamId === teamId
          const z = getZone(realPos)
          const diff = s.ptsFor - s.ptsAgainst

          return (
            <div key={s.teamId}
              style={{ display: 'grid', gridTemplateColumns: '24px 1fr 28px 28px 42px', gap: 8, padding: '9px 20px', borderBottom: '1px solid ' + C.border, background: isThis ? (theme === 'dark' ? 'rgba(245,194,0,0.06)' : 'rgba(10,92,138,0.04)') : 'transparent', borderLeft: '3px solid ' + (isThis ? '#f5c200' : 'transparent'), alignItems: 'center' }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: isThis ? '#f5c200' : C.textMuted, textAlign: 'center' }}>{realPos + 1}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {z && <div style={{ width: 5, height: 5, borderRadius: '50%', background: z.color, flexShrink: 0 }} />}
                <a href={'/teams/' + s.teamId} style={{ fontSize: 13, fontWeight: isThis ? 700 : 400, color: isThis ? C.text : C.textMuted, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {shortName(s.teamName)}
                </a>
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, textAlign: 'center' }}>{s.played}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: diff > 0 ? C.green : diff < 0 ? '#e05555' : C.textMuted, textAlign: 'center' }}>
                {diff > 0 ? '+' : ''}{diff}
              </div>
              <div style={{ fontSize: 14, fontWeight: isThis ? 900 : 600, color: isThis ? '#f5c200' : C.text, textAlign: 'right' }}>{s.points}p</div>
            </div>
          )
        })}
        {showTo < total - 1 && (
          <div style={{ padding: '6px 20px', fontSize: 10, color: C.textMuted, textAlign: 'center' }}>• • •</div>
        )}
      </div>
    </div>
  )
}
