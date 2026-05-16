'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Team = { id: string; name: string; club: string }
type Match = { id: string; home_team_id: string; away_team_id: string; home_score: number | null; away_score: number | null; division: string }

type Standing = {
  team: Team
  played: number
  wins: number
  draws: number
  losses: number
  ptsFor: number
  ptsAgainst: number
  diff: number
  points: number
}

function shortName(name: string) {
  return name.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').trim()
}

function calcStandings(teams: Team[], matches: Match[], division: string): Standing[] {
  const divMatches = matches.filter(m => m.division === division && m.home_score !== null)
  const teamIds = new Set([...divMatches.map(m => m.home_team_id), ...divMatches.map(m => m.away_team_id)])
  const table: Record<string, Standing> = {}

  teams.filter(t => teamIds.has(t.id)).forEach(t => {
    table[t.id] = { team: t, played: 0, wins: 0, draws: 0, losses: 0, ptsFor: 0, ptsAgainst: 0, diff: 0, points: 0 }
  })

  divMatches.forEach(m => {
    const h = table[m.home_team_id]
    const a = table[m.away_team_id]
    if (!h || !a) return
    const hs = m.home_score!
    const as_ = m.away_score!
    h.played++; a.played++
    h.ptsFor += hs; h.ptsAgainst += as_
    a.ptsFor += as_; a.ptsAgainst += hs
    if (hs > as_) { h.wins++; h.points += 2; a.losses++ }
    else if (as_ > hs) { a.wins++; a.points += 2; h.losses++ }
    else { h.draws++; h.points++; a.draws++; a.points++ }
  })

  return Object.values(table)
    .map(s => ({ ...s, diff: s.ptsFor - s.ptsAgainst }))
    .sort((a, b) => b.points - a.points || b.diff - a.diff || b.ptsFor - a.ptsFor)
}

function StandingsTable({ standings, theme, C }: { standings: Standing[], theme: string, C: any }) {
  const col = { textAlign: 'right' as const, fontSize: 13, color: C.textMuted, padding: '0 8px' }
  const hdr = { textAlign: 'right' as const, fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1, padding: '0 8px' }

  if (standings.length === 0) return (
    <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 32, textAlign: 'center', color: C.textMuted }}>
      Inga resultat registrerade
    </div>
  )

  return (
    <div style={{ background: C.card, borderRadius: 14, border: '1px solid ' + C.border, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 42px 36px 36px 36px 100px 52px 44px', padding: '10px 16px', background: C.surface, borderBottom: '1px solid ' + C.border }}>
        <div style={{ ...hdr, textAlign: 'left', padding: 0 }}>#</div>
        <div style={{ ...hdr, textAlign: 'left' }}>LAG</div>
        <div style={hdr}>S</div>
        <div style={hdr}>V</div>
        <div style={hdr}>O</div>
        <div style={hdr}>F</div>
        <div style={hdr}>TOTAL</div>
        <div style={hdr}>D</div>
        <div style={{ ...hdr, color: C.accent }}>P</div>
      </div>

      {standings.map((s, i) => {
        const total = standings.length
        const isTop = i < 2
        const isPlayoff = total <= 8 ? (i >= 2 && i < 4) : (i >= 2 && i < 6)
        const isKval = i === total - 2
        const isRelegation = i === total - 1
        const borderColor = isTop ? C.accent : isPlayoff ? C.green : isKval ? '#e05555' : isRelegation ? '#444444' : 'transparent'
        const hue = s.team.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
        const tc = 'hsl(' + hue + ',50%,45%)'
        const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
        const showDivider = total <= 8
          ? (i === 2 || i === 4 || i === total - 2)
          : (i === 2 || i === 6 || i === total - 2)

        return (
          <div key={s.team.id}>
            {showDivider && <div style={{ height: 2, background: (i === 2 ? C.green : i === 6 ? C.border : '#e05555') + '44' }} />}
            <a href={'/teams/' + s.team.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 42px 36px 36px 36px 100px 52px 44px', padding: '11px 16px', borderBottom: i < standings.length - 1 ? '1px solid ' + C.border : 'none', borderLeft: '3px solid ' + borderColor, textDecoration: 'none', alignItems: 'center', background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: isTop ? C.accent : C.textMuted, textAlign: 'center' }}>{i + 1}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: tclo, border: '1.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: tc, flexShrink: 0 }}>
                  {shortName(s.team.name).split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{shortName(s.team.name)}</div>
              </div>
              <div style={{ ...col, color: C.textMuted }}>{s.played}</div>
              <div style={{ ...col, fontWeight: 700, color: C.text }}>{s.wins}</div>
              <div style={{ ...col, color: C.textMuted }}>{s.draws}</div>
              <div style={{ ...col, color: C.textMuted }}>{s.losses}</div>
              <div style={{ ...col, fontSize: 12 }}>{s.ptsFor} - {s.ptsAgainst}</div>
              <div style={{ ...col, fontWeight: 700, color: s.diff > 0 ? C.green : s.diff < 0 ? '#e05555' : C.textMuted }}>
                {s.diff > 0 ? '+' : ''}{s.diff}
              </div>
              <div style={{ ...col, fontSize: 16, fontWeight: 900, color: C.accent }}>{s.points}</div>
            </a>
          </div>
        )
      })}
    </div>
  )
}

export default function LeaguePage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [division, setDivision] = useState('Elitserien Herrar')
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  const divisions = ['Elitserien Herrar', 'Elitserien Damer']

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('teams').select('id, name, club'),
      supabase.from('matches').select('id, home_team_id, away_team_id, home_score, away_score, division').eq('status', 'completed').not('home_score', 'is', null).not('division', 'is', null),
    ]).then(([{ data: t }, { data: m }]) => {
      if (t) setTeams(t as Team[])
      if (m) setMatches(m as Match[])
      setLoading(false)
    })
  }, [])

  const standings = calcStandings(teams, matches, division)

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, marginBottom: 4 }}>Serietabell</h1>
            <div style={{ fontSize: 13, color: C.textMuted }}>Säsong 2025/2026</div>
          </div>
          <a href="https://bits.swebowl.se/elitserien-herrar" target="_blank" rel="noopener noreferrer" style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 8, padding: '7px 14px', fontSize: 12, color: C.textMuted, textDecoration: 'none', fontWeight: 600 }}>
            BITS &#8599;
          </a>
        </div>

        {/* Division tabs */}
        <div style={{ display: 'flex', background: C.surface, borderRadius: 10, padding: 4, marginBottom: 24, border: '1px solid ' + C.border, gap: 4 }}>
          {divisions.map(d => (
            <button key={d} onClick={() => setDivision(d)} style={{ flex: 1, background: division === d ? C.card : 'transparent', border: division === d ? '1px solid ' + C.border : '1px solid transparent', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 700, color: division === d ? C.accent : C.textMuted, cursor: 'pointer' }}>
              {d}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 32, textAlign: 'center', color: C.textMuted }}>Laddar...</div>
        ) : (
          <StandingsTable standings={standings} theme={theme} C={C} />
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            { color: C.accent, label: 'SM-slutspel direkt' },
            { color: C.green, label: 'Play-off' },
            { color: '#e05555', label: 'Kvalar' },
            { color: '#444444', label: 'Nedflyttning' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.textMuted }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
              {label}
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 11, color: C.textMuted }}>
            S=Spelade V=Vunna O=Oavgjorda F=Forlorade D=Differens P=Poang
          </div>
        </div>

      </div>
    </main>
  )
}
