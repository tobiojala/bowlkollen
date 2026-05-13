import React from 'react'
import { createClient } from '@/lib/supabase'

const bg = '#10161e'
const surface = '#172030'
const card = '#1c2840'
const border = '#2a3858'
const accent = '#f5c200'
const textMuted = '#6b7a99'
const green = '#4caf7d'

type Props = { params: Promise<{ id: string }> }

type Result = {
  id: string
  player_id: string
  team_id: string
  round: string
  games: number[]
  players: { name: string }
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params
  const supabase = createClient()

  const { data: match } = await supabase
    .from('matches')
    .select('*, home:teams!home_team_id(id,name,club), away:teams!away_team_id(id,name,club)')
    .eq('id', id)
    .single()

  const { data: results } = await supabase
    .from('match_results')
    .select('id, player_id, team_id, round, games, players(name)')
    .eq('match_id', id)
    .eq('type', 'league')
    .order('created_at')

  if (!match) {
    return (
      <main style={{ minHeight: '100vh', background: bg, color: 'white', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: textMuted }}>Match hittades inte</div>
      </main>
    )
  }

  const home = match.home as { id: string; name: string; club: string }
  const away = match.away as { id: string; name: string; club: string }
  const allResults = (results || []) as Result[]

  const homeResults = allResults.filter(r => r.team_id === match.home_team_id)
  const awayResults = allResults.filter(r => r.team_id === match.away_team_id)

  const teamTotal = (rs: Result[]) => rs.flatMap(r => r.games || []).reduce((a, b) => a + b, 0)
  const playerTotal = (r: Result) => (r.games || []).reduce((a, b) => a + b, 0)
  const playerAvg = (r: Result) => r.games.length > 0 ? Math.round((playerTotal(r) / r.games.length) * 10) / 10 : 0

  const homeTotal = teamTotal(homeResults)
  const awayTotal = teamTotal(awayResults)
  const homeWin = homeTotal > awayTotal
  const awayWin = awayTotal > homeTotal

  const bestInTeam = (rs: Result[]) => rs.length === 0 ? null : rs.reduce((best, r) => playerTotal(r) > playerTotal(best) ? r : best)
  const homeBest = bestInTeam(homeResults)
  const awayBest = bestInTeam(awayResults)

  const homeHue = home?.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360 || 200
  const awayHue = away?.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360 || 120
  const homeTc = 'hsl(' + homeHue + ',50%,55%)'
  const awayTc = 'hsl(' + awayHue + ',50%,55%)'

  return (
    <main style={{ minHeight: '100vh', background: bg, color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        <a href="/" style={{ fontSize: 13, color: textMuted, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
          Hem
        </a>

        {/* Match hero */}
        <div style={{ background: card, borderRadius: 16, border: '1px solid ' + border, overflow: 'hidden', marginBottom: 24 }}>

          {/* Status bar */}
          <div style={{ background: surface, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid ' + border }}>
            <div style={{ fontSize: 12, color: textMuted }}>{match.date}</div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: match.status === 'live' ? '#0a3a1a' : '#1a1a2a', color: match.status === 'live' ? green : textMuted, letterSpacing: 1 }}>
              {match.status === 'live' ? '* LIVE' : match.status === 'completed' ? 'AVSLUTAD' : 'KOMMANDE'}
            </span>
          </div>

          {/* Score */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, padding: '28px 24px', alignItems: 'center' }}>
            <div style={{ textAlign: 'left' }}>
              <a href={'/teams/' + home?.id} style={{ textDecoration: 'none' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'hsl(' + homeHue + ',40%,15%)', border: '2px solid ' + homeTc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: homeTc, marginBottom: 10 }}>
                  {home?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: homeWin ? accent : 'white', marginBottom: 3 }}>{home?.name}</div>
                <div style={{ fontSize: 12, color: textMuted }}>{home?.club}</div>
              </a>
            </div>

            <div style={{ textAlign: 'center', minWidth: 140 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 6 }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: homeWin ? accent : 'white' }}>{homeTotal}</span>
                <span style={{ fontSize: 20, color: textMuted }}>-</span>
                <span style={{ fontSize: 40, fontWeight: 900, color: awayWin ? accent : 'white' }}>{awayTotal}</span>
              </div>
              <div style={{ fontSize: 10, color: textMuted, letterSpacing: 1.5 }}>KAGLEPOANG</div>
              {(homeTotal > 0 || awayTotal > 0) && (
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: homeWin ? accent : awayWin ? accent : textMuted }}>
                  {homeWin ? home?.name + ' vinner' : awayWin ? away?.name + ' vinner' : 'Lika'}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <a href={'/teams/' + away?.id} style={{ textDecoration: 'none' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'hsl(' + awayHue + ',40%,15%)', border: '2px solid ' + awayTc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: awayTc, marginBottom: 10, marginLeft: 'auto' }}>
                  {away?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: awayWin ? accent : 'white', marginBottom: 3 }}>{away?.name}</div>
                <div style={{ fontSize: 12, color: textMuted }}>{away?.club}</div>
              </a>
            </div>
          </div>

          {/* Best players */}
          {(homeBest || awayBest) && (
            <div style={{ borderTop: '1px solid ' + border, padding: '14px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[{ best: homeBest, tc: homeTc }, { best: awayBest, tc: awayTc }].map(({ best, tc }, i) => best ? (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: i === 1 ? 'flex-end' : 'flex-start' }}>
                  {i === 0 && (
                    <>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: tc + '33', border: '1px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: tc, flexShrink: 0 }}>
                        {best.players?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: textMuted, marginBottom: 2 }}>BAST SPELARE</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{best.players?.name}</div>
                        <div style={{ fontSize: 12, color: tc }}>{playerTotal(best)} pins</div>
                      </div>
                    </>
                  )}
                  {i === 1 && (
                    <>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: textMuted, marginBottom: 2 }}>BAST SPELARE</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{best.players?.name}</div>
                        <div style={{ fontSize: 12, color: tc }}>{playerTotal(best)} pins</div>
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: tc + '33', border: '1px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: tc, flexShrink: 0 }}>
                        {best.players?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    </>
                  )}
                </div>
              ) : <div key={i} />)}
            </div>
          )}
        </div>

        {/* Player scorecards */}
        {allResults.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { results: homeResults, team: home, tc: homeTc, hue: homeHue },
              { results: awayResults, team: away, tc: awayTc, hue: awayHue },
            ].map(({ results: rs, team, tc, hue }) => (
              <div key={team?.id}>
                <div style={{ fontSize: 11, fontWeight: 700, color: tc, letterSpacing: 1, marginBottom: 10 }}>
                  {team?.name?.toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rs.sort((a, b) => playerTotal(b) - playerTotal(a)).map(r => {
                    const total = playerTotal(r)
                    const avg = playerAvg(r)
                    const isBest = r === bestInTeam(rs)
                    return (
                      <div key={r.id} style={{ background: card, borderRadius: 12, border: '1px solid ' + (isBest ? tc + '66' : border), borderLeft: '3px solid ' + (isBest ? tc : 'transparent'), padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'hsl(' + hue + ',40%,15%)', border: '1px solid ' + tc + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: tc, flexShrink: 0 }}>
                              {r.players?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{r.players?.name}</div>
                              {isBest && <div style={{ fontSize: 9, color: tc, fontWeight: 700, letterSpacing: 0.5 }}>BAST I LAGET</div>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: isBest ? tc : 'white' }}>{total}</div>
                            <div style={{ fontSize: 9, color: textMuted }}>SNT {avg}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {r.games.map((g, i) => (
                            <div key={i} style={{ flex: 1, background: surface, borderRadius: 6, padding: '6px 4px', textAlign: 'center', border: '1px solid ' + (g === Math.max(...r.games) ? tc + '44' : border) }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: g === Math.max(...r.games) ? tc : 'white' }}>{g}</div>
                              <div style={{ fontSize: 8, color: textMuted, marginTop: 2 }}>S{i + 1}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ background: surface, borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid ' + border }}>
                    <span style={{ fontSize: 12, color: textMuted, fontWeight: 700 }}>TOTALT</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: tc }}>{teamTotal(rs)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {allResults.length === 0 && (
          <div style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: 32, textAlign: 'center', color: textMuted, fontSize: 13 }}>
            Inga resultat registrerade for denna match annu
          </div>
        )}

      </div>
    </main>
  )
}
