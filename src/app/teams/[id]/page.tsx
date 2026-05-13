import React from 'react'
import { createClient } from '@/lib/supabase'

const bg = '#10161e'
const surface = '#172030'
const card = '#1c2840'
const border = '#2a3858'
const accent = '#f5c200'
const textMuted = '#6b7a99'

type Props = { params: Promise<{ id: string }> }
type Player = { id: string; name: string; style: string | null; hand: string | null }
type Result = { id: string; round: string; date: string; total: number; games: number[] }

export default async function TeamPage({ params }: Props) {
  const { id } = await params
  const supabase = createClient()

  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single()

  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', id)
    .order('name')

  const { data: results } = await supabase
    .from('match_results')
    .select('*')
    .eq('team_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!team) {
    return (
      <main style={{ minHeight: '100vh', background: bg, color: 'white', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: textMuted }}>Lag hittades inte</div>
      </main>
    )
  }

  const hue = team.name.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360
  const tc = 'hsl(' + hue + ',50%,55%)'
  const tclo = 'hsl(' + hue + ',40%,15%)'
  const ini = team.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const allGames = (results || []).flatMap((r: Result) => r.games || [])
  const totalPins = allGames.reduce((a: number, b: number) => a + b, 0)
  const avgScore = allGames.length > 0 ? Math.round((totalPins / allGames.length) * 10) / 10 : 0
  const highGame = allGames.length > 0 ? Math.max(...allGames) : 0

  return (
    <main style={{ minHeight: '100vh', background: bg, color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: surface, borderBottom: '1px solid ' + border, padding: '16px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Bowl<span style={{ color: accent }}>kollen</span></div>
          <a href="/teams" style={{ fontSize: 12, color: textMuted, textDecoration: 'none' }}>Alla lag</a>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ background: tclo, borderRadius: 16, border: '1px solid ' + tc + '44', borderLeft: '4px solid ' + tc, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: 'hsl(' + hue + ',40%,20%)', border: '2px solid ' + tc + '66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: tc }}>
              {ini}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>{team.name}</div>
              <div style={{ fontSize: 13, color: textMuted, marginTop: 4 }}>
                {team.club}{team.city ? ' · ' + team.city : ''}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
          {[['Snitt', avgScore || '--'], ['Hogst', highGame || '--'], ['Spelare', players?.length || 0]].map(([l, v]) => (
            <div key={String(l)} style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: tc, lineHeight: 1 }}>{String(v)}</div>
              <div style={{ fontSize: 10, color: textMuted, marginTop: 5, letterSpacing: 1 }}>{String(l).toUpperCase()}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 1.5, marginBottom: 12 }}>SPELARE</div>
        {players && players.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {players.map((player: Player) => (
              <div key={player.id} style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: tclo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: tc, flexShrink: 0 }}>
                  {player.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{player.name}</div>
                  <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{player.style || 'Stroker'}{player.hand ? ' · ' + player.hand : ''}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: 24, textAlign: 'center', color: textMuted, fontSize: 13, marginBottom: 24 }}>
            Inga spelare annu
          </div>
        )}

        <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 1.5, marginBottom: 12 }}>SENASTE RESULTAT</div>
        {results && results.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map((result: Result) => (
              <div key={result.id} style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>{result.round}</div>
                  <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{result.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: tc }}>{result.total}</div>
                  <div style={{ fontSize: 9, color: textMuted }}>TOTALT</div>
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
