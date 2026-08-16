'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useColors } from '@/components/ThemeProvider'
import { SITE_HOST } from '@/lib/constants'

type Props = { params: Promise<{ club_slug: string }> }
type Team = { id: string; name: string; club: string; city: string | null; club_slug: string; team_path: string | null }

function shortName(n: string) {
  return n.replace(/ A$/, '').replace(/ H A$/, '').replace(/ DA$/, '').replace(/ F$/, '').trim()
}

function divisionColor(name: string) {
  if (name.includes(' H A') || name.endsWith(' A')) return '#4a90d9'
  if (name.includes('DA') || name.endsWith(' D')) return '#d94a90'
  if (name.endsWith(' F')) return '#5ba85a'
  return '#6b7a99'
}

function teamLabel(path: string | null) {
  if (path === 'herrar') return 'Herrar'
  if (path === 'damer') return 'Damer'
  if (path === 'allsvenskan') return 'Allsvenskan'
  if (path === 'b-laget') return 'B-laget'
  return 'Lag'
}

export default function ClubPage({ params }: Props) {
  const { C, isDark } = useColors()
  const [clubSlug, setClubSlug] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { params.then(p => setClubSlug(p.club_slug)) }, [params])

  useEffect(() => {
    if (!clubSlug) return
    const supabase = createClient()
    supabase.from('teams').select('id, name, club, city, club_slug, team_path')
      .eq('club_slug', clubSlug)
      .order('name')
      .then(({ data }) => {
        if (data) setTeams(data as Team[])
        setLoading(false)
      })
  }, [clubSlug])

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: C.textMuted }}>Laddar...</div>
    </main>
  )

  if (teams.length === 0) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ color: C.textMuted }}>Klubb hittades inte</div>
    </main>
  )

  const club = teams[0].club
  const city = teams[0].city
  const hue = club.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const tc = 'hsl(' + hue + ',50%,45%)'
  const tclo = isDark ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,92%)'
  const ini = club.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 48px' }}>

        {/* Hero */}
        <div style={{ background: isDark ? 'linear-gradient(135deg, #0d1a2e 0%, #1a2840 100%)' : 'linear-gradient(135deg, #e8f0f8 0%, #d0e0f0 100%)', padding: '24px 20px 20px' }}>
          <Link href="/teams" style={{ fontSize: 12, color: C.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
            ← Alla lag
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 68, height: 68, borderRadius: 16, background: tclo, border: '2.5px solid ' + tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: tc, flexShrink: 0 }}>
              {ini}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 4 }}>{club}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {city && <span style={{ fontSize: 12, color: C.textMuted }}>{city}</span>}
                <span style={{ fontSize: 11, color: C.textMuted }}>{teams.length} lag</span>
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
                {SITE_HOST}/{clubSlug}
              </div>
            </div>
          </div>
        </div>

        {/* Teams */}
        <div style={{ padding: '16px 20px 8px', fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 2 }}>
          LAGETS LAG
        </div>

        {teams.map(t => {
          const dc = divisionColor(t.name)
          const label = teamLabel(t.team_path)
          const url = t.team_path
            ? '/' + clubSlug + '/' + t.team_path
            : '/teams/' + t.id
          const thue = t.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
          const ttc = 'hsl(' + thue + ',50%,45%)'
          const ttclo = isDark ? 'hsl(' + thue + ',40%,15%)' : 'hsl(' + thue + ',40%,92%)'

          return (
            <Link key={t.id} href={url}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid ' + C.border, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = C.card)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: ttclo, border: '1.5px solid ' + ttc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: ttc, flexShrink: 0 }}>
                {shortName(t.name).split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{shortName(t.name)}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                  {SITE_HOST}/{clubSlug}/{t.team_path}
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: dc, background: dc + '18', borderRadius: 6, padding: '3px 10px' }}>
                {label}
              </span>
              <div style={{ color: C.textMuted, fontSize: 16 }}>›</div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
