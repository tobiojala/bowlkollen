'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { shortName } from '@/lib/utils'

type Team = {
  id: string; name: string; club: string; city: string | null
  club_slug: string | null; team_path: string | null
}
type Match = {
  id: string; home_team_id: string; away_team_id: string
  home_score: number | null; away_score: number | null
  division: string; date: string; status: string
}
type Standing = {
  teamId: string; played: number; wins: number; draws: number; losses: number
  bpFor: number; bpAgainst: number; diff: number; points: number
}
type Entry = {
  team: Team; standing: Standing | null; rank: number
  form: string[]; live: boolean; division: string
}

const DIV_ORDER = [
  'Elitserien Herrar', 'Elitserien Damer',
  'Sydallsvenskan Herrar', 'Mellanallsvenskan Herrar', 'Nordallsvenskan Herrar',
  'Södra Allsvenskan Damer', 'Norra Allsvenskan Damer',
  'Div 1 Norra Götaland Herrar', 'Div 1 Södra Götaland Herrar',
  'Div 1 Norra Svealand Herrar', 'Div 1 Södra Svealand Herrar',
  'Div 1 Norra Norrland Herrar', 'Div 1 Södra Norrland Herrar',
  'Division 1 Damer',
]

function chipLabel(d: string) {
  return d
    .replace('Sydallsvenskan', 'Syd')
    .replace('Mellanallsvenskan', 'Mellan')
    .replace('Nordallsvenskan', 'Nord')
    .replace('Södra Allsvenskan', 'Södra')
    .replace('Norra Allsvenskan', 'Norra')
    .replace('Elitserien', 'Elit')
    .replace(' Herrar', ' H').replace(' Damer', ' D')
    .replace('Div 1 ', 'D1 ').replace('Division 1 ', 'D1 ')
    .replace('Norra ', 'N.').replace('Södra ', 'S.')
    .replace('Götaland', 'Götal').replace('Norrland', 'Norrl').replace('Svealand', 'Sveal')
    .replace('Allsvenskan', 'Allsv')
}

function sectionLabel(d: string) {
  return d
    .replace('Sydallsvenskan', 'Sydallsvenskan')
    .replace('Mellanallsvenskan', 'Mellanallsvenskan')
    .replace('Nordallsvenskan', 'Nordallsvenskan')
    .replace(' Herrar', ' H').replace(' Damer', ' D')
}

function calcStandings(teams: Team[], matches: Match[], division: string): Standing[] {
  const divMatches = matches
    .filter(m => m.division === division && m.home_score !== null)
    .sort((a, b) => a.date.localeCompare(b.date))

  const table: Record<string, Standing> = {}
  teams.forEach(t => {
    table[t.id] = { teamId: t.id, played: 0, wins: 0, draws: 0, losses: 0, bpFor: 0, bpAgainst: 0, diff: 0, points: 0 } as any
  })

  divMatches.forEach(m => {
    const h = table[m.home_team_id], a = table[m.away_team_id]
    if (!h || !a) return
    const hs = m.home_score!, as_ = m.away_score!
    h.played++; a.played++
    h.bpFor += hs; h.bpAgainst += as_
    a.bpFor += as_; a.bpAgainst += hs
    if (hs > as_)      { h.wins++;  h.points += 2; a.losses++ }
    else if (as_ > hs) { a.wins++;  a.points += 2; h.losses++ }
    else               { h.draws++; h.points++;     a.draws++; a.points++ }
  })

  return Object.values(table)
    .map(s => ({ ...s, diff: s.bpFor - s.bpAgainst }))
    .sort((a, b) => b.points - a.points || b.diff - a.diff || b.bpFor - a.bpFor)
    .filter(s => s.played > 0)
}

function getForm(teamId: string, matches: Match[]): string[] {
  return matches
    .filter(m => (m.home_team_id === teamId || m.away_team_id === teamId) && m.home_score !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map(m => {
      const isHome = m.home_team_id === teamId
      const s = isHome ? m.home_score! : m.away_score!
      const c = isHome ? m.away_score! : m.home_score!
      return s > c ? 'V' : c > s ? 'F' : 'O'
    })
}

function isLive(teamId: string, matches: Match[]) {
  return matches.some(m => m.status === 'live' && (m.home_team_id === teamId || m.away_team_id === teamId))
}

function accentColor(rank: number, total: number): string {
  if (rank === 1) return '#f5c200'
  if (rank === 2 || rank === 3) return '#38a088'
  if (rank >= total - 1) return '#555'
  return 'rgba(255,255,255,0.07)'
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(245,194,0,0.15)', border: '1.5px solid rgba(245,194,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 20px rgba(245,194,0,0.25)' }}>
      <span style={{ fontSize: 18, fontWeight: 900, color: '#f5c200', lineHeight: 1 }}>1</span>
    </div>
  )
  if (rank === 2) return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(176,184,200,0.10)', border: '1.5px solid rgba(176,184,200,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 15, fontWeight: 800, color: '#a0b0c8', lineHeight: 1 }}>2</span>
    </div>
  )
  if (rank === 3) return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(176,120,60,0.12)', border: '1.5px solid rgba(176,120,60,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 14, fontWeight: 800, color: '#c08840', lineHeight: 1 }}>3</span>
    </div>
  )
  return (
    <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.28)', lineHeight: 1 }}>{rank}</span>
    </div>
  )
}

function FormDot({ result }: { result: string }) {
  const color = result === 'V' ? '#f5c200' : result === 'O' ? 'rgba(255,255,255,0.30)' : '#e05555'
  return <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
}

export default function TeamsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [teams, setTeams]     = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive]   = useState('Alla')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('teams').select('id, name, club, city, club_slug, team_path'),
      supabase.from('matches').select('id, home_team_id, away_team_id, home_score, away_score, division, date, status'),
    ]).then(([{ data: t }, { data: m }]) => {
      if (t) setTeams(t as Team[])
      if (m) setMatches(m as Match[])
      setLoading(false)
    })
  }, [])

  const { divisions, entries } = useMemo(() => {
    const divSet = new Set(matches.map(m => m.division).filter(Boolean))
    const known  = DIV_ORDER.filter(d => divSet.has(d))
    const extra  = [...divSet].filter(d => !DIV_ORDER.includes(d)).sort()
    const divisions = [...known, ...extra]

    const entries: Entry[] = []

    divisions.forEach(div => {
      const ids = new Set<string>()
      matches.filter(m => m.division === div).forEach(m => { ids.add(m.home_team_id); ids.add(m.away_team_id) })
      const divTeams = teams.filter(t => ids.has(t.id))
      const standings = calcStandings(divTeams, matches, div)
      const rankMap = Object.fromEntries(standings.map((s, i) => [s.teamId, { standing: s, rank: i + 1 }]))

      divTeams.forEach(team => {
        const r = rankMap[team.id]
        if (!r) return
        entries.push({ team, standing: r.standing, rank: r.rank, form: getForm(team.id, matches), live: isLive(team.id, matches), division: div })
      })
    })

    entries.sort((a, b) => {
      const da = DIV_ORDER.indexOf(a.division), db = DIV_ORDER.indexOf(b.division)
      if (da !== db) return (da === -1 ? 999 : da) - (db === -1 ? 999 : db)
      return a.rank - b.rank
    })

    return { divisions, entries }
  }, [teams, matches])

  const filtered = active === 'Alla' ? entries : entries.filter(e => e.division === active)

  const grouped = filtered.reduce((acc, e) => {
    if (!acc[e.division]) acc[e.division] = []
    acc[e.division].push(e)
    return acc
  }, {} as Record<string, Entry[]>)

  const bg   = '#10161e'
  const card = (rank: number) => rank === 1
    ? { background: 'rgba(245,194,0,0.05)', border: '1px solid rgba(245,194,0,0.18)' }
    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }

  return (
    <main style={{ minHeight: '100vh', background: bg, fontFamily: 'system-ui, sans-serif' }}>

      {/* Division chips */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 16px 0', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {['Alla', ...divisions].map(div => {
          const isActive = active === div
          return (
            <button key={div} onClick={() => setActive(div)} style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
              border: isActive ? '1px solid rgba(245,194,0,0.50)' : '1px solid rgba(255,255,255,0.10)',
              background: isActive ? 'rgba(245,194,0,0.10)' : 'rgba(255,255,255,0.04)',
              color: isActive ? '#f5c200' : 'rgba(255,255,255,0.55)',
              fontSize: 12, fontWeight: 700, WebkitTapHighlightColor: 'transparent',
            }}>
              {div === 'Alla' ? 'Alla' : chipLabel(div)}
            </button>
          )
        })}
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 12px 24px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            Laddar...
          </div>
        )}

        {!loading && Object.entries(grouped).map(([div, divEntries]) => (
          <div key={div}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px 4px 12px' }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.8, color: '#f5c200', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {sectionLabel(div)}
              </span>
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(245,194,0,0.20)' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>
                {divEntries.length} lag
              </span>
            </div>

            {/* Team cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {divEntries.map(({ team, standing, rank, form, live }) => {
                const total = divEntries.length
                const accent = accentColor(rank, total)
                const href = team.club_slug && team.team_path
                  ? `/${team.club_slug}/${team.team_path}`
                  : `/teams/${team.id}`
                const { background, border } = card(rank)

                return (
                  <a key={team.id} href={href} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{
                      background, border,
                      borderLeft: `3px solid ${accent}`,
                      borderRadius: 18,
                      padding: '14px 16px 14px 14px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      boxShadow: rank === 1 ? '0 0 32px rgba(245,194,0,0.08), 0 2px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.25)',
                    }}>

                      {/* Rank medallion */}
                      <RankBadge rank={rank} />

                      {/* Team info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Name + live */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{
                            fontSize: 15, fontWeight: 700,
                            color: rank === 1 ? '#fff' : 'rgba(255,255,255,0.90)',
                            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {shortName(team.name)}
                          </span>
                          {live && (
                            <span style={{
                              fontSize: 9, fontWeight: 800, color: '#e05555',
                              background: 'rgba(224,85,85,0.12)', border: '1px solid rgba(224,85,85,0.30)',
                              borderRadius: 6, padding: '2px 6px', flexShrink: 0,
                              display: 'flex', alignItems: 'center', gap: 3,
                            }}>
                              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#e05555', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                              LIVE
                            </span>
                          )}
                        </div>

                        {/* City */}
                        {team.city && (
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginBottom: 7 }}>
                            {team.city}
                          </div>
                        )}

                        {/* Form + record */}
                        {standing && standing.played > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', gap: 3 }}>
                              {form.map((r, i) => <FormDot key={i} result={r} />)}
                              {form.length === 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>–</span>}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.3 }}>
                              V{standing.wins} O{standing.draws} F{standing.losses}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Points */}
                      {standing && standing.played > 0 && (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{
                            fontSize: rank <= 3 ? 26 : 22,
                            fontWeight: 900,
                            color: rank === 1 ? '#f5c200' : 'rgba(255,255,255,0.85)',
                            lineHeight: 1,
                            textShadow: rank === 1 ? '0 0 20px rgba(245,194,0,0.4)' : 'none',
                          }}>
                            {standing.points}
                          </div>
                          <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.30)', marginTop: 3, letterSpacing: 1 }}>
                            P
                          </div>
                        </div>
                      )}
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            Inga lag hittades
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </main>
  )
}
