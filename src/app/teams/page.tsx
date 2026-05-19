'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Team = { id: string; name: string; club: string; city: string | null; slug: string | null; club_slug: string | null; team_path: string | null }

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

function divisionLabel(name: string) {
  if (name.endsWith(' DA') || name.endsWith(' D')) return 'Damer'
  if (name.endsWith(' A') || name.endsWith(' H A')) return 'Elitserien'
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
    supabase.from('teams').select('id, name, club, city, slug, club_slug, team_path').order('club').then(({ data }) => {
      if (data) setTeams(data as Team[])
      setLoading(false)
    })
  }, [])

  const clubs = teams.reduce((acc, t) => {
    const club = t.club || shortName(t.name)
    if (!acc[club]) acc[club] = []
    if (!acc[club].find((x: Team) => x.id === t.id)) acc[club].push(t)
    return acc
  }, {} as Record<string, Team[]>)

  const filtered = Object.entries(clubs).filter(([club, clubTeams]) =>
    !search ||
    club.toLowerCase().includes(search.toLowerCase()) ||
    (clubTeams as Team[]).some(t => t.city?.toLowerCase().includes(search.toLowerCase()))
  ).sort(([a], [b]) => a.localeCompare(b, 'sv'))

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 56, background: C.bg, zIndex: 30, borderBottom: '1px solid ' + C.border, padding: '10px 16px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Sok klubb eller stad..."
          style={{ width: '100%', background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: '7px 14px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
        />
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
          {loading ? 'Laddar...' : filtered.length + ' klubbar'}
        </div>
      </div>

      {/* Club list */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {filtered.map(([club, clubTeams]) => {
          const isOpen = expanded === club
          const hasMultiple = (clubTeams as Team[]).length > 1
          const hue = club.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
          const tc = 'hsl(' + hue + ',50%,45%)'
          const tclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
          const ini = club.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          const city = (clubTeams as Team[])[0]?.city
          const url = hasMultiple ? undefined : ((clubTeams as Team[])[0]?.club_slug ? '/' + (clubTeams as Team[])[0].club_slug : '/teams/' + (clubTeams as Team[])[0].id)

          return (
            <div key={club} style={{ borderBottom: '1px solid ' + C.border }}>
              <div
                onClick={() => hasMultiple ? setExpanded(isOpen ? null : club) : (window.location.href = url!)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: tclo, border: '1.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: tc, flexShrink: 0 }}>
                  {ini}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{club}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>
                    {city || ''}
                    {hasMultiple && ' · ' + (clubTeams as Team[]).length + ' lag'}
                  </div>
                </div>
                <div style={{ color: C.textMuted, fontSize: 13 }}>
                  {hasMultiple ? (isOpen ? '▲' : '▼') : '›'}
                </div>
              </div>

              {isOpen && hasMultiple && (clubTeams as Team[]).map(t => {
                const dc = divisionColor(t.name)
                const dl = divisionLabel(t.name)
                const turl = t.club_slug && t.team_path ? '/' + t.club_slug + '/' + t.team_path : '/teams/' + t.id
                return (
                  <a key={t.id} href={turl}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 10px 64px', borderTop: '1px solid ' + C.border, textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: 500 }}>{shortName(t.name)}</div>
                    {dl && <span style={{ fontSize: 10, fontWeight: 700, color: dc, background: dc + '18', borderRadius: 6, padding: '2px 8px' }}>{dl}</span>}
                    <div style={{ color: C.textMuted, fontSize: 13 }}>›</div>
                  </a>
                )
              })}
            </div>
          )
        })}
      </div>
    </main>
  )
}
