'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Props = { params: Promise<{ id: string }> }
type Result = { id: string; round: string; date: string; games: number[]; total: number; match_id: string | null }
type Match = { id: string; date: string; home_team_id: string; away_team_id: string; home: { name: string }; away: { name: string } }

export default function PlayerPage({ params }: Props) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [id, setId] = useState<string | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [results, setResults] = useState<Result[]>([])
  const [matches, setMatches] = useState<Record<string, Match>>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('oversikt')

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    Promise.all([
      supabase.from('players').select('*, teams(name, id)').eq('id', id).single(),
      supabase.from('match_results').select('id, round, date, games, total, match_id').eq('player_id', id).order('date', { ascending: false }),
    ]).then(async ([{ data: playerData }, { data: resultsData }]) => {
      setPlayer(playerData)
      const rs = (resultsData || []) as Result[]
      setResults(rs)

      // Fetch match details for results that have match_id
      const matchIds = [...new Set(rs.filter(r => r.match_id).map(r => r.match_id!))]
      if (matchIds.length > 0) {
        const { data: matchData } = await supabase
          .from('matches')
          .select('id, date, home_team_id, away_team_id, home:teams!home_team_id(name), away:teams!away_team_id(name)')
          .in('id', matchIds)
        if (matchData) {
          const map: Record<string, Match> = {}
          ;(matchData as unknown as Match[]).forEach(m => { map[m.id] = m })
          setMatches(map)
        }
      }
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

  if (!player) {
    return (
      <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.textMuted }}>Spelare hittades inte</div>
      </main>
    )
  }

  const allGames = results.flatMap(r => r.games || [])
  const totalPins = allGames.reduce((a, b) => a + b, 0)
  const avg = allGames.length > 0 ? Math.round((totalPins / allGames.length) * 10) / 10 : 0
  const high = allGames.length > 0 ? Math.max(...allGames) : 0
  const highSeries = results.length > 0 ? Math.max(...results.map(r => r.games?.reduce((a, b) => a + b, 0) || 0)) : 0
  const over200 = allGames.filter(g => g >= 200).length
  const over250 = allGames.filter(g => g >= 250).length
  const perfectGames = allGames.filter(g => g === 300).length

  // Form — last 5 series averages
  const last5 = results.slice(0, 5)
  const last5Games = last5.flatMap(r => r.games || [])
  const last5Avg = last5Games.length > 0 ? Math.round((last5Games.reduce((a, b) => a + b, 0) / last5Games.length) * 10) / 10 : 0

  const hue = player.name.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
  const pc = 'hsl(' + hue + ',50%,45%)'
  const pclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
  const ini = player.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const tabs = ['oversikt', 'serier', 'statistik']

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        <a href="/players" style={{ fontSize: 13, color: C.textMuted, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>&larr; Alla spelare</a>

        {/* Hero */}
        <div style={{ background: pclo, borderRadius: 16, border: '1px solid ' + pc + '44', borderLeft: '4px solid ' + pc, padding: '22px 24px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: pc, opacity: 0.08 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: theme === 'dark' ? 'hsl(' + hue + ',40%,20%)' : 'hsl(' + hue + ',40%,85%)', border: '2.5px solid ' + pc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: pc, flexShrink: 0 }}>
              {ini}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>{player.name}</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {player.teams && (
                  <a href={'/teams/' + player.teams.id} style={{ color: pc, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>{player.teams.name?.replace(/ A$/, '').replace(/ H A$/, '')}</a>
                )}
                {player.style && <span style={{ fontSize: 12, color: C.textMuted }}>{player.style}</span>}
                {player.hand && <span style={{ fontSize: 12, color: C.textMuted }}>{player.hand === 'right' ? 'Hogerhant' : 'Vanterhant'}</span>}
                {player.hometown && <span style={{ fontSize: 12, color: C.textMuted }}>{player.hometown}</span>}
                {player.age && <span style={{ fontSize: 12, color: C.textMuted }}>{player.age} ar</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            ['Snitt', avg || '--'],
            ['Hogst spel', high || '--'],
            ['Hogsta serie', highSeries || '--'],
            ['Serier', results.length],
          ].map(([l, v]) => (
            <div key={String(l)} style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: pc, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 5, letterSpacing: 0.5 }}>{String(l).toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: C.surface, borderRadius: 10, padding: 4, marginBottom: 20, border: '1px solid ' + C.border, gap: 4 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? C.card : 'transparent', border: tab === t ? '1px solid ' + C.border : '1px solid transparent', borderRadius: 8, padding: '9px', fontSize: 12, fontWeight: 700, color: tab === t ? pc : C.textMuted, cursor: 'pointer', textTransform: 'capitalize' }}>
              {t === 'oversikt' ? 'Oversikt' : t === 'serier' ? 'Serier' : 'Statistik'}
            </button>
          ))}
        </div>

        {/* Oversikt */}
        {tab === 'oversikt' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Form */}
            {last5.length > 0 && (
              <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 14 }}>FORM (SENASTE 5 SERIER)</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {last5.map((r, i) => {
                    const seriesTotal = r.games?.reduce((a, b) => a + b, 0) || 0
                    const seriesAvg = r.games?.length > 0 ? Math.round(seriesTotal / r.games.length) : 0
                    const isHigh = i === 0 || seriesAvg >= last5Avg
                    return (
                      <div key={r.id} style={{ flex: 1, background: C.surface, borderRadius: 10, border: '1px solid ' + (isHigh ? pc + '44' : C.border), padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: isHigh ? pc : C.textMuted, lineHeight: 1 }}>{seriesAvg}</div>
                        <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3 }}>SNT</div>
                        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{r.date?.slice(5, 10)}</div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textMuted }}>
                  <span>Snitt senaste 5: <strong style={{ color: pc }}>{last5Avg}</strong></span>
                  <span>Totalt snitt: <strong style={{ color: C.text }}>{avg}</strong></span>
                </div>
              </div>
            )}

            {/* Stats summary */}
            <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 12 }}>KARRIARSTATISTIK</div>
              {[
                ['Totala spel', allGames.length],
                ['Totala serier', results.length],
                ['Totala pins', totalPins.toLocaleString('sv-SE')],
                ['Snitt per spel', avg],
                ['Hogsta spel', high],
                ['Hogsta serie', highSeries],
                ['Spel over 200', over200 + ' (' + (allGames.length > 0 ? Math.round(over200/allGames.length*100) : 0) + '%)'],
                ['Spel over 250', over250 + ' (' + (allGames.length > 0 ? Math.round(over250/allGames.length*100) : 0) + '%)'],
                ['Perfekta spel (300)', perfectGames],
              ].map(([l, v], i, arr) => (
                <div key={String(l)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid ' + C.border : 'none' }}>
                  <span style={{ fontSize: 13, color: C.textMuted }}>{l}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Serier */}
        {tab === 'serier' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.length === 0 && (
              <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 32, textAlign: 'center', color: C.textMuted }}>Inga serier registrerade</div>
            )}
            {results.map(r => {
              const total = r.games?.reduce((a, b) => a + b, 0) || 0
              const seriesAvg = r.games?.length > 0 ? Math.round((total / r.games.length) * 10) / 10 : 0
              const matchInfo = r.match_id ? matches[r.match_id] : null
              return (
                <div key={r.id} style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 3 }}>{r.round}</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{r.date?.slice(0, 10)}</div>
                      {matchInfo && (
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                          {matchInfo.home?.name?.replace(/ A$/, '')} vs {matchInfo.away?.name?.replace(/ A$/, '')}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 26, fontWeight: 900, color: pc, lineHeight: 1 }}>{total}</div>
                      <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>SNT {seriesAvg}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(r.games || []).map((g, j) => (
                      <div key={j} style={{ flex: 1, background: C.surface, borderRadius: 8, border: '1px solid ' + (g >= 250 ? pc : g >= 200 ? pc + '44' : C.border), padding: '8px 4px', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: g >= 250 ? pc : g >= 200 ? C.text : C.textMuted }}>{g}</div>
                        <div style={{ fontSize: 8, color: C.muted, marginTop: 2 }}>S{j + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Statistik */}
        {tab === 'statistik' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Score distribution */}
            {allGames.length > 0 && (
              <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 16 }}>SCORE DISTRIBUTION</div>
                {[
                  { label: '200+', min: 200, max: 299, color: C.green },
                  { label: '250+', min: 250, max: 299, color: C.accent },
                  { label: '300', min: 300, max: 300, color: pc },
                  { label: '150-199', min: 150, max: 199, color: C.textMuted },
                  { label: 'Under 150', min: 0, max: 149, color: '#e05555' },
                ].map(({ label, min, max, color }) => {
                  const count = allGames.filter(g => g >= min && g <= max).length
                  const pct = allGames.length > 0 ? Math.round(count / allGames.length * 100) : 0
                  return (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: C.textMuted }}>{label}</span>
                        <span style={{ color: C.text, fontWeight: 600 }}>{count} spel ({pct}%)</span>
                      </div>
                      <div style={{ height: 6, background: C.surface, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Series trend */}
            {results.length > 1 && (
              <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 16 }}>SERIETRENDER</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                  {[...results].reverse().slice(-12).map((r, i) => {
                    const total = r.games?.reduce((a, b) => a + b, 0) || 0
                    const maxTotal = Math.max(...results.map(r2 => r2.games?.reduce((a, b) => a + b, 0) || 0))
                    const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0
                    return (
                      <div key={r.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: '100%', background: pc, borderRadius: '3px 3px 0 0', height: pct + '%', minHeight: 4, opacity: 0.7 + (i / 20) }} />
                        <div style={{ fontSize: 8, color: C.muted, whiteSpace: 'nowrap' }}>{total}</div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 8, textAlign: 'center' }}>Senaste {Math.min(results.length, 12)} serier</div>
              </div>
            )}

          </div>
        )}

      </div>
    </main>
  )
}
