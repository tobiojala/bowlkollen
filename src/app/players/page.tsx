'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Player = { id: string; name: string; style: string | null; hand: string | null; hometown: string | null; teams: { name: string } | null }

export default function PlayersPage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [players, setPlayers] = useState<Player[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('players').select('*, teams:team_id(name, club)').order('name').then(({ data, error }) => { console.log('players:', data?.length, 'error:', error); if (data) setPlayers(data) })
  }, [])

  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    (p.teams?.name || '').toLowerCase().includes(q.toLowerCase()) ||
    (p.hometown || '').toLowerCase().includes(q.toLowerCase())
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Spelare</h1>
          <span style={{ fontSize: 12, color: C.textMuted }}>{filtered.length} av {players.length}</span>
        </div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Sok namn, lag eller hemort..." style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '11px 16px', color: C.text, fontSize: 14, outline: 'none', width: '100%', marginBottom: 16 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((player: Player) => {
            const hue = player.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
            const pc = 'hsl(' + hue + ',50%,45%)'
            const pclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,95%)'
            const ini = player.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            return (
              <a key={player.id} href={'/players/' + player.id} style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: '14px 16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: pclo, border: '1.5px solid ' + pc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: pc, flexShrink: 0 }}>{ini}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{player.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{player.teams?.name || 'Inget lag'}{player.style ? ' · ' + player.style : ''}{player.hometown ? ' · ' + player.hometown : ''}</div>
                </div>
                <div style={{ color: C.textMuted, fontSize: 18 }}>›</div>
              </a>
            )
          })}
          {filtered.length === 0 && <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 32, textAlign: 'center', color: C.textMuted }}>Inga spelare hittades</div>}
        </div>
      </div>
    </main>
  )
}
