'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Team = { id: string; name: string; club: string }
type Match = { id: string; home_team_id: string; away_team_id: string; home_score: number | null; away_score: number | null; division: string }
type Standing = { team: Team; played: number; wins: number; losses: number; ptsFor: number; ptsAgainst: number; diff: number; points: number }

function shortName(name: string) {
  return name.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').trim()
}

function calcStandings(teams: Team[], matches: Match[], division: string): Standing[] {
  const divMatches = matches.filter(m => m.division === division && m.home_score !== null)
  const teamIds = new Set([...divMatches.map(m => m.home_team_id), ...divMatches.map(m => m.away_team_id)])
  const table: Record<string, Standing> = {}
  teams.filter(t => teamIds.has(t.id)).forEach(t => {
    table[t.id] = { team: t, played: 0, wins: 0, losses: 0, ptsFor: 0, ptsAgainst: 0, diff: 0, points: 0 }
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
    else { h.points++; a.points++ }
  })
  return Object.values(table)
    .map(s => ({ ...s, diff: s.ptsFor - s.ptsAgainst }))
    .sort((a, b) => b.points - a.points || b.diff - a.diff || b.ptsFor - a.ptsFor)
}

export default function LeaguePage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [division, setDivision] = useState('Elitserien Herrar')
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

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
  const total = standings.length

  const zoneColor = (i: number) => {
    if (i < 2) return C.accent
    if (total <= 8 ? i < 4 : i < 6) return C.green
    if (i === total - 2) return '#e05555'
    if (i === total - 1) return '#666666'
    return 'transparent'
  }

  const showDivider = (i: number) => {
    if (i === 2) return true
    if (total <= 8 && i === 4) return true
    if (total > 8 && i === 6) return true
    if (i === total - 2) return true
    return false
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Serietabell</h1>
          <div style={{ fontSize: 13, color: C.textMuted }}>Sasong 2025/2026</div>
        </div>

        <div style={{ display: 'flex', background: C.card, borderRadius: 10, padding: 4, marginBottom: 20, border: '1px solid ' + C.border, gap: 4 }}>
          {['Elitserien Herrar', 'Elitserien Damer'].map(d => (
            <button key={d} onClick={() => setDivision(d)} style={{ flex: 1, background: division === d ? C.surface : 'transparent', border: division === d ? '1px solid ' + C.border : '1px solid transparent', borderRadius: 8, padding: '9px 6px', fontSize: 12, fontWeight: 700, color: division === d ? C.accent : C.textMuted, cursor: 'pointer' }}>
              {d === 'Elitserien Herrar' ? 'Herrar' : 'Damer'}
            </button>
          ))}
        </div>

        {loading && <div style={{ padding: 32, textAlign: 'center', color: C.textMuted }}>Laddar...</div>}

        {!loading && standings.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>Inga resultat</div>
        )}

        {!loading && standings.length > 0 && (
          <div style={{ background: C.card, borderRadius: 14, border: '1px solid ' + C.border, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 28px 28px 28px 56px 36px 36px', padding: '9px 12px', background: C.surface, borderBottom: '1px solid ' + C.border }}>
              {['#', 'Lag', 'S', 'V', 'F', 'Tot', 'D', 'P'].map((h, i) => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: i === 7 ? C.accent : C.textMuted, textAlign: i > 1 ? 'center' : 'left' }}>{h}</div>
              ))}
            </div>
            {standings.map((s, i) => {
              const hue = s.team.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
              const tc = 'hsl(' + hue + ',50%,45%)'
              const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
              const dc = s.diff > 0 ? C.green : s.diff < 0 ? '#e05555' : C.textMuted
              const dl = s.diff > 0 ? ('+' + s.diff) : String(s.diff)
              return (
                <div key={s.team.id}>
                  {showDivider(i) && <div style={{ height: 1, background: zoneColor(i) + '55' }} />}
                  <a href={'/teams/' + s.team.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 28px 28px 28px 56px 36px 36px', padding: '11px 12px', borderBottom: i < standings.length - 1 ? '1px solid ' + C.border : 'none', borderLeft: '3px solid ' + zoneColor(i), textDecoration: 'none', alignItems: 'center', background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: i < 2 ? C.accent : C.textMuted, textAlign: 'center' }}>{i + 1}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: tclo, border: '1.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 900, color: tc, flexShrink: 0 }}>
                        {shortName(s.team.name).split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {shortName(s.team.name)}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted, textAlign: 'center' }}>{s.played}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, textAlign: 'center' }}>{s.wins}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, textAlign: 'center' }}>{s.losses}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, textAlign: 'center' }}>{s.ptsFor}-{s.ptsAgainst}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: dc, textAlign: 'center' }}>{dl}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: C.accent, textAlign: 'center' }}>{s.points}</div>
                  </a>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          {[{ color: C.accent, label: 'SM-slutspel' }, { color: C.green, label: 'Play-off' }, { color: '#e05555', label: 'Kvalar' }, { color: '#666666', label: 'Nedflyttning' }].map(z => (
            <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.textMuted }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: z.color }} />
              {z.label}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 8, fontSize: 11, color: C.textMuted }}>
          S=Spelade V=Vunna F=Forlorade D=Differens P=Poang
        </div>

      </div>
    </main>
  )
}
