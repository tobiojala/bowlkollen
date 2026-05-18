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
  return name.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').trim()
}

function initials(name: string) {
  return shortName(name).split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()
}

function divisionColor(division: string | null) {
  if (!division) return '#6b7a99'
  if (division.includes('Herrar')) return '#4a90d9'
  if (division.includes('Damer')) return '#d94a90'
  if (division.includes('SM') || division.includes('slutspel')) return '#f5c200'
  return '#6b7a99'
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
    const channel = supabase
      .channel('match-' + id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_results', filter: 'match_id=eq.' + id }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_lineups', filter: 'match_id=eq.' + id }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: 'id=eq.' + id }, () => loadAll())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: C.textMuted }}>Laddar...</div>
    </main>
  )

  if (!match) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: C.textMuted }}>Match hittades inte</div>
    </main>
  )

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
  const divColor = divisionColor(match.division)

  const homeHue = (home?.name || '').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
  const awayHue = (away?.name || '').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
  const tc = (hue: number) => 'hsl(' + hue + ',50%,45%)'
  const tclo = (hue: number) => theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'

  const getResult = (teamId: string, bord: number, pos: number) =>
    results.find(r => r.team_id === teamId && r.bord === bord && r.position === pos)

  const seriesTotal = (teamId: string, gi: number) =>
    results.filter(r => r.team_id === teamId).reduce((s, r) => s + ((r.games || [])[gi] || 0), 0)

  const grandTotal = (teamId: string) =>
    [0,1,2,3].reduce((s, gi) => s + seriesTotal(teamId, gi), 0)

  const teamLineup = (teamId: string) =>
    lineup.filter(l => l.team_id === teamId).sort((a, b) => a.bord - b.bord || a.position - b.position)

  const hGrand = grandTotal(match.home_team_id)
  const aGrand = grandTotal(match.away_team_id)

  // Best player across both teams
  const allPlayers = lineup.map(p => {
    const r = getResult(p.team_id, p.bord, p.position)
    const total = (r?.games || []).reduce((a, b) => a + b, 0)
    return { ...p, total }
  })
  const bestPlayer = allPlayers.length > 0 ? allPlayers.reduce((best, p) => p.total > best.total ? p : best) : null

  const dateStr = match.date ? new Date(match.date).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : ''
  const timeStr = match.date ? new Date(match.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px 48px' }}>

        <a href="/" style={{ fontSize: 12, color: C.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          ← Tillbaka
        </a>

        {/* Match hero card */}
        <div style={{ background: C.card, borderRadius: 16, border: '1px solid ' + C.border, overflow: 'hidden', marginBottom: 16 }}>

          {/* Top meta bar */}
          <div style={{ background: C.surface, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid ' + C.border }}>
            <div style={{ fontSize: 11, color: C.textMuted }}>{dateStr}{timeStr ? ' · ' + timeStr : ''}</div>
            {match.venue && <div style={{ fontSize: 11, color: C.textMuted }}>· {match.venue}</div>}
            {match.round && <div style={{ fontSize: 11, color: C.textMuted }}>· Omgång {match.round}</div>}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
              {match.division && (
                <span style={{ fontSize: 10, fontWeight: 700, color: divColor, background: divColor + '18', borderRadius: 6, padding: '2px 8px' }}>
                  {match.division}
                </span>
              )}
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: isLive ? (theme === 'dark' ? '#0a3a1a' : '#e8f5ee') : isUpcoming ? (theme === 'dark' ? '#0a1a3a' : '#e8f0ff') : (theme === 'dark' ? '#1a1a2a' : '#f0f2f5'), color: isLive ? C.green : isUpcoming ? C.accent : C.textMuted, letterSpacing: 0.5 }}>
                {isLive ? '● LIVE' : isUpcoming ? 'KOMMANDE' : 'AVSLUTAD'}
              </span>
            </div>
          </div>

          {/* Teams and score */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, padding: '24px 20px', alignItems: 'center' }}>

            {/* Home */}
            <a href={'/teams/' + home?.id} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: tclo(homeHue), border: '2px solid ' + tc(homeHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: tc(homeHue) }}>
                {initials(home?.name || '')}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: homeWin ? C.text : C.textMuted, lineHeight: 1.2 }}>{shortName(home?.name || '')}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Hemmalag</div>
              </div>
            </a>

            {/* Score */}
            <div style={{ textAlign: 'center', minWidth: 100 }}>
              {hasScore ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ fontSize: 42, fontWeight: 900, color: homeWin ? C.accent : C.text, lineHeight: 1 }}>{homeTotal}</span>
                    <span style={{ fontSize: 18, color: C.textMuted, fontWeight: 300 }}>-</span>
                    <span style={{ fontSize: 42, fontWeight: 900, color: awayWin ? C.accent : C.text, lineHeight: 1 }}>{awayTotal}</span>
                  </div>
                  <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1.5, marginTop: 4 }}>MATCHPOANG</div>
                  {hGrand > 0 && (
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>
                      {hGrand.toLocaleString('sv')} - {aGrand.toLocaleString('sv')} <span style={{ fontSize: 10 }}>pins</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 20, color: C.textMuted, fontWeight: 300 }}>vs</div>
              )}
            </div>

            {/* Away */}
            <a href={'/teams/' + away?.id} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: tclo(awayHue), border: '2px solid ' + tc(awayHue), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: tc(awayHue) }}>
                {initials(away?.name || '')}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: awayWin ? C.text : C.textMuted, lineHeight: 1.2 }}>{shortName(away?.name || '')}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Bortalag</div>
              </div>
            </a>
          </div>

          {/* Serie breakdown — only when lineup data exists */}
          {hasLineup && (
            <div style={{ borderTop: '1px solid ' + C.border }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: C.surface }}>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1 }}>SERIE</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: tc(homeHue) }}>{shortName(home?.name || '').toUpperCase()}</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.textMuted }}>BANP</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: tc(awayHue) }}>{shortName(away?.name || '').toUpperCase()}</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.textMuted }}>BANP</th>
                  </tr>
                </thead>
                <tbody>
                  {[0,1,2,3].map(gi => {
                    const ht = seriesTotal(match.home_team_id, gi)
                    const at = seriesTotal(match.away_team_id, gi)
                    if (ht === 0 && at === 0) return null
                    const hWins = ht > at
                    const aWins = at > ht
                    // Count banp per serie — each bord pair contributes 1 banp to winner
                    let hBanp = 0, aBanp = 0
                    for (let bord = 1; bord <= 4; bord++) {
                      for (let pos = 1; pos <= 2; pos++) {
                        const hr = getResult(match.home_team_id, bord, pos)
                        const ar = getResult(match.away_team_id, bord, pos)
                        const hg = (hr?.games || [])[gi] || 0
                        const ag = (ar?.games || [])[gi] || 0
                        if (hg > ag) hBanp++
                        else if (ag > hg) aBanp++
                      }
                    }
                    return (
                      <tr key={gi} style={{ borderBottom: '1px solid ' + C.border }}>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: C.textMuted, fontWeight: 600 }}>Serie {gi + 1}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 15, fontWeight: hWins ? 800 : 400, color: hWins ? C.accent : C.text }}>{ht || '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: hBanp > 0 ? C.green : C.textMuted }}>{hBanp > 0 ? hBanp : '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'left', fontSize: 15, fontWeight: aWins ? 800 : 400, color: aWins ? C.accent : C.text }}>{at || '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: aBanp > 0 ? C.green : C.textMuted }}>{aBanp > 0 ? aBanp : '—'}</td>
                      </tr>
                    )
                  })}
                  {/* Totals row */}
                  <tr style={{ background: C.surface, borderTop: '2px solid ' + C.border }}>
                    <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 800, color: C.textMuted }}>RESULTAT</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 16, fontWeight: 900, color: homeWin ? C.accent : C.text }}>{homeTotal ?? '—'}</td>
                    <td style={{ padding: '10px 12px' }} />
                    <td style={{ padding: '10px 12px', textAlign: 'left', fontSize: 16, fontWeight: 900, color: awayWin ? C.accent : C.text }}>{awayTotal ?? '—'}</td>
                    <td style={{ padding: '10px 12px' }} />
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Oil profile */}
          {match.oil_profile && (
            <div style={{ borderTop: '1px solid ' + C.border, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: C.textMuted }}>Oljeprofil:</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{match.oil_profile}</span>
            </div>
          )}
        </div>

        {/* Best player highlight */}
        {bestPlayer && bestPlayer.total > 0 && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 20 }}>🏆</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 2 }}>BASTA SPELARE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{bestPlayer.player_name}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{shortName(lineup.find(l => l.id === bestPlayer.id && l.team_id === bestPlayer.team_id)?.player_name || '')} · {bestPlayer.total} pins</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: C.accent, lineHeight: 1 }}>{bestPlayer.total}</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>TOTALT</div>
            </div>
          </div>
        )}

        {/* Player scorecards */}
        {hasLineup && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {[
              { teamId: match.home_team_id, hue: homeHue, name: home?.name },
              { teamId: match.away_team_id, hue: awayHue, name: away?.name },
            ].map(({ teamId, hue, name }) => {
              const tl = teamLineup(teamId)
              if (tl.length === 0) return null
              const tResults = results.filter(r => r.team_id === teamId)
              const serTotals = [0,1,2,3].map(gi => tResults.reduce((s, r) => s + ((r.games||[])[gi]||0), 0))
              const gt = serTotals.reduce((a,b) => a+b, 0)
              const topTotal = Math.max(...tl.map(p => {
                const r = getResult(teamId, p.bord, p.position)
                return (r?.games || []).reduce((a,b) => a+b, 0)
              }))
              return (
                <div key={teamId} style={{ background: C.card, borderRadius: 14, border: '1px solid ' + C.border, overflow: 'hidden' }}>
                  <div style={{ background: C.surface, padding: '10px 16px', borderBottom: '1px solid ' + C.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: tc(hue) }}>{shortName(name || '').toUpperCase()}</div>
                    {gt > 0 && <div style={{ fontSize: 12, color: C.textMuted }}>{gt.toLocaleString('sv')} pins totalt</div>}
                    {isLive && <span style={{ fontSize: 10, color: '#e05555', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e05555', display: 'inline-block' }} />LIVE</span>}
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 320 }}>
                      <thead>
                        <tr style={{ background: C.surface, borderBottom: '1px solid ' + C.border }}>
                          <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1 }}>SPELARE</th>
                          {['S1','S2','S3','S4'].map(s => (
                            <th key={s} style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.textMuted, minWidth: 44 }}>{s}</th>
                          ))}
                          <th style={{ padding: '8px 16px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.accent, minWidth: 52 }}>TOT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tl.map((p, idx) => {
                          const r = getResult(teamId, p.bord, p.position)
                          const games = r?.games || []
                          const total = games.reduce((a, b) => a + b, 0)
                          const isTop = total === topTotal && total > 0
                          return (
                            <tr key={p.id} style={{ borderBottom: '1px solid ' + C.border, background: isTop ? (theme === 'dark' ? 'rgba(245,194,0,0.04)' : 'rgba(10,92,138,0.03)') : 'transparent' }}>
                              <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: tclo(hue), border: '1px solid ' + tc(hue) + '66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: tc(hue), flexShrink: 0 }}>
                                    {p.player_name.split(' ').map((w:string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: isTop ? 700 : 500, color: C.text }}>{p.player_name}</div>
                                    <div style={{ fontSize: 9, color: C.textMuted }}>Bord {p.bord}</div>
                                  </div>
                                  {isTop && <span style={{ fontSize: 9, color: tc(hue), fontWeight: 800, background: tclo(hue), borderRadius: 4, padding: '1px 5px', marginLeft: 4 }}>BAST</span>}
                                </div>
                              </td>
                              {[0,1,2,3].map(gi => {
                                const g = games[gi]
                                const isEmpty = g === undefined || g === 0
                                return (
                                  <td key={gi} style={{ padding: '10px', textAlign: 'center', fontSize: 14, fontWeight: g >= 200 ? 700 : 400, color: isEmpty ? C.textMuted : g >= 250 ? tc(hue) : g >= 200 ? C.green : C.text }}>
                                    {isEmpty ? <span style={{ opacity: 0.25 }}>—</span> : g}
                                  </td>
                                )
                              })}
                              <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 800, fontSize: 15, color: isTop ? tc(hue) : total > 0 ? C.accent : C.textMuted }}>
                                {total > 0 ? total : <span style={{ opacity: 0.25 }}>—</span>}
                              </td>
                            </tr>
                          )
                        })}
                        <tr style={{ background: C.surface, borderTop: '2px solid ' + C.border }}>
                          <td style={{ padding: '10px 16px', fontSize: 11, fontWeight: 800, color: C.textMuted }}>LAGTOTAL</td>
                          {serTotals.map((t, i) => (
                            <td key={i} style={{ padding: '10px', textAlign: 'center', fontWeight: 700, fontSize: 14, color: t > 0 ? C.text : C.textMuted }}>
                              {t > 0 ? t : '—'}
                            </td>
                          ))}
                          <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 900, fontSize: 16, color: tc(hue) }}>
                            {gt > 0 ? gt.toLocaleString('sv') : '—'}
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

        {/* No lineup — upcoming */}
        {!hasLineup && isUpcoming && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 32, textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🎳</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>Kommande match</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Lineup och live scoring visas nar matchen borjar</div>
          </div>
        )}

        {/* No lineup — completed without data */}
        {!hasLineup && !isUpcoming && !isLive && hasScore && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: '20px 16px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: C.textMuted }}>Detaljerade spelresultat ej registrerade</div>
          </div>
        )}

        {/* Live lane viewer */}
        {hasStream && isLive && (
          <div style={{ background: C.card, borderRadius: 14, border: '1px solid #e05555', overflow: 'hidden', marginBottom: 16 }}>
            {match.stream_url.includes('scoring.se') ? (
              <LiveLaneViewer streamUrl={match.stream_url} matchName={shortName(home?.name || '') + ' vs ' + shortName(away?.name || '')} />
            ) : (
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: C.textMuted }}>Live scoring</div>
                <a href={match.stream_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.accent, fontWeight: 700, textDecoration: 'none' }}>
                  Oppna &#8599;
                </a>
              </div>
            )}
          </div>
        )}

        {/* Scoring link for completed */}
        {hasStream && !isLive && (
          <div style={{ padding: '10px 14px', background: C.card, borderRadius: 10, border: '1px solid ' + C.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: C.textMuted }}>Scoring fran matchen</div>
            <a href={match.stream_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.accent, fontWeight: 700, textDecoration: 'none' }}>
              Oppna scoring &#8599;
            </a>
          </div>
        )}

      </div>
    </main>
  )
}
