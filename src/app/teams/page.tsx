'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Team = { id: string; name: string; club: string; city: string | null }

function shortName(name: string) {
  return name.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').trim()
}

function divisionLabel(name: string) {
  if (name.includes(' H A') || (name.endsWith(' A') && !name.includes('DA'))) return 'Herrar'
  if (name.includes('DA') || name.includes(' D ') || name.endsWith(' D')) return 'Damer'
  return null
}

function divisionColor(name: string, C: any) {
  const d = divisionLabel(name)
  if (d === 'Herrar') return '#4a90d9'
  if (d === 'Damer') return '#d94a90'
  return C.textMuted
}

export default function TeamsPage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [teams, setTeams] = useState<Team[]>([])
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('teams').select('id, name, club, city').order('club').then(({ data }) => {
      if (data) setTeams(data as Team[])
    })
  }, [])

  // Group by club
  const clubs = teams.reduce((acc, t) => {
    const club = t.club || shortName(t.name)
    if (!acc[club]) acc[club] = []
    // Avoid duplicate team names
    if (!acc[club].find(x => x.id === t.id)) acc[club].push(t)
    return acc
  }, {} as Record<string, Team[]>)

  const filtered = Object.entries(clubs).filter(([club]) =>
    !search || club.toLowerCase().includes(search.toLowerCase())
  ).sort(([a], [b]) => a.localeCompare(b, 'sv'))

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Klubbar</h1>
          <div style={{ fontSize: 13, color: C.textMuted }}>{filtered.length} klubbar</div>
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Sok klubb..."
          style={{ width: '100%', background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(([club, clubTeams]) => {
            const isOpen = expanded === club
            const hue = club.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
            const tc = 'hsl(' + hue + ',50%,45%)'
            const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
            const ini = club.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
            const hasMultiple = clubTeams.length > 1

            return (
              <div key={club} style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, overflow: 'hidden' }}>

                {/* Club row */}
                <div
                  onClick={() => hasMultiple ? setExpanded(isOpen ? null : club) : window.location.href = '/teams/' + clubTeams[0].id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: tclo, border: '1.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: tc, flexShrink: 0 }}>
                    {ini}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{club}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                      {clubTeams.map(t => divisionLabel(t.name)).filter(Boolean).join(' · ') || 'Lag'}
                    </div>
                  </div>
                  {hasMultiple && (
                    <div style={{ color: C.textMuted, fontSize: 14, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
                  )}
                  {!hasMultiple && (
                    <div style={{ color: C.textMuted, fontSize: 16 }}>›</div>
                  )}
                </div>

                {/* Expanded team list */}
                {isOpen && hasMultiple && (
                  <div style={{ borderTop: '1px solid ' + C.border }}>
                    {clubTeams
                      .sort((a, b) => {
                        const order = ['Herrar', 'Damer', null]
                        return order.indexOf(divisionLabel(a.name)) - order.indexOf(divisionLabel(b.name))
                      })
                      .map(t => {
                        const div = divisionLabel(t.name)
                        const dc = divisionColor(t.name, C)
                        return (
                          <a key={t.id} href={'/teams/' + t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px 12px 70px', borderBottom: '1px solid ' + C.border, textDecoration: 'none' }}
                            onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{shortName(t.name)}</div>
                            </div>
                            {div && (
                              <div style={{ fontSize: 10, fontWeight: 700, color: dc, background: dc + '18', borderRadius: 6, padding: '2px 8px' }}>
                                {div.toUpperCase()}
                              </div>
                            )}
                            <div style={{ color: C.textMuted, fontSize: 14 }}>›</div>
                          </a>
                        )
                      })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
