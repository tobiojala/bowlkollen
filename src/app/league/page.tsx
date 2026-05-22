'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Team = { id: string; name: string; club: string }
type Match = { id: string; home_team_id: string; away_team_id: string; home_score: number | null; away_score: number | null; division: string }
type Standing = { team: Team; played: number; wins: number; draws: number; losses: number; ptsFor: number; ptsAgainst: number; diff: number; points: number }

function calcStandings(teams: Team[], matches: Match[], division: string): Standing[] {
  const divMatches = matches.filter(m => m.division === division && m.home_score !== null)
  const table: Record<string, Standing> = {}
  teams.forEach(t => { table[t.id] = { team: t, played: 0, wins: 0, draws: 0, losses: 0, ptsFor: 0, ptsAgainst: 0, diff: 0, points: 0 } })
  divMatches.forEach(m => {
    const h = table[m.home_team_id]
    const a = table[m.away_team_id]
    if (!h || !a) return
    const hs = m.home_score!, as_ = m.away_score!
    h.played++; a.played++
    h.ptsFor += hs; h.ptsAgainst += as_; a.ptsFor += as_; a.ptsAgainst += hs
    if (hs > as_) { h.wins++; h.points += 2; a.losses++ }
    else if (as_ > hs) { a.wins++; a.points += 2; h.losses++ }
    else { h.draws++; h.points++; a.draws++; a.points++ }
  })
  return Object.values(table)
    .map(s => ({ ...s, diff: s.ptsFor - s.ptsAgainst }))
    .sort((a, b) => b.points - a.points || b.diff - a.diff || b.ptsFor - a.ptsFor)
    .filter(s => s.played > 0)
}

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

const TIER_GROUPS = [
  { label: 'Elitserien', divisions: ['Elitserien Herrar', 'Elitserien Damer'] },
  { label: 'Allsvenskan', divisions: ['Mellanallsvenskan Herrar', 'Nordallsvenskan Herrar', 'Sydallsvenskan Herrar', 'Norra Allsvenskan Herrar', 'Södra Allsvenskan Herrar'] },
  { label: 'Division 1', divisions: ['Div 1 Norra Götaland Herrar', 'Div 1 Norra Norrland Herrar', 'Div 1 Norra Svealand Herrar', 'Div 1 Södra Götaland Herrar', 'Div 1 Södra Norrland Herrar', 'Div 1 Södra Svealand Herrar'] },
]
function shortDiv(d: string) {
  return d.replace(' Herrar', ' H').replace(' Damer', ' D')
    .replace('Mellanallsvenskan', 'Mellanallsv.')
    .replace('Allsvenskan', 'Allsv.')
    .replace('Div 1 ', 'D1 ')
    .replace('Norra ', 'N.').replace('Södra ', 'S.')
    .replace('Götaland', 'Götal.').replace('Norrland', 'Norrl.').replace('Svealand', 'Sveal.')
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

      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 56, background: C.bg, zIndex: 30, borderBottom: '1px solid ' + C.border }}>

        {/* Level 1 - Tier pills */}
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 6, padding: '10px 16px 6px' } as any}>
          {TIER_GROUPS.map(group => {
            const isActive = TIER_GROUPS.find(g => g.divisions.includes(division))?.label === group.label
            return (
              <button key={group.label}
                onClick={() => setDivision(group.divisions[0])}
                style={{ background: isActive ? C.accent : 'transparent', border: '1px solid ' + (isActive ? C.accent : C.border), borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: isActive ? '#1a1400' : C.textMuted, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}
              >
                {group.label}
              </button>
            )
          })}
        </div>

        {/* Level 2 - Division pills for active tier */}
        {(() => {
          const activeGroup = TIER_GROUPS.find(g => g.divisions.includes(division))
          if (!activeGroup || activeGroup.divisions.length <= 1) return null
          return (
            <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 6, padding: '4px 16px 8px' } as any}>
              {activeGroup.divisions.map(d => {
                const isActive = division === d
                return (
                  <button key={d}
                    onClick={() => setDivision(d)}
                    style={{ background: isActive ? C.surface : 'transparent', border: '1px solid ' + (isActive ? C.border : 'transparent'), borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: isActive ? 700 : 400, color: isActive ? C.text : C.textMuted, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}
                  >
                    {shortDiv(d)}
                  </button>
                )
              })}
            </div>
          )
        })()}

      </div>

      {/* Table */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 48px' }}>
        {loading && <div style={{ padding: 32, textAlign: 'center', color: C.textMuted }}>Laddar...</div>}
        {!loading && standings.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>Inga resultat</div>}
        {!loading && standings.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 28px 28px 28px 42px 34px', gap: 4, padding: '4px 8px 6px', borderBottom: '1px solid ' + C.border }}>
              <div />
              <div />
              {['V', 'O', 'F', '+/−', 'P'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textAlign: 'center', letterSpacing: 0.5 }}>{h}</div>
              ))}
            </div>

            {standings.map((s, i) => {
              const zc = zoneColor(i)
              const dl = s.diff > 0 ? '+' + s.diff : String(s.diff)
              const dc = s.diff > 0 ? C.green : s.diff < 0 ? C.red : C.textMuted
              return (
                <div key={s.team.id}>
                  {showDivider(i) && <div style={{ height: 2, background: zoneColor(i), margin: '2px 0', borderRadius: 1, opacity: 0.35 }} />}
                  <a href={'/teams/' + s.team.id}
                    style={{ display: 'grid', gridTemplateColumns: '28px 1fr 28px 28px 28px 42px 34px', gap: 4, padding: '10px 8px', textDecoration: 'none', borderRadius: 8, alignItems: 'center', borderLeft: '3px solid ' + (zc !== 'transparent' ? zc : 'transparent') }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: zc !== 'transparent' ? zc : C.textMuted, textAlign: 'center' }}>{i + 1}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(s.team.name)}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.green, textAlign: 'center' }}>{s.wins}</div>
                    <div style={{ fontSize: 13, color: C.textMuted, textAlign: 'center' }}>{s.draws}</div>
                    <div style={{ fontSize: 13, color: C.red, textAlign: 'center' }}>{s.losses}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: dc, textAlign: 'center' }}>{dl}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text, textAlign: 'center' }}>{s.points}</div>
                  </a>
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          {[{ color: C.accent, label: 'SM-slutspel' }, { color: C.green, label: 'Play-off' }, { color: '#e05555', label: 'Kvalar' }, { color: '#666666', label: 'Nedflyttning' }].map(z => (
            <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.textMuted }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: z.color }} />
              {z.label}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
