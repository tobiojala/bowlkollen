'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useColors } from '@/components/ThemeProvider'

// ── Types ─────────────────────────────────────────────────────────────────────
type Squad  = { label: string; href: string }
type Player = { name: string; country: string; club: string; squads: Squad[] }

// ── Parser (for when the bowlres.se API is available) ────────────────────────
function parsePlayers(html: string): Player[] {
  const players: Player[] = []
  const rows = html.split('<div class="row">')
  for (const row of rows) {
    const nameMatch    = row.match(/<strong>(.+?)<\/strong>/)
    const countryMatch = row.match(/<span class="country-span">([A-Z]{2,3})<\/span>/)
    const clubMatch    = row.match(/<\/span><br\/>\s*(.+?)\s*<\/div>/)
    if (!nameMatch || !countryMatch) continue
    const name    = nameMatch[1].trim()
    const country = countryMatch[1].trim()
    const club    = clubMatch ? clubMatch[1].replace(/&[a-z]+;/g, c => {
      const map: Record<string, string> = { '&auml;': 'ä', '&ouml;': 'ö', '&aring;': 'å', '&uuml;': 'ü', '&Auml;': 'Ä', '&Ouml;': 'Ö', '&Aring;': 'Å', '&nbsp;': ' ' }
      return map[c] || c
    }).trim() : ''
    const squads: Squad[] = []
    for (const m of [...row.matchAll(/<a href='(show[^']+)'>([^<]+)<\/a>/g)]) {
      squads.push({ href: 'https://sllm.bowlres.se/' + m[1], label: m[2].trim() })
    }
    players.push({ name, country, club, squads })
  }
  return players
}

// ── Demo data (shown until bowlres.se API access is confirmed) ────────────────
const DEMO_PLAYERS: Player[] = [
  { name: 'Pontus Andersson',         country: 'SWE', club: 'IK Hakarpspojkarna',   squads: [] },
  { name: 'Jesper Svensson',          country: 'SWE', club: 'Linköpings BK',        squads: [] },
  { name: 'Martin Larsen',            country: 'SWE', club: 'Helsingborgs BS',       squads: [] },
  { name: 'Dom Barrett',              country: 'ENG', club: 'Storm Bowling',         squads: [] },
  { name: 'Anthony Simonsen',         country: 'USA', club: 'PBA Tour',             squads: [] },
  { name: 'EJ Tackett',               country: 'USA', club: 'PBA Tour',             squads: [] },
  { name: 'Sara Björk Jónsdóttir',   country: 'ISL', club: 'Bowling Iceland',       squads: [] },
  { name: 'Danielle McEwan',          country: 'USA', club: 'PWBA Tour',            squads: [] },
  { name: 'Ildemaro Ruiz',            country: 'VEN', club: 'Storm Bowling',         squads: [] },
  { name: 'Niclas Carlsson',          country: 'SWE', club: 'Mariestads BK',        squads: [] },
]

// ── Event config — swap this object to reuse the layout for other tävlingar ──
const EVENT = {
  name:    'Storm Lucky Larsen Masters 2026',
  dates:   '22–30 aug 2026',
  venue:   'Lucky Bowl, Helsingborg',
  status:  'upcoming' as 'upcoming' | 'live' | 'finished',
  banner:  'https://www.luckylarsen.se/wp-content/uploads/2026/02/SLLM26-WEB-HEADER-1440-x-600-px-4.png',
  actions: [
    { label: 'Anmäl dig →', href: 'https://sbe.bowlres.se/sllm26',                          style: 'primary' },
    { label: 'Officiell sida',   href: 'https://www.luckylarsen.se',                         style: 'secondary' },
    { label: '▶ Livestream',     href: 'https://www.youtube.com/@stormluckylarsenmasters',   style: 'live' },
  ],
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: 'KOMMANDE TÄVLING',
  live:     'TÄVLING PÅGÅR',
  finished: 'AVSLUTAD',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function playerColors(name: string, isDark: boolean) {
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return {
    bg:     `hsl(${hue},40%,${isDark ? '14%' : '93%'})`,
    text:   `hsl(${hue},50%,${isDark ? '65%' : '40%'})`,
    border: `hsl(${hue},45%,${isDark ? '28%' : '72%'})`,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SLLMPage() {
  const { C, isDark } = useColors()

  const [players,  setPlayers]  = useState<Player[]>([])
  const [apiReady, setApiReady] = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState<'all' | 'swe' | 'int'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    // API access pending — bowlres.se partnership
    setLoading(false)
    setApiReady(false)
    // When API is ready, replace the above with:
    // fetch('/api/sllm').then(r => r.json()).then(data => {
    //   if (data.html) { setPlayers(parsePlayers(data.html)); setApiReady(true) }
    //   setLoading(false)
    // })
  }, [])

  const display     = apiReady ? players : DEMO_PLAYERS
  const swedish     = display.filter(p => p.country === 'SWE')
  const nations     = new Set(display.map(p => p.country)).size

  const filtered = display.filter(p => {
    const q  = search.toLowerCase()
    const ok = !q || p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)
    const f  = filter === 'all' || (filter === 'swe' && p.country === 'SWE') || (filter === 'int' && p.country !== 'SWE')
    return ok && f
  })

  const isLive = EVENT.status === 'live'
  const statusColor = isLive ? '#e05555' : '#f5c200'

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 24 }}>

        {/* ── Hero banner ───────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', width: '100%', height: 210, overflow: 'hidden' }}>
          <Image src={EVENT.banner} alt={EVENT.name} fill
            style={{ objectFit: 'cover', objectPosition: 'center 30%' }} />
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.72) 100%)' }} />
          {/* Content */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px' }}>
            {/* Status pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 8,
              background: `rgba(${isLive ? '224,85,85' : '245,194,0'},0.2)`,
              border: `1px solid ${statusColor}55`,
              borderRadius: 20, padding: '3px 10px' }}>
              {isLive && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#e05555', boxShadow: '0 0 5px #e05555' }} />}
              {!isLive && <span style={{ fontSize: 9, color: statusColor }}>◆</span>}
              <span style={{ fontSize: 9, fontWeight: 800, color: statusColor, letterSpacing: 1.2 }}>
                {STATUS_LABEL[EVENT.status]}
              </span>
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>
              {EVENT.name}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)' }}>
              {EVENT.dates} · {EVENT.venue}
            </div>
          </div>
        </div>

        {/* ── Action strip ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, padding: '14px 16px 0',
          overflowX: 'auto', scrollbarWidth: 'none' } as any}>
          {EVENT.actions.map(a => {
            const isPrimary   = a.style === 'primary'
            const isLiveLink  = a.style === 'live'
            return (
              <a key={a.href} href={a.href} target="_blank" rel="noopener noreferrer"
                style={{
                  flexShrink: 0, textDecoration: 'none',
                  borderRadius: 10, padding: '9px 18px', fontSize: 12, fontWeight: 700,
                  background: isPrimary  ? '#f5c200'
                            : isLiveLink ? (isDark ? 'rgba(224,85,85,0.12)' : 'rgba(224,85,85,0.08)')
                            : 'transparent',
                  color: isPrimary  ? '#1a1400'
                       : isLiveLink ? '#e05555'
                       : C.text,
                  border: isPrimary  ? 'none'
                        : isLiveLink ? '1px solid rgba(224,85,85,0.28)'
                        : '1px solid ' + C.border,
                  WebkitTapHighlightColor: 'transparent',
                } as any}>
                {a.label}
              </a>
            )
          })}
        </div>

        {/* ── Stats row ────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, padding: '14px 16px 20px' }}>
          {([
            ['Anmälda',  loading ? '—' : display.length],
            ['Svenska',  loading ? '—' : swedish.length],
            ['Nationer', loading ? '—' : nations],
          ] as const).map(([label, value]) => (
            <div key={label} style={{ borderRadius: 12, border: '1px solid ' + C.border, padding: '14px 10px', textAlign: 'center',
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#f5c200', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, marginTop: 6, letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* ── Player list ──────────────────────────────────────────────────── */}
        <div style={{ padding: '0 16px' }}>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>SPELLISTA</span>
            {!apiReady && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#f5c200',
                background: isDark ? 'rgba(245,194,0,0.1)' : 'rgba(245,194,0,0.1)',
                border: '1px solid rgba(245,194,0,0.25)', borderRadius: 8, padding: '2px 8px' }}>
                DEMO
              </span>
            )}
          </div>

          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Sök spelare, klubb eller land..."
            style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8,
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              border: '1px solid ' + C.border, borderRadius: 10, padding: '10px 14px',
              color: C.text, fontSize: 13, outline: 'none' } as any} />

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {([['all','Alla'],['swe','Svenska'],['int','Internationella']] as const).map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{ flex: 1, padding: '7px 6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700,
                  background: filter === val ? '#f5c200' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                  color: filter === val ? '#1a1400' : C.textMuted,
                  WebkitTapHighlightColor: 'transparent' } as any}>
                {lbl}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 10 }}>
            {filtered.length} spelare
          </div>

          {/* Player cards — card-per-list layout matching the rest of the app */}
          {filtered.length > 0 ? (
            <div style={{ borderRadius: 14, border: '1px solid ' + C.border, overflow: 'hidden' }}>
              {filtered.map((p, i) => {
                const pc    = playerColors(p.name, isDark)
                const ini   = p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                const isOpen = expanded === p.name
                const isSwe  = p.country === 'SWE'
                return (
                  <div key={i} style={{ borderTop: i > 0 ? '1px solid ' + C.border : 'none' }}>
                    <div
                      onClick={() => p.squads.length > 0 && setExpanded(isOpen ? null : p.name)}
                      style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                        cursor: p.squads.length > 0 ? 'pointer' : 'default',
                        WebkitTapHighlightColor: 'transparent' } as any}>
                      {/* Avatar */}
                      <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: pc.bg, border: '1.5px solid ' + pc.border,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: pc.text }}>
                        {ini}
                      </div>
                      {/* Name + club */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.text,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.club}
                        </div>
                      </div>
                      {/* Country badge + chevron */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700,
                          color: isSwe ? pc.text : C.textMuted,
                          background: isSwe ? pc.bg : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                          border: '1px solid ' + (isSwe ? pc.border : C.border),
                          borderRadius: 6, padding: '2px 7px' }}>
                          {p.country}
                        </span>
                        {p.squads.length > 0 && (
                          <span style={{ fontSize: 10, color: C.textMuted }}>{isOpen ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </div>
                    {/* Squad expand */}
                    {isOpen && p.squads.length > 0 && (
                      <div style={{ borderTop: '1px solid ' + C.border, padding: '10px 14px',
                        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: C.textMuted, letterSpacing: 1, marginBottom: 8 }}>SQUADS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {p.squads.map((sq, j) => (
                            <a key={j} href={sq.href} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 12, color: '#f5c200', textDecoration: 'none',
                                display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 4, height: 4, borderRadius: '50%',
                                background: '#f5c200', display: 'inline-block', flexShrink: 0 }} />
                              {sq.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
              Inga spelare matchar sökningen
            </div>
          )}

          {/* API pending notice */}
          {!apiReady && (
            <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10,
              background: isDark ? 'rgba(245,194,0,0.05)' : 'rgba(245,194,0,0.07)',
              border: '1px solid rgba(245,194,0,0.18)', fontSize: 11, color: C.textMuted, lineHeight: 1.65 }}>
              Spellistan ovan är exempeldata. Riktiga anmälningar visas när API-avtal med bowlres.se är på plats.{' '}
              <a href="https://sllm.bowlres.se/allplayers.php?contestid=107" target="_blank" rel="noopener noreferrer"
                style={{ color: '#f5c200', textDecoration: 'none', fontWeight: 600 }}>
                Se original →
              </a>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
