'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import LiveLaneViewer from '@/components/LiveLaneViewer'

type Props = { params: Promise<{ id: string }> }
type Lineup = { id: string; team_id: string; player_name: string; bord: number; position: number }
type Result = { id: string; team_id: string; bord: number; position: number; games: number[] }

function shortName(name: string) {
  return name.replace(/ A$/, '').replace(/ H A$/, '').trim()
}

export default function MatchPage({ params }: Props) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [id, setId] = useState<string | null>(null)
  const [match, setMatch] = useState<any>(null)
  const [lineup, setLineup] = useState<Lineup[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    const supabase = createClient()

    const loadAll = async () => {
      const [{ data: m }, { data: lu }, { data: rs }] = await Promise.all([
        supabase.from('matches').select('*, home:teams!home_team_id(id,name,club), away:teams!away_team_id(id,name,club)').eq('id', id).single(),
        supabase.from('match_lineups').select('*').eq('match_id', id).order('bord').order('position'),
        supabase.from('match_results').select('*').eq('match_id', id),
      ])
      setMatch(m)
      setLineup((lu || []) as Lineup[])
      setResults((rs || []) as Result[])
      setLoading(false)
    }

    loadAll()

    // Realtime updates
    const channel = supabase
      .channel('match-' + id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_results', filter: 'match_id=eq.' + id }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_lineups', filter: 'match_id=eq.' + id }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: 'id=eq.' + id }, () => loadAll())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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
  const isLive = match.status === 'live'
  const isUpcoming = match.status === 'upcoming'
  const hasLineup = lineup.length > 0
  const hasStream = match.stream_url && match.stream_url.length > 0

  const homeHue = (home?.name || '').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
  const awayHue = (away?.name || '').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
  const tc = (hue: number) => 'hsl(' + hue + ',50%,45%)'
  const tclo = (hue: number) => theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'

  const getResult = (teamId: string, bord: number, pos: number) =>
    results.find(r => r.team_id === teamId && r.bord === bord && r.position === pos)

  const teamLineup = (teamId: string) =>
    lineup.filter(l => l.team_id === teamId).sort((a, b) => a.bord - b.bord || a.position - b.position)

  const seriesTotal = (teamId: string, gi: number) =>
    results.filter(r => r.team_id === teamId).reduce((sum, r) => sum + ((r.games || [])[gi] || 0), 0)

  const grandTotal = (teamId: string) =>
    [0, 1, 2, 3].reduce((sum, gi) => sum + seriesTotal(teamId, gi), 0)

  const hHomeTotal = grandTotal(match.home_team_id)
  const hAwayTotal = grandTotal(match.away_team_id)

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>

        <a href="/" style={{ fontSize: 13, color: C.textMuted, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>&larr; Hem</a>

        {/* Match header */}
        <div style={{ background: C.card, borderRadius: 16, border: '1px solid ' + C.border, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ background: C.surface, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid ' + C.border }}>
            <div style={{ fontSize: 12, color: C.textMuted }}>{match.date?.slice(0, 10)}{match.venue ? ' · ' + match.venue : ''}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {match.oil_profile && <span style={{ fontSize: 10, color: C.textMuted, background: C.card, borderRadius: 6, padding: '2px 8px', border: '1px solid ' + C.border }}>{match.oil_profile}</span>}
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: isLive ? (theme === 'dark' ? '#0a3a1a' : '#e8f5ee') : isUpcoming ? (theme === 'dark' ? '#0a1a3a' : '#e8f0ff') : (theme === 'dark' ? '#1a1a2a' : '#f0f2f5'), color: isLive ? C.green : isUpcoming ? C.accent : C.textMuted, letterSpacing: 1 }}>
                {isLive ? '● LIVE' : isUpcoming ? 'KOMMANDE' : 'AVSLUTAD'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, padding: '28px 24px', alignItems: 'center' }}>
            <div>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: tclo(homeHue), border: '2px solid ' + tc(homeHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: tc(homeHue), marginBottom: 10 }}>
                {shortName(home?.name || '').split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()}
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, color: homeWin ? C.accent : C.text }}>{shortName(home?.name || '')}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Hemmalag</div>
            </div>

            <div style={{ textAlign: 'center', minWidth: 160 }}>
              {hasScore ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 6 }}>
                    <span style={{ fontSize: 44, fontWeight: 900, color: homeWin ? C.accent : C.text, lineHeight: 1 }}>{homeTotal}</span>
                    <span style={{ fontSize: 22, color: C.textMuted }}>-</span>
                    <span style={{ fontSize: 44, fontWeight: 900, color: awayWin ? C.accent : C.text, lineHeight: 1 }}>{awayTotal}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 1.5 }}>MATCHPOANG</div>
                  {hHomeTotal > 0 && (
                    <div style={{ marginTop: 8, fontSize: 13, color: C.textMuted }}>
                      {hHomeTotal.toLocaleString('sv-SE')} - {hAwayTotal.toLocaleString('sv-SE')} <span style={{ fontSize: 10 }}>pins</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 22, fontWeight: 700, color: C.textMuted }}>vs</div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: tclo(awayHue), border: '2px solid ' + tc(awayHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: tc(awayHue), marginBottom: 10, marginLeft: 'auto' }}>
                {shortName(away?.name || '').split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()}
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, color: awayWin ? C.accent : C.text }}>{shortName(away?.name || '')}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Bortalag</div>
            </div>
          </div>

          {/* Series breakdown */}
          {hasLineup && (
            <div style={{ borderTop: '1px solid ' + C.border, padding: '16px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4,60px) 80px 1fr', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textAlign: 'right' }}>{shortName(home?.name || '').toUpperCase()}</div>
                {['S1','S2','S3','S4'].map(s => <div key={s} style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textAlign: 'center' }}>{s}</div>)}
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textAlign: 'center' }}>TOTAL</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted }}>{shortName(away?.name || '').toUpperCase()}</div>
              </div>
              {[0,1,2,3].map(gi => {
                const ht = seriesTotal(match.home_team_id, gi)
                const at = seriesTotal(match.away_team_id, gi)
                const hWins = ht > at
                const aWins = at > ht
                return (
                  <div key={gi} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4,60px) 80px 1fr', gap: 8, alignItems: 'center', padding: '6px 0', borderTop: '1px solid ' + C.border }}>
                    <div style={{ fontWeight: hWins ? 800 : 400, fontSize: 15, color: hWins ? C.accent : C.text, textAlign: 'right' }}>{ht || '—'}</div>
                    {[0,1,2,3].map(g2 => <div key={g2} style={{ textAlign: 'center', fontSize: 10, color: C.textMuted }}>{g2 === gi ? '●' : ''}</div>)}
                    <div style={{ textAlign: 'center', fontSize: 10, color: C.textMuted }}>Serie {gi + 1}</div>
                    <div style={{ fontWeight: aWins ? 800 : 400, fontSize: 15, color: aWins ? C.accent : C.text }}>{at || '—'}</div>
                  </div>
                )
              })}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4,60px) 80px 1fr', gap: 8, alignItems: 'center', padding: '8px 0', borderTop: '2px solid ' + C.border }}>
                <div style={{ fontWeight: 900, fontSize: 17, color: hHomeTotal > hAwayTotal ? C.accent : C.text, textAlign: 'right' }}>{hHomeTotal || '—'}</div>
                <div style={{ gridColumn: '2/6' }} />
                <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: C.textMuted }}>TOTALT</div>
                <div style={{ fontWeight: 900, fontSize: 17, color: hAwayTotal > hHomeTotal ? C.accent : C.text }}>{hAwayTotal || '—'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Player scorecards */}
        {hasLineup && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { teamId: match.home_team_id, hue: homeHue, name: home?.name },
              { teamId: match.away_team_id, hue: awayHue, name: away?.name },
            ].map(({ teamId, hue, name }) => {
              const tl = teamLineup(teamId)
              if (tl.length === 0) return null
              const tResults = results.filter(r => r.team_id === teamId)
              const serTotals = [0,1,2,3].map(gi => tResults.reduce((s, r) => s + ((r.games||[])[gi]||0), 0))
              const gt = serTotals.reduce((a,b) => a+b, 0)
              return (
                <div key={teamId} style={{ background: C.card, borderRadius: 14, border: '1px solid ' + C.border, overflow: 'hidden' }}>
                  <div style={{ background: C.surface, padding: '12px 16px', borderBottom: '1px solid ' + C.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: tc(hue) }}>{shortName(name || '').toUpperCase()}</div>
                    {isLive && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#e05555', fontWeight: 700 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e05555', display: 'inline-block' }} />
                        LIVE
                      </span>
                    )}
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: C.surface }}>
                          <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1, borderBottom: '1px solid ' + C.border, whiteSpace: 'nowrap' }}>SPELARE</th>
                          {['S1','S2','S3','S4'].map(s => (
                            <th key={s} style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.textMuted, borderBottom: '1px solid ' + C.border, minWidth: 52 }}>{s}</th>
                          ))}
                          <th style={{ padding: '8px 16px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.accent, borderBottom: '1px solid ' + C.border, minWidth: 64 }}>TOTALT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tl.map((p, i) => {
                          const r = getResult(teamId, p.bord, p.position)
                          const games = r?.games || []
                          const total = games.reduce((a, b) => a + b, 0)
                          const isTop = total === Math.max(...tl.map(pl => {
                            const pr = getResult(teamId, pl.bord, pl.position)
                            return (pr?.games || []).reduce((a, b) => a + b, 0)
                          })) && total > 0
                          return (
                            <tr key={p.id} style={{ borderBottom: '1px solid ' + C.border, background: isTop ? (theme === 'dark' ? 'rgba(245,194,0,0.04)' : 'rgba(10,92,138,0.03)') : 'transparent' }}>
                              <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: tclo(hue), border: '1px solid ' + tc(hue) + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: tc(hue), flexShrink: 0 }}>
                                    {p.player_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: isTop ? 700 : 500, color: C.text }}>{p.player_name}</div>
                                    <div style={{ fontSize: 9, color: C.textMuted }}>Bord {p.bord}</div>
                                  </div>
                                  {isTop && <span style={{ fontSize: 9, color: tc(hue), fontWeight: 800, background: tclo(hue), borderRadius: 4, padding: '1px 5px' }}>BAST</span>}
                                </div>
                              </td>
                              {[0,1,2,3].map(gi => {
                                const g = games[gi]
                                const isEmpty = g === undefined || g === 0
                                return (
                                  <td key={gi} style={{ padding: '10px 12px', textAlign: 'center', fontSize: 14, fontWeight: g >= 200 ? 700 : 400, color: isEmpty ? C.textMuted : g >= 250 ? tc(hue) : g >= 200 ? C.green : C.text }}>
                                    {isEmpty ? <span style={{ opacity: 0.3 }}>—</span> : g}
                                  </td>
                                )
                              })}
                              <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 800, fontSize: 15, color: isTop ? tc(hue) : total > 0 ? C.accent : C.textMuted }}>
                                {total > 0 ? total : <span style={{ opacity: 0.3 }}>—</span>}
                              </td>
                            </tr>
                          )
                        })}
                        {/* Team total row */}
                        <tr style={{ background: C.surface, borderTop: '2px solid ' + C.border }}>
                          <td style={{ padding: '10px 16px', fontSize: 11, fontWeight: 800, color: C.textMuted }}>LAGTOTAL</td>
                          {serTotals.map((t, i) => (
                            <td key={i} style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, fontSize: 14, color: t > 0 ? C.text : C.textMuted }}>
                              {t > 0 ? t : '—'}
                            </td>
                          ))}
                          <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 900, fontSize: 16, color: tc(hue) }}>
                            {gt > 0 ? gt.toLocaleString('sv-SE') : '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Upcoming - no lineup yet */}
        {!hasLineup && isUpcoming && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎳</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>Kommande match</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Lineup och live scoring visas nar matchen borjar</div>
          </div>
        )}

        {/* Completed - no lineup */}
        {!hasLineup && !isUpcoming && !isLive && hasScore && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>Detaljerade spelresultat ej registrerade</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: homeWin ? C.accent : C.text }}>{homeTotal}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{shortName(home?.name || '')}</div>
              </div>
              <div style={{ alignSelf: 'center', fontSize: 20, color: C.textMuted }}>-</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: awayWin ? C.accent : C.text }}>{awayTotal}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{shortName(away?.name || '')}</div>
              </div>
            </div>
          </div>
        )}

        {/* Scoring link for completed matches */}
        {hasStream && !isLive && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: C.card, borderRadius: 10, border: '1px solid ' + C.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: C.textMuted }}>Scoring fran matchen</div>
            <a href={match.stream_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.accent, fontWeight: 700, textDecoration: 'none' }}>
              Oppna scoring &#8599;
            </a>
          </div>
        )}

        {/* Live stream viewer */}
        {hasStream && isLive && (
          <div style={{ marginTop: 16, background: C.card, borderRadius: 14, border: '1px solid ' + C.border, overflow: 'hidden' }}>
            {match.stream_url.includes('scoring.se') ? (
              <LiveLaneViewer streamUrl={match.stream_url} matchName={shortName(home?.name || '') + ' vs ' + shortName(away?.name || '')} />
            ) : (
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: C.textMuted }}>Live scoring</div>
                <a href={match.stream_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.accent, fontWeight: 700, textDecoration: 'none' }}>
                  Oppna scoring &#8599;
                </a>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}
