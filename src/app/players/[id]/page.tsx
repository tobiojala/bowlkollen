import React from 'react'
import { createClient } from '@/lib/supabase'

const bg = '#10161e'
const surface = '#172030'
const card = '#1c2840'
const border = '#2a3858'
const accent = '#f5c200'
const textMuted = '#6b7a99'

type Props = { params: Promise<{ id: string }> }
type Result = { id: string; round: string; date: string; total: number; games: number[] }

export default async function PlayerPage({ params }: Props) {
  const { id } = await params
  const supabase = createClient()

  const { data: player } = await supabase
    .from('players')
    .select('*, teams(name, id)')
    .eq('id', id)
    .single()

  const { data: results } = await supabase
    .from('match_results')
    .select('*')
    .eq('player_id', id)
    .order('created_at', { ascending: false })

  if (!player) {
    return (
      <main style={{ minHeight: '100vh', background: bg, color: 'white', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: textMuted }}>Spelare hittades inte</div>
      </main>
    )
  }

  const hue = player.name.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
  const pc = 'hsl(' + hue + ',50%,55%)'
  const pclo = 'hsl(' + hue + ',40%,15%)'
  const ini = player.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const allGames = (results || []).flatMap((r: Result) => r.games || [])
  const total = allGames.reduce((a: number, b: number) => a + b, 0)
  const avg = allGames.length > 0 ? Math.round((total / allGames.length) * 10) / 10 : 0
  const high = allGames.length > 0 ? Math.max(...allGames) : 0
  const seriesCount = results?.length || 0

  return (
    <main style={{ minHeight: '100vh', background: bg, color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: surface, borderBottom: '1px solid ' + border, padding: '16px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Bowl<span style={{ color: accent }}>kollen</span></div>
          <a href="/players" style={{ fontSize: 12, color: textMuted, textDecoration: 'none' }}>Alla spelare</a>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ background: pclo, borderRadius: 16, border: '1px solid ' + pc + '44', borderLeft: '4px solid ' + pc, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'hsl(' + hue + ',40%,20%)', border: '2px solid ' + pc + '66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: pc }}>
              {ini}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>{player.name}</div>
              <div style={{ fontSize: 13, color: textMuted, marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {player.teams && (
                  <a href={'/teams/' + player.teams.id} style={{ color: pc, textDecoration: 'none', fontWeight: 600 }}>
                    {player.teams.name}
                  </a>
                )}
                {player.style && <span>{player.style}</span>}
                {player.hand && <span>{player.hand === 'right' ? 'Hogerhant' : 'Vanterhant'}</span>}
                {player.hometown && <span>{player.hometown}</span>}
                {player.age && <span>{player.age} ar</span>}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
          {[['Snitt', avg || '--'], ['Hogst', high || '--'], ['Serier', seriesCount], ['Spel', allGames.length]].map(([l, v]) => (
            <div key={String(l)} style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: '14px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: pc, lineHeight: 1 }}>{String(v)}</div>
              <div style={{ fontSize: 10, color: textMuted, marginTop: 5, letterSpacing: 1 }}>{String(l).toUpperCase()}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 1.5, marginBottom: 12 }}>SERIEHISTORIK</div>
        {results && results.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map((r: Result) => (
              <div key={r.id} style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{r.round}</div>
                    <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{r.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: pc }}>{r.total}</div>
                    <div style={{ fontSize: 9, color: textMuted }}>SERIE</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(r.games || []).map((g: number, j: number) => (
                    <div key={j} style={{ flex: 1, background: surface, borderRadius: 8, border: '1px solid ' + (g >= 230 ? pc : border), padding: '8px 0', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: g >= 230 ? pc : 'white' }}>{g}</div>
                      <div style={{ fontSize: 9, color: textMuted, marginTop: 2 }}>SPEL {j + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: 24, textAlign: 'center', color: textMuted, fontSize: 13 }}>
            Inga resultat annu
          </div>
        )}

      </div>
    </main>
  )
}
