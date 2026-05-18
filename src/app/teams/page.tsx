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
  if (name.endsWith(' DA') || name.endsWith(' D')) return 'Damer'
  if (name.endsWith(' A') || name.endsWith(' H A')) return 'Elitserien'
  if (name.endsWith(' B')) return 'Div B'
  if (name.endsWith(' F')) return 'Allsvenskan'
  return null
}

function divisionColor(name: string) {
  const d = divisionLabel(name)
  if (d === 'Damer') return '#d94a90'
  if (d === 'Elitserien') return '#4a90d9'
  if (d === 'Allsvenskan') return '#5ba85a'
  return '#6b7a99'
}

export default function TeamsPage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('teams').select('id, name, club, city').order('club').then(({ data }) => {
      if (data) setTeams(data as Team[])
      setLoading(false)
    })
  }, [])

  // Group by club
  const clubs = teams.reduce((acc, t) => {
    const club = t.club || shortName(t.name)
    if (!acc[club]) acc[club] = []
    if (!acc[club].find(x => x.id === t.id)) acc[club].push(t)
    return acc
  }, {} as Record<string, Team[]>)

  const filtered = Object.entries(clubs).filter(([club, clubTeams]) =>
    !search ||
    club.toLowerCase().includes(search.toLowerCase()) ||
    clubTeams.some(t => t.city?.toLowerCase().includes(search.toLowerCase()))
  ).sort(([a], [b]) => a.localeCompare(b, 'sv'))

  // Group clubs by first letter
  const grouped = filtered.reduce((acc, [club, clubTeams]) => {
    const letter = club[0]?.toUpperCase() || '#'
    if (!acc[letter]) acc[letter] = []
    acc[letter].push([club, clubTeams] as [string, Team[]])
    return acc
  }, {} as Record<string, [string, Team[]][]>)

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Klubbar & Lag</h1>
          <div style={{ fontSize: 13, color: C.textMuted }}>
            {loading ? 'Laddar...' : filtered.length + ' klubbar'}
          </div>
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Sok klubb eller stad..."
          style={{ width: '100%', background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '11px 14px', color: C.text, fontSize: 14, outline: 'none', marginBottom: 20, boxSizing: 'border-box' as const }}
        />

        {!loading && filtered.length === 0 && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: '48px 24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            Inga klubbar hittades
          </div>
        )}

        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, 'sv')).map(([letter, letterClubs]) => (
          <div key={letter} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, letterSpacing: 2, marginBottom: 8, paddingLeft: 4 }}>
              {letter}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {letterClubs.map(([club, clubTeams]) => {
                const isOpen = expanded === club
                const hasMultiple = clubTeams.length > 1
                const hue = club.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                const tc = 'hsl(' + hue + ',50%,45%)'
                const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
                const ini = club.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

                return (
                  <div key={club} style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, overflow: 'hidden' }}>
                    <div
                      onClick={() => hasMultiple ? setExpanded(isOpen ? null : club) : window.location.href = '/teams/' + clubTeams[0].id}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: tclo, border: '1.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: tc, flexShrink: 0 }}>
                        {ini}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{club}</div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>
                          {clubTeams[0].city || ''}
                          {hasMultiple && ' · ' + clubTeams.map(t => divisionLabel(t.name)).filter(Boolean).join(', ')}
                        </div>
                      </div>
                      {hasMultiple ? (
                        <div style={{ color: C.textMuted, fontSize: 13, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
                      ) : (
                        <div style={{ color: C.textMuted, fontSize: 16 }}>›</div>
                      )}
                    </div>

                    {isOpen && hasMultiple && (
                      <div style={{ borderTop: '1px solid ' + C.border }}>
                        {clubTeams
                          .sort((a, b) => {
                            const order = ['Herrar', 'Damer', null]
                            return order.indexOf(divisionLabel(a.name)) - order.indexOf(divisionLabel(b.name))
                          })
                          .map(t => {
                            const div = divisionLabel(t.name)
                            const dc = divisionColor(t.name)
                            return (
                              <a key={t.id} href={'/teams/' + t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px 11px 62px', borderBottom: '1px solid ' + C.border, textDecoration: 'none' }}
                                onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{shortName(t.name)}</div>
                                </div>
                                {div && (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: dc, background: dc + '18', borderRadius: 6, padding: '2px 8px' }}>
                                    {div.toUpperCase()}
                                  </span>
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
        ))}
      </div>
    </main>
  )
}
