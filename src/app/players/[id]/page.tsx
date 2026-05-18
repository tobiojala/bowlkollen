'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Props = { params: Promise<{ id: string }> }

function shortName(name: string) {
  return name.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').trim()
}

export default function PlayerPage({ params }: Props) {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [id, setId] = useState<string | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    Promise.all([
      supabase.from('players').select('*, teams:team_id(id, name, club)').eq('id', id).single(),
      supabase.from('match_results').select('*, matches:match_id(id, date, home_team_id, away_team_id, home_score, away_score, division, home:teams!home_team_id(name), away:teams!away_team_id(name))').eq('player_id', id).order('created_at', { ascending: false }),
    ]).then(([{ data: p }, { data: r }]) => {
      setPlayer(p)
      setResults(r || [])
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: C.textMuted }}>Laddar...</div>
    </main>
  )

  if (!player) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: C.textMuted }}>Spelare hittades inte</div>
    </main>
  )

  const hue = player.name.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
  const tc = 'hsl(' + hue + ',50%,45%)'
  const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'

  // Calculate stats
  const allGames = results.flatMap(r => r.games || []).filter((g: number) => g > 0)
  const totalGames = allGames.length
  const avgScore = totalGames > 0 ? Math.round(allGames.reduce((a: number, b: number) => a + b, 0) / totalGames) : null
  const bestGame = totalGames > 0 ? Math.max(...allGames) : null
  const seriesTotals = results.map(r => (r.games || []).reduce((a: number, b: number) => a + b, 0)).filter((t: number) => t > 0)
  const bestSeries = seriesTotals.length > 0 ? Math.max(...seriesTotals) : null
  const avgSeries = seriesTotals.length > 0 ? Math.round(seriesTotals.reduce((a: number, b: number) => a + b, 0) / seriesTotals.length) : null
  const over200 = allGames.filter((g: number) => g >= 200).length
  const over250 = allGames.filter((g: number) => g >= 250).length

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 48px' }}>

        <a href="/players" style={{ fontSize: 12, color: C.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          ← Alla spelare
        </a>

        {/* Player hero */}
        <div style={{ background: C.card, borderRadius: 16, border: '1px solid ' + C.border, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: results.length > 0 ? 20 : 0 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: tclo, border: '2px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: tc, flexShrink: 0 }}>
              {player.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>{player.name}</div>
              {player.teams && (
                <a href={'/teams/' + player.teams.id} style={{ fontSize: 13, color: C.accent, textDecoration: 'none', fontWeight: 600 }}>
                  {shortName(player.teams.name)}
                </a>
              )}
            </div>
          </div>

          {/* Stats */}
          {results.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                {[
                  { label: 'Snitt', value: avgScore || '—', color: C.accent },
                  { label: 'Basta serie', value: bestSeries || '—', color: C.green },
                  { label: 'Basta spel', value: bestGame || '—', color: tc },
                ].map(s => (
                  <div key={s.label} style={{ background: C.surface, borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid ' + C.border }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'Matcher', value: results.length },
                  { label: '200+', value: over200 },
                  { label: '250+', value: over250 },
                ].map(s => (
                  <div key={s.label} style={{ background: C.surface, borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid ' + C.border }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: C.text, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Match history */}
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 2, paddingLeft: 4, marginBottom: 4 }}>
              MATCHHISTORIK
            </div>
            {results.map(r => {
              const games = r.games || []
              const total = games.reduce((a: number, b: number) => a + b, 0)
              const match = r.matches
              return (
                <a key={r.id} href={'/matches/' + r.match_id} style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: '12px 14px', textDecoration: 'none', display: 'block' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
                  onMouseLeave={e => (e.currentTarget.style.background = C.card)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                        {match?.home?.name ? shortName(match.home.name) : ''} vs {match?.away?.name ? shortName(match.away.name) : ''}
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{match?.date?.slice(0, 10)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: total >= 800 ? C.green : C.accent, lineHeight: 1 }}>{total || '—'}</div>
                      <div style={{ fontSize: 9, color: C.textMuted }}>TOTALT</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {games.map((g: number, i: number) => (
                      <div key={i} style={{ flex: 1, background: C.surface, borderRadius: 6, padding: '6px 4px', textAlign: 'center', border: '1px solid ' + (g >= 200 ? tc + '44' : C.border) }}>
                        <div style={{ fontSize: 14, fontWeight: g >= 200 ? 700 : 400, color: g >= 250 ? tc : g >= 200 ? C.green : C.text }}>{g || '—'}</div>
                        <div style={{ fontSize: 8, color: C.textMuted, marginTop: 2 }}>S{i + 1}</div>
                      </div>
                    ))}
                  </div>
                </a>
              )
            })}
          </div>
        )}

        {results.length === 0 && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: C.textMuted }}>Inga registrerade resultat annu</div>
          </div>
        )}

      </div>
    </main>
  )
}
