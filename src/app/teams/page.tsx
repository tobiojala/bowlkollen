import React from 'react'
import { createClient } from '@/lib/supabase'

const bg = '#10161e'
const surface = '#172030'
const card = '#1c2840'
const border = '#2a3858'
const accent = '#f5c200'
const textMuted = '#6b7a99'

type Team = { id: string; name: string; club: string; city: string | null }

export default async function TeamsPage() {
  const supabase = createClient()
  const { data: teams } = await supabase.from('teams').select('*').order('name')

  return (
    <main style={{ minHeight: '100vh', background: bg, color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: surface, borderBottom: '1px solid ' + border, padding: '16px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Bowl<span style={{ color: accent }}>kollen</span></div>
          <a href="/" style={{ fontSize: 12, color: textMuted, textDecoration: 'none' }}>Hem</a>
        </div>
      </header>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Lag ({teams?.length || 0})</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(teams || []).map((team: Team) => {
            const hue = team.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
            const tc = 'hsl(' + hue + ',50%,55%)'
            const tclo = 'hsl(' + hue + ',40%,15%)'
            const ini = team.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            return (
              <a key={team.id} href={'/teams/' + team.id} style={{ background: card, borderRadius: 12, border: '1px solid ' + border, borderLeft: '3px solid ' + tc, padding: '16px 20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: tclo, border: '1.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: tc, flexShrink: 0 }}>{ini}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>{team.name}</div>
                  <div style={{ fontSize: 12, color: textMuted, marginTop: 3 }}>{team.club}{team.city ? ' · ' + team.city : ''}</div>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </main>
  )
}
