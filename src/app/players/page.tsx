'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Player = { id: string; name: string; team_id: string; teamName?: string }

export default function PlayersPage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: ps, error: pe } = await supabase.from('players').select('id, name, team_id').order('name')
      const { data: ts } = await supabase.from('teams').select('id, name')
      const teamMap: Record<string, string> = {}
      if (ts) ts.forEach((t: any) => { teamMap[t.id] = t.name })
      if (ps) setPlayers(ps.map((p: any) => ({ ...p, teamName: teamMap[p.team_id] || '' })))
      setLoading(false)
    }
    load()
  }, [])

  function shortName(name: string) {
    return name.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').trim()
  }

  const filtered = players.filter(p =>
    !q || p.name.toLowerCase().includes(q.toLowerCase()) ||
    (p.teamName || '').toLowerCase().includes(q.toLowerCase())
  )

  const grouped = filtered.reduce((acc, p) => {
    const letter = p.name[0]?.toUpperCase() || '#'
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(p)
    return acc
  }, {} as Record<string, Player[]>)

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Spelare</h1>
          <div style={{ fontSize: 13, color: C.textMuted }}>
            {loading ? 'Laddar...' : players.length + ' spelare registrerade'}
          </div>
        </div>

        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Sok spelare eller lag..."
          style={{ width: '100%', background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 14, outline: 'none', marginBottom: 20, boxSizing: 'border-box' as const }}
        />

        {!loading && players.length === 0 && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎳</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>Inga spelare registrerade</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Spelare laggs till via live scoring i Admin</div>
          </div>
        )}

        {!loading && filtered.length === 0 && players.length > 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            Inga spelare matchade sokningen
          </div>
        )}

        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, 'sv')).map(([letter, letterPlayers]) => (
          <div key={letter} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, letterSpacing: 2, marginBottom: 8, paddingLeft: 4 }}>
              {letter}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {letterPlayers.map(p => {
                const hue = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                const tc = 'hsl(' + hue + ',50%,45%)'
                const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
                return (
                  <a key={p.id} href={'/players/' + p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: C.card, borderRadius: 12, border: '1px solid ' + C.border, textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
                    onMouseLeave={e => (e.currentTarget.style.background = C.card)}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: tclo, border: '1.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: tc, flexShrink: 0 }}>
                      {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</div>
                      {p.teamName && (
                        <div style={{ fontSize: 11, color: C.textMuted }}>{shortName(p.teamName)}</div>
                      )}
                    </div>
                    <div style={{ color: C.textMuted, fontSize: 16 }}>›</div>
                  </a>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
