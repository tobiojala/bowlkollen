'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Props = { params: Promise<{ id: string }> }
type Result = { id: string; player_id: string; team_id: string; round: string; games: number[]; players: any }

function shortName(name: string) {
  return name.replace(/ A$/, '').replace(/ H A$/, '').trim()
}

export default function MatchPage({ params }: Props) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [id, setId] = useState<string | null>(null)
  const [match, setMatch] = useState<any>(null)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    Promise.all([
      supabase.from('matches').select('*, home:teams!home_team_id(id,name,club), away:teams!away_team_id(id,name,club)').eq('id', id).single(),
      supabase.from('match_results').select('id, player_id, team_id, round, games, players(name)').eq('match_id', id).eq('type', 'league').order('created_at'),
    ]).then(([{ data: matchData }, { data: resultsData }]) => {
      setMatch(matchData)
      setResults((resultsData || []) as Result[])
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.textMuted }}>Laddar...</div>
      </main>
    )
  }

  if (!match) {
    return (
      <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.textMuted }}>Match hittades inte</div>
      </main>
    )
  }

  const home = match.home
  const away = match.away
  const homeTotal = match.home_score
  const awayTotal = match.away_score
  const homeWin = (homeTotal ?? 0) > (awayTotal ?? 0)
  const awayWin = (awayTotal ?? 0) > (homeTotal ?? 0)
  const hasScore = homeTotal !== null && awayTotal !== null

  const homeHue = (home?.name || '').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
  const awayHue = (away?.name || '').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
  const tc = (hue: number) => 'hsl(' + hue + ',50%,45%)'
  const tclo = (hue: number) => theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'

  const homeResults = results.filter(r => r.team_id === match.home_team_id)
  const awayResults = results.filter(r => r.team_id === match.away_team_id)

  const playerTotal = (r: Result) => (r.games || []).reduce((a, b) => a + b, 0)
  const bestInTeam = (rs: Result[]) => rs.length === 0 ? null : rs.reduce((best, r) => playerTotal(r) > playerTotal(best) ? r : best)
  const homeBest = bestInTeam(homeResults)
  const awayBest = bestInTeam(awayResults)

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        <a href="/" style={{ fontSize: 13, color: C.textMuted, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
          &larr; Hem
        </a>

        {/* Match hero */}
        <div style={{ background: C.card, borderRadius: 16, border: '1px solid ' + C.border, overflow: 'hidden', marginBottom: 24 }}>

          <div style={{ background: C.surface, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid ' + C.border }}>
            <div style={{ fontSize: 12, color: C.textMuted }}>{match.date?.slice(0, 10)}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {match.venue && <span style={{ fontSize: 11, color: C.textMuted }}>{match.venue}</span>}
              {match.oil_profile && <span style={{ fontSize: 10, color: C.textMuted, background: C.card, borderRadius: 6, padding: '2px 8px', border: '1px solid ' + C.border }}>{match.oil_profile}</span>}
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: match.status === 'live' ? (theme === 'dark' ? '#0a3a1a' : '#e8f5ee') : (theme === 'dark' ? '#1a1a2a' : '#f0f2f5'), color: match.status === 'live' ? C.green : C.textMuted, letterSpacing: 1 }}>
                {match.status === 'live' ? '* LIVE' : match.status === 'completed' ? 'AVSLUTAD' : 'KOMMANDE'}
              </span>
            </div>
          </div>

          {/* Score */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, padding: '28px 24px', alignItems: 'center' }}>

            <div style={{ textAlign: 'left' }}>
              <a href={'/teams/' + home?.id} style={{ textDecoration: 'none' }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: tclo(homeHue), border: '2px solid ' + tc(homeHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: tc(homeHue), marginBottom: 10 }}>
                  {shortName(home?.name || '').split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()}
                </div>
                <div style={{ fontWeight: 800, fontSize: 17, color: homeWin ? C.accent : C.text, marginBottom: 3 }}>{shortName(home?.name || '')}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{home?.club}</div>
              </a>
            </div>

            <div style={{ textAlign: 'center', minWidth: 140 }}>
              {hasScore ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 6 }}>
                    <span style={{ fontSize: 40, fontWeight: 900, color: homeWin ? C.accent : C.text, lineHeight: 1 }}>{homeTotal}</span>
                    <span style={{ fontSize: 20, color: C.textMuted }}>-</span>
                    <span style={{ fontSize: 40, fontWeight: 900, color: awayWin ? C.accent : C.text, lineHeight: 1 }}>{awayTotal}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 1.5 }}>MATCHPOANG</div>
                  {(homeWin || awayWin) && (
                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: C.accent }}>
                      {homeWin ? shortName(home?.name || '') : shortName(away?.name || '')} vinner
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 20, fontWeight: 700, color: C.textMuted }}>vs</div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <a href={'/teams/' + away?.id} style={{ textDecoration: 'none' }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: tclo(awayHue), border: '2px solid ' + tc(awayHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: tc(awayHue), marginBottom: 10, marginLeft: 'auto' }}>
                  {shortName(away?.name || '').split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()}
                </div>
                <div style={{ fontWeight: 800, fontSize: 17, color: awayWin ? C.accent : C.text, marginBottom: 3 }}>{shortName(away?.name || '')}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{away?.club}</div>
              </a>
            </div>
          </div>

          {/* Best players from match_results if available */}
          {(homeBest || awayBest) && (
            <div style={{ borderTop: '1px solid ' + C.border, padding: '14px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[{ best: homeBest, hue: homeHue }, { best: awayBest, hue: awayHue }].map(({ best, hue }, i) => best ? (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: i === 1 ? 'flex-end' : 'flex-start' }}>
                  {i === 0 && <>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: tclo(hue), border: '1px solid ' + tc(hue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: tc(hue), flexShrink: 0 }}>
                      {best.players?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>BAST SPELARE</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{best.players?.name}</div>
                      <div style={{ fontSize: 12, color: tc(hue) }}>{playerTotal(best)} pins</div>
                    </div>
                  </>}
                  {i === 1 && <>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>BAST SPELARE</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{best.players?.name}</div>
                      <div style={{ fontSize: 12, color: tc(hue) }}>{playerTotal(best)} pins</div>
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: tclo(hue), border: '1px solid ' + tc(hue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: tc(hue), flexShrink: 0 }}>
                      {best.players?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  </>}
                </div>
              ) : <div key={i} />)}
            </div>
          )}
        </div>

        {/* Player scorecards if match_results exist */}
        {results.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { rs: homeResults, hue: homeHue, name: home?.name },
              { rs: awayResults, hue: awayHue, name: away?.name },
            ].map(({ rs, hue, name }) => (
              <div key={name}>
                <div style={{ fontSize: 11, fontWeight: 700, color: tc(hue), letterSpacing: 1, marginBottom: 10 }}>
                  {shortName(name || '').toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rs.sort((a, b) => playerTotal(b) - playerTotal(a)).map(r => {
                    const total = playerTotal(r)
                    const isBest = r === bestInTeam(rs)
                    return (
                      <div key={r.id} style={{ background: C.card, borderRadius: 12, border: '1px solid ' + (isBest ? tc(hue) + '66' : C.border), borderLeft: '3px solid ' + (isBest ? tc(hue) : 'transparent'), padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: tclo(hue), border: '1px solid ' + tc(hue) + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: tc(hue), flexShrink: 0 }}>
                              {r.players?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.players?.name}</div>
                              {isBest && <div style={{ fontSize: 9, color: tc(hue), fontWeight: 700 }}>BAST I LAGET</div>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: isBest ? tc(hue) : C.text }}>{total}</div>
                            <div style={{ fontSize: 9, color: C.textMuted }}>TOTALT</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {r.games.map((g, i) => (
                            <div key={i} style={{ flex: 1, background: C.surface, borderRadius: 6, padding: '6px 4px', textAlign: 'center', border: '1px solid ' + (g === Math.max(...r.games) ? tc(hue) + '44' : C.border) }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: g === Math.max(...r.games) ? tc(hue) : C.text }}>{g}</div>
                              <div style={{ fontSize: 8, color: C.textMuted, marginTop: 2 }}>S{i + 1}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ background: C.surface, borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid ' + C.border }}>
                    <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 700 }}>TOTALT</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: tc(hue) }}>{rs.reduce((a, r) => a + playerTotal(r), 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No player results — show matchpoints only */}
        {results.length === 0 && hasScore && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 8 }}>Detaljerade spelresultat ej registrerade</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: homeWin ? C.accent : C.text }}>{homeTotal}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{shortName(home?.name || '')}</div>
              </div>
              <div style={{ textAlign: 'center', alignSelf: 'center' }}>
                <div style={{ fontSize: 16, color: C.textMuted }}>-</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: awayWin ? C.accent : C.text }}>{awayTotal}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{shortName(away?.name || '')}</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
