'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import HeroCarousel from '@/components/HeroCarousel'

type MatchResult = {
  player_id: string
  team_id: string
  games: number[]
  players: { name: string }
}

type Match = {
  id: string
  date: string
  status: string
  home_team_id: string
  away_team_id: string
  home: { id: string; name: string }
  away: { id: string; name: string }
  results: MatchResult[]
}

export default function Home() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('matches')
      .select('id, date, status, home_team_id, away_team_id, home:teams!home_team_id(id,name), away:teams!away_team_id(id,name)')
      .in('status', ['live', 'completed'])
      .order('date', { ascending: false })
      .limit(5)
      .then(async ({ data: matchData }) => {
        if (!matchData) return setLoading(false)
        const full: Match[] = []
        for (const m of matchData) {
          const { data: results } = await supabase
            .from('match_results')
            .select('player_id, team_id, games, players(name)')
            .eq('match_id', m.id)
            .eq('type', 'league')
          full.push({ ...m, results: results || [] } as unknown as Match)
        }
        setMatches(full)
        setLoading(false)
      })
  }, [])

  const calcTotal = (results: MatchResult[], teamId: string) =>
    results.filter(r => r.team_id === teamId).flatMap(r => r.games || []).reduce((a, b) => a + b, 0)

  const bestPlayer = (results: MatchResult[], teamId: string) => {
    const rs = results.filter(r => r.team_id === teamId)
    if (!rs.length) return null
    return rs.reduce((best, r) => r.games.reduce((a, b) => a + b, 0) > best.games.reduce((a: number, b: number) => a + b, 0) ? r : best)
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        <HeroCarousel />

        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 2, marginBottom: 16 }}>SENASTE MATCHER</div>

        {loading && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            Laddar...
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            Inga matcher spelade annu
          </div>
        )}

        {!loading && matches.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {matches.map(match => {
              const homeTotal = calcTotal(match.results, match.home_team_id)
              const awayTotal = calcTotal(match.results, match.away_team_id)
              const homeBest = bestPlayer(match.results, match.home_team_id)
              const awayBest = bestPlayer(match.results, match.away_team_id)
              const homeWin = homeTotal > awayTotal
              const awayWin = awayTotal > homeTotal
              return (
                <a key={match.id} href={'/matches/' + match.id} style={{ background: C.card, borderRadius: 14, border: '1px solid ' + C.border, overflow: 'hidden', textDecoration: 'none', display: 'block' }}>
                  <div style={{ background: C.surface, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid ' + C.border }}>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{match.date}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: match.status === 'live' ? (theme === 'dark' ? '#0a3a1a' : '#e8f5ee') : (theme === 'dark' ? '#1a1a2a' : '#f0f2f5'), color: match.status === 'live' ? C.green : C.textMuted }}>
                      {match.status === 'live' ? '* LIVE' : 'AVSLUTAD'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, padding: '16px 20px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: homeWin ? C.accent : C.text, marginBottom: 4 }}>{match.home?.name}</div>
                      {homeBest && <div style={{ fontSize: 11, color: C.textMuted }}>Bast: {homeBest.players?.name} ({homeBest.games.reduce((a, b) => a + b, 0)})</div>}
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 130 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <span style={{ fontSize: 30, fontWeight: 900, color: homeWin ? C.accent : C.text }}>{homeTotal}</span>
                        <span style={{ fontSize: 16, color: C.textMuted }}>-</span>
                        <span style={{ fontSize: 30, fontWeight: 900, color: awayWin ? C.accent : C.text }}>{awayTotal}</span>
                      </div>
                      <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2, letterSpacing: 1 }}>KAGLEPOANG</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: awayWin ? C.accent : C.text, marginBottom: 4 }}>{match.away?.name}</div>
                      {awayBest && <div style={{ fontSize: 11, color: C.textMuted }}>Bast: {awayBest.players?.name} ({awayBest.games.reduce((a, b) => a + b, 0)})</div>}
                    </div>
                  </div>
                  {match.results.length > 0 && (
                    <div style={{ borderTop: '1px solid ' + C.border, padding: '12px 20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {[match.home_team_id, match.away_team_id].map((teamId, ti) => {
                          const rs = match.results.filter(r => r.team_id === teamId)
                          const team = ti === 0 ? match.home : match.away
                          return (
                            <div key={teamId}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 6 }}>{team?.name?.toUpperCase()}</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {rs.map((r, i) => (
                                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: C.surface, borderRadius: 6, padding: '5px 10px' }}>
                                    <div style={{ fontSize: 12, color: C.text }}>{r.players?.name}</div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: C.accent }}>{r.games.reduce((a, b) => a + b, 0)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </a>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
