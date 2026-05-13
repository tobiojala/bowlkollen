'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Team = { id: string; name: string; club: string; city: string | null }

export default function TeamsPage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [teams, setTeams] = useState<Team[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('teams').select('*').order('name').then(({ data }) => { if (data) setTeams(data) })
  }, [])

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(q.toLowerCase()) ||
    t.club.toLowerCase().includes(q.toLowerCase()) ||
    (t.city || '').toLowerCase().includes(q.toLowerCase())
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Lag</h1>
          <span style={{ fontSize: 12, color: C.textMuted }}>{filtered.length} av {teams.length}</span>
        </div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Sok lagnamn, klubb eller stad..." style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '11px 16px', color: C.text, fontSize: 14, outline: 'none', width: '100%', marginBottom: 16 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((team: Team) => {
            const hue = team.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
            const tc = 'hsl(' + hue + ',50%,45%)'
            const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,95%)'
            const ini = team.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            return (
              <a key={team.id} href={'/teams/' + team.id} style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, borderLeft: '3px solid ' + tc, padding: '16px 20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: tclo, border: '1.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: tc, flexShrink: 0 }}>{ini}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{team.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{team.club}{team.city ? ' · ' + team.city : ''}</div>
                </div>
                <div style={{ color: C.textMuted, fontSize: 18 }}>›</div>
              </a>
            )
          })}
          {filtered.length === 0 && <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 32, textAlign: 'center', color: C.textMuted }}>Inga lag hittades</div>}
        </div>
      </div>
    </main>
  )
}
