'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Props = { params: Promise<{ id: string }> }
type Team = { id: string; name: string; club: string; city: string; division?: string }
type Match = {
  id: string
  date: string
  status: string
  home_score: number | null
  away_score: number | null
  round: number
  venue: string
  division: string
  home_team_id: string
  away_team_id: string
  home: { id: string; name: string }
  away: { id: string; name: string }
}

function shortName(name: string) {
  return name.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').trim()
}

function divisionColor(division: string | null) {
  if (!division) return '#6b7a99'
  if (division.includes('Herrar')) return '#4a90d9'
  if (division.includes('Damer')) return '#d94a90'
  if (division.includes('SM') || division.includes('slutspel')) return '#f5c200'
  return '#6b7a99'
}

export default function TeamPage({ params }: Props) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [id, setId] = useState<string | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'results' | 'upcoming'>('results')

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    Promise.all([
      supabase.from('teams').select('*').eq('id', id).single(),
      supabase.from('matches')
        .select('id, date, status, home_score, away_score, round, venue, division, home_team_id, away_team_id, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
        .or('home_team_id.eq.' + id + ',away_team_id.eq.' + id)
        .order('date', { ascending: false }),
    ]).then(([{ data: t }, { data: m }]) => {
      if (t) setTeam(t as Team)
      if (m) setMatches(m as unknown as Match[])
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: C.textMuted }}>Laddar...</div>
    </main>
  )

  if (!team) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: C.textMuted }}>Lag hittades inte</div>
    </main>
  )

  const hue = team.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const tc = 'hsl(' + hue + ',50%,45%)'
  const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
  const ini = shortName(team.name).split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()

  const completed = matches.filter(m => m.status === 'completed' && m.home_score !== null)
  const upcoming = matches.filter(m => m.status === 'upcoming' || m.status === 'live')

  // Stats
  const isHome = (m: Match) => m.home_team_id === id
  const wins = completed.filter(m => isHome(m) ? (m.home_score! > m.away_score!) : (m.away_score! > m.home_score!)).length
  const losses = completed.filter(m => isHome(m) ? (m.home_score! < m.away_score!) : (m.away_score! < m.home_score!)).length
  const draws = completed.filter(m => m.home_score === m.away_score).length
  const points = wins * 2 + draws
  const ptsFor = completed.reduce((s, m) => s + (isHome(m) ? m.home_score! : m.away_score!), 0)
  const ptsAgainst = completed.reduce((s, m) => s + (isHome(m) ? m.away_score! : m.home_score!), 0)
  const diff = ptsFor - ptsAgainst

  // Form — last 5 completed
  const last5 = [...completed].reverse().slice(0, 5).map(m => {
    const hw = isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!
    const lw = isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!
    return hw ? 'W' : lw ? 'L' : 'D'
  })

  const formColor = (f: string) => f === 'W' ? C.green : f === 'L' ? '#e05555' : C.textMuted

  const displayMatches = tab === 'results' ? completed : upcoming

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 48px' }}>

        <a href="/teams" style={{ fontSize: 12, color: C.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          ← Alla lag
        </a>

        {/* Team hero */}
        <div style={{ background: C.card, borderRadius: 16, border: '1px solid ' + C.border, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: tclo, border: '2px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: tc, flexShrink: 0 }}>
              {ini}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 2 }}>{shortName(team.name)}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {team.club && <span style={{ fontSize: 11, color: C.textMuted }}>{team.club}</span>}
                {team.city && <span style={{ fontSize: 11, color: C.textMuted }}>· {team.city}</span>}
                {completed.length > 0 && matches[0]?.division && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: divisionColor(matches[0]?.division), background: divisionColor(matches[0]?.division) + '18', borderRadius: 6, padding: '1px 7px' }}>
                    {matches[0]?.division}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats grid */}
          {completed.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Vunna', value: wins, color: C.green },
                { label: 'Oavgjorda', value: draws, color: C.textMuted },
                { label: 'Forlorade', value: losses, color: '#e05555' },
                { label: 'Poang', value: points, color: C.accent },
              ].map(s => (
                <div key={s.label} style={{ background: C.surface, borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid ' + C.border }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          )}

          {/* Points diff and form */}
          {completed.length > 0 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ background: C.surface, borderRadius: 10, padding: '8px 12px', border: '1px solid ' + C.border, flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: diff >= 0 ? C.green : '#e05555' }}>
                  {diff >= 0 ? '+' : ''}{diff}
                </div>
                <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>DIFFERENS</div>
              </div>
              <div style={{ background: C.surface, borderRadius: 10, padding: '8px 12px', border: '1px solid ' + C.border, flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{ptsFor} - {ptsAgainst}</div>
                <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>FOR - MOT</div>
              </div>
              {last5.length > 0 && (
                <div style={{ background: C.surface, borderRadius: 10, padding: '8px 12px', border: '1px solid ' + C.border, flex: 1 }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    {last5.map((f, i) => (
                      <span key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: formColor(f) + '22', border: '1.5px solid ' + formColor(f), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: formColor(f) }}>
                        {f}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4, textAlign: 'center' }}>FORM</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: C.card, borderRadius: 10, padding: 4, marginBottom: 16, border: '1px solid ' + C.border, gap: 4 }}>
          {[
            { key: 'results', label: 'Resultat', count: completed.length },
            { key: 'upcoming', label: 'Kommande', count: upcoming.length },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{ flex: 1, background: tab === t.key ? C.surface : 'transparent', border: tab === t.key ? '1px solid ' + C.border : '1px solid transparent', borderRadius: 8, padding: '9px 6px', fontSize: 12, fontWeight: 700, color: tab === t.key ? C.accent : C.textMuted, cursor: 'pointer' }}>
              {t.label} {t.count > 0 && <span style={{ fontSize: 10, opacity: 0.7 }}>({t.count})</span>}
            </button>
          ))}
        </div>

        {/* Match list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayMatches.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: C.textMuted, fontSize: 13, background: C.card, borderRadius: 12, border: '1px solid ' + C.border }}>
              Inga matcher att visa
            </div>
          )}
          {displayMatches.map(m => {
            const home = isHome(m)
            const teamScore = home ? m.home_score : m.away_score
            const oppScore = home ? m.away_score : m.home_score
            const opp = home ? m.away : m.home
            const won = teamScore !== null && oppScore !== null && teamScore > oppScore
            const lost = teamScore !== null && oppScore !== null && teamScore < oppScore
            const drew = teamScore !== null && oppScore !== null && teamScore === oppScore
            const oppHue = (opp?.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
            const oppTc = 'hsl(' + oppHue + ',50%,45%)'
            const oppTclo = theme === 'dark' ? 'hsl(' + oppHue + ',40%,15%)' : 'hsl(' + oppHue + ',40%,92%)'
            const resultLabel = won ? 'V' : lost ? 'F' : drew ? 'O' : null
            const resultColor = won ? C.green : lost ? '#e05555' : C.textMuted

            return (
              <a key={m.id} href={'/matches/' + m.id} style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}
                onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
                onMouseLeave={e => (e.currentTarget.style.background = C.card)}
              >
                {/* Result badge */}
                <div style={{ width: 28, height: 28, borderRadius: 8, background: resultLabel ? resultColor + '22' : C.surface, border: '1.5px solid ' + (resultLabel ? resultColor : C.border), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: resultLabel ? resultColor : C.textMuted, flexShrink: 0 }}>
                  {resultLabel || (m.status === 'live' ? '●' : '—')}
                </div>

                {/* Opponent */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: oppTclo, border: '1.5px solid ' + oppTc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: oppTc, flexShrink: 0 }}>
                    {shortName(opp?.name || '').split(' ').map((w:string) => w[0]).join('').slice(0, 3).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortName(opp?.name || '')}
                    </div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{home ? 'Hemma' : 'Borta'} · {m.date?.slice(0, 10)}</div>
                  </div>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {teamScore !== null ? (
                    <>
                      <div style={{ fontSize: 15, fontWeight: 800, color: won ? C.accent : C.text }}>
                        {teamScore} - {oppScore}
                      </div>
                      <div style={{ fontSize: 9, color: C.textMuted }}>MP</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: m.status === 'live' ? '#e05555' : C.textMuted, fontWeight: m.status === 'live' ? 700 : 400 }}>
                      {m.status === 'live' ? '● LIVE' : m.date ? new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </div>
                  )}
                </div>
              </a>
            )
          })}
        </div>

      </div>
    </main>
  )
}
