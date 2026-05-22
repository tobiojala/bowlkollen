'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { Trophy } from 'lucide-react'
import LiveLaneViewer from '@/components/LiveLaneViewer'
import { shortName } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }
type Lineup = { id: string; team_id: string; player_name: string; bord: number; position: number }
type Result = { id: string; team_id: string; bord: number; position: number; games: number[] }

function divisionColor(division: string | null): string {
  if (!division) return '#6b7a99'
  if (division.includes('SM') || division.includes('slutspel')) return '#f5c200'
  if (division.includes('Damer')) return '#d94a90'
  if (division.includes('Elitserien')) return '#4a90d9'
  if (division.includes('Allsvenskan')) return '#5ba85a'
  return '#8a7a5a'
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

  const getResult = (teamId: string, bord: number, pos: number) =>
    results.find(r => r.team_id === teamId && r.bord === bord && r.position === pos)

  const seriesTotal = (teamId: string, gi: number) =>
    results.filter(r => r.team_id === teamId).reduce((s, r) => s + ((r.games || [])[gi] || 0), 0)

  const grandTotal = (teamId: string) =>
    [0, 1, 2, 3].reduce((s, gi) => s + seriesTotal(teamId, gi), 0)

  const teamLineup = (teamId: string) =>
    lineup.filter(l => l.team_id === teamId).sort((a, b) => a.bord - b.bord || a.position - b.position)

  const hGrand = grandTotal(match.home_team_id)
  const aGrand = grandTotal(match.away_team_id)

  const allPlayers = lineup.map(p => {
    const r = getResult(p.team_id, p.bord, p.position)
    const total = (r?.games || []).reduce((a, b) => a + b, 0)
    return { ...p, total }
  })
  const bestPlayer = allPlayers.length > 0 ? allPlayers.reduce((best, p) => p.total > best.total ? p : best) : null

  const dateStr = match.date ? new Date(match.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }) : ''
  const timeStr = match.date ? new Date(match.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : ''

  const sectionHeader = (label: string, right?: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 6px', borderBottom: '1px solid ' + C.border }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: divColor, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>{label}</span>
      </div>
      {right}
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 48 }}>

        {/* Division + status bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid ' + C.border }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: divColor, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: divColor }}>{match.division || 'Match'}</span>
          {match.round && <span style={{ fontSize: 11, color: C.textMuted }}>· Omgång {match.round}</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {isLive && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, color: '#e05555' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e05555', display: 'inline-block' }} />LIVE
              </span>
            )}
            {isUpcoming && <span style={{ fontSize: 10, fontWeight: 700, color: C.accent }}>KOMMANDE</span>}
            {!isLive && !isUpcoming && <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted }}>AVSLUTAD</span>}
          </div>
        </div>

        {/* Score hero */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, padding: '24px 16px 20px', borderBottom: '1px solid ' + C.border, alignItems: 'center' }}>
          <a href={'/teams/' + home?.id} style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: hasScore ? (homeWin ? C.text : C.textMuted) : C.text, lineHeight: 1.2, textAlign: 'right' }}>
              {shortName(home?.name || '')}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, textAlign: 'right', marginTop: 3 }}>Hemmalag</div>
          </a>

          <div style={{ textAlign: 'center', minWidth: 90 }}>
            {hasScore ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: homeWin ? C.accent : C.textMuted, lineHeight: 1 }}>{homeTotal}</span>
                  <span style={{ fontSize: 16, color: C.textMuted, fontWeight: 300 }}>–</span>
                  <span style={{ fontSize: 40, fontWeight: 900, color: awayWin ? C.accent : C.textMuted, lineHeight: 1 }}>{awayTotal}</span>
                </div>
                <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1.5, marginTop: 4 }}>MATCHPOÄNG</div>
                {hGrand > 0 && (
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
                    {hGrand.toLocaleString('sv')} – {aGrand.toLocaleString('sv')} <span style={{ fontSize: 10 }}>pins</span>
                  </div>
                )}
              </>
            ) : (
              <span style={{ fontSize: 18, color: C.textMuted, fontWeight: 300 }}>vs</span>
            )}
          </div>

          <a href={'/teams/' + away?.id} style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: hasScore ? (awayWin ? C.text : C.textMuted) : C.text, lineHeight: 1.2 }}>
              {shortName(away?.name || '')}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>Bortalag</div>
          </a>
        </div>

        {/* Date / venue / oil */}
        {(dateStr || match.venue || match.oil_profile) && (
          <div style={{ display: 'flex', gap: 12, padding: '10px 16px', borderBottom: '1px solid ' + C.border, flexWrap: 'wrap' }}>
            {dateStr && <span style={{ fontSize: 11, color: C.textMuted }}>{dateStr}{timeStr ? ' · ' + timeStr : ''}</span>}
            {match.venue && <span style={{ fontSize: 11, color: C.textMuted }}>· {match.venue}</span>}
            {match.oil_profile && <span style={{ fontSize: 11, color: C.textMuted }}>· Olja: {match.oil_profile}</span>}
          </div>
        )}

        {/* Stream — live */}
        {hasStream && isLive && (
          <div style={{ borderBottom: '1px solid #e05555' }}>
            {match.stream_url.includes('scoring.se') ? (
              <LiveLaneViewer streamUrl={match.stream_url} matchName={shortName(home?.name || '') + ' vs ' + shortName(away?.name || '')} />
            ) : (
              <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: C.textMuted }}>Live scoring</span>
                <a href={match.stream_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.accent, fontWeight: 700, textDecoration: 'none' }}>Öppna ↗</a>
              </div>
            )}
          </div>
        )}

        {/* Series breakdown */}
        {hasLineup && (
          <>
            {sectionHeader('SERIE PER SERIE')}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid ' + C.border }}>
                  <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1 }}></th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: tc(homeHue) }}>{shortName(home?.name || '').toUpperCase()}</th>
                  <th style={{ padding: '8px 8px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.textMuted }}>BANP</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: tc(awayHue) }}>{shortName(away?.name || '').toUpperCase()}</th>
                  <th style={{ padding: '8px 8px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.textMuted }}>BANP</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3].map(gi => {
                  const ht = seriesTotal(match.home_team_id, gi)
                  const at = seriesTotal(match.away_team_id, gi)
                  if (ht === 0 && at === 0) return null
                  const hWins = ht > at
                  const aWins = at > ht
                  let hBanp = 0, aBanp = 0
                  for (let bord = 1; bord <= 4; bord++) {
                    for (let pos = 1; pos <= 2; pos++) {
                      const hg = (getResult(match.home_team_id, bord, pos)?.games || [])[gi] || 0
                      const ag = (getResult(match.away_team_id, bord, pos)?.games || [])[gi] || 0
                      if (hg > ag) hBanp++
                      else if (ag > hg) aBanp++
                    }
                  }
                  return (
                    <tr key={gi} style={{ borderBottom: '1px solid ' + C.border }}>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Serie {gi + 1}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 15, fontWeight: hWins ? 800 : 400, color: hWins ? C.accent : C.text }}>{ht || '—'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: hBanp > 0 ? C.green : C.textMuted }}>{hBanp > 0 ? hBanp : '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'left', fontSize: 15, fontWeight: aWins ? 800 : 400, color: aWins ? C.accent : C.text }}>{at || '—'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: aBanp > 0 ? C.green : C.textMuted }}>{aBanp > 0 ? aBanp : '—'}</td>
                    </tr>
                  )
                })}
                <tr style={{ borderTop: '2px solid ' + C.border }}>
                  <td style={{ padding: '10px 16px', fontSize: 11, fontWeight: 800, color: C.textMuted }}>TOTALT</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 16, fontWeight: 900, color: homeWin ? C.accent : C.text }}>{homeTotal ?? '—'}</td>
                  <td />
                  <td style={{ padding: '10px 12px', textAlign: 'left', fontSize: 16, fontWeight: 900, color: awayWin ? C.accent : C.text }}>{awayTotal ?? '—'}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </>
        )}

        {/* Best player */}
        {bestPlayer && bestPlayer.total > 0 && (
          <>
            {sectionHeader('BÄSTA SPELARE')}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid ' + C.border }}>
              <Trophy size={16} color={C.accent} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{bestPlayer.player_name}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                  {shortName(bestPlayer.team_id === match.home_team_id ? home?.name || '' : away?.name || '')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.accent, lineHeight: 1 }}>{bestPlayer.total}</div>
                <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1 }}>PINS</div>
              </div>
            </div>
          </>
        )}

        {/* Player scorecards */}
        {hasLineup && [
          { teamId: match.home_team_id, hue: homeHue, name: home?.name },
          { teamId: match.away_team_id, hue: awayHue, name: away?.name },
        ].map(({ teamId, hue, name }) => {
          const tl = teamLineup(teamId)
          if (tl.length === 0) return null
          const tResults = results.filter(r => r.team_id === teamId)
          const serTotals = [0, 1, 2, 3].map(gi => tResults.reduce((s, r) => s + ((r.games || [])[gi] || 0), 0))
          const gt = serTotals.reduce((a, b) => a + b, 0)
          const topTotal = Math.max(...tl.map(p => {
            const r = getResult(teamId, p.bord, p.position)
            return (r?.games || []).reduce((a, b) => a + b, 0)
          }))
          return (
            <div key={teamId}>
              {sectionHeader(
                shortName(name || '').toUpperCase(),
                gt > 0 ? <span style={{ fontSize: 11, color: C.textMuted }}>{gt.toLocaleString('sv')} pins</span> : undefined
              )}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 300 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid ' + C.border }}>
                      <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1 }}>SPELARE</th>
                      {['S1', 'S2', 'S3', 'S4'].map(s => (
                        <th key={s} style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.textMuted, minWidth: 40 }}>{s}</th>
                      ))}
                      <th style={{ padding: '8px 16px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.accent, minWidth: 48 }}>TOT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tl.map(p => {
                      const r = getResult(teamId, p.bord, p.position)
                      const games = r?.games || []
                      const total = games.reduce((a, b) => a + b, 0)
                      const isTop = total === topTotal && total > 0
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid ' + C.border }}>
                          <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: 13, fontWeight: isTop ? 700 : 500, color: C.text }}>{p.player_name}</div>
                            <div style={{ fontSize: 9, color: C.textMuted }}>Bord {p.bord}</div>
                          </td>
                          {[0, 1, 2, 3].map(gi => {
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
                    <tr style={{ borderTop: '2px solid ' + C.border }}>
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

        {/* Upcoming — no lineup yet */}
        {!hasLineup && isUpcoming && (
          <div style={{ padding: '48px 24px', textAlign: 'center', borderBottom: '1px solid ' + C.border }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>Kommande match</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Lineup och live scoring visas när matchen börjar</div>
          </div>
        )}

        {/* Completed — no data */}
        {!hasLineup && !isUpcoming && !isLive && hasScore && (
          <div style={{ padding: '24px 16px', textAlign: 'center', borderBottom: '1px solid ' + C.border }}>
            <div style={{ fontSize: 12, color: C.textMuted }}>Detaljerade spelresultat ej registrerade</div>
          </div>
        )}

        {/* Stream link for completed */}
        {hasStream && !isLive && (
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid ' + C.border }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>Scoring från matchen</span>
            <a href={match.stream_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.accent, fontWeight: 700, textDecoration: 'none' }}>Öppna scoring ↗</a>
          </div>
        )}

      </div>
    </main>
  )
}
