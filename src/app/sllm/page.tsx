'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Squad = { label: string; href: string }
type Player = { name: string; country: string; club: string; squads: Squad[] }

function parsePlayers(html: string): Player[] {
  const players: Player[] = []
  const rows = html.split('<div class="row">')
  for (const row of rows) {
    const nameMatch = row.match(/<strong>(.+?)<\/strong>/)
    const countryMatch = row.match(/<span class="country-span">([A-Z]{2,3})<\/span>/)
    const clubMatch = row.match(/<\/span><br\/>\s*(.+?)\s*<\/div>/)
    if (!nameMatch || !countryMatch) continue
    const name = nameMatch[1].trim()
    const country = countryMatch[1].trim()
    const club = clubMatch ? clubMatch[1].replace(/&[a-z]+;/g, c => {
      const map: Record<string, string> = { '&auml;': 'a', '&ouml;': 'o', '&aring;': 'a', '&uuml;': 'u', '&Auml;': 'A', '&Ouml;': 'O', '&Aring;': 'A', '&nbsp;': ' ' }
      return map[c] || c
    }).trim() : ''
    const squads: Squad[] = []
    const squadMatches = [...row.matchAll(/<a href='(show[^']+)'>([^<]+)<\/a>/g)]
    for (const m of squadMatches) {
      squads.push({ href: 'https://sllm.bowlres.se/' + m[1], label: m[2].trim() })
    }
    players.push({ name, country, club, squads })
  }
  return players
}

const BANNER = 'https://www.luckylarsen.se/wp-content/uploads/2026/02/SLLM26-WEB-HEADER-1440-x-600-px-4.png'

export default function SLLMPage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    // API access pending - bowlres.se partnership
    setLoading(false)
    setError('Spellista tillganglig nar API-avtal ar klart med bowlres.se')
    return
    fetch('/api/sllm')
      .then(r => r.json())
      .then(data => {
        if (data.html) {
          const parsed = parsePlayers(data.html)
          if (parsed.length > 0) {
            setPlayers(parsed)
          } else {
            setError('Parser hittade inga spelare')
          }
        } else {
          setError(data.error || 'Okant fel')
        }
        setLoading(false)
      })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])

  const swedish = players.filter(p => p.country === 'SWE')
  const international = players.filter(p => p.country !== 'SWE')
  const nations = new Set(players.map(p => p.country)).size

  const filtered = players.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || (filter === 'swe' && p.country === 'SWE') || (filter === 'int' && p.country !== 'SWE')
    return matchSearch && matchFilter
  })

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ position: 'relative', width: '100%', height: 280, overflow: 'hidden' }}>
        <img src={BANNER} alt="SLLM 2026" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(10,16,30,0.95) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 32px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#f5c200', letterSpacing: 2, marginBottom: 6 }}>KOMMANDE TAVLING · PBA TOUR</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'white' }}>Storm Lucky Larsen Masters 2026</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>22-30 augusti 2026 &middot; Lucky Bowl, Helsingborg</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px' }}>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
          <a href="https://sbe.bowlres.se/sllm26" target="_blank" rel="noopener noreferrer" style={{ background: '#f5c200', color: '#1a1400', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Anmal dig</a>
          <a href="https://www.luckylarsen.se" target="_blank" rel="noopener noreferrer" style={{ background: C.card, color: C.text, borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none', border: '1px solid ' + C.border }}>Officiell sida</a>
          <a href="https://www.youtube.com/@stormluckylarsenmasters" target="_blank" rel="noopener noreferrer" style={{ background: theme === 'dark' ? 'rgba(255,68,68,0.15)' : '#fff0f0', color: '#e05555', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none', border: '1px solid ' + (theme === 'dark' ? 'rgba(255,68,68,0.3)' : '#ffcccc') }}>Livestream</a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
          {[['Anmalda', loading ? '...' : players.length], ['Svenska', loading ? '...' : swedish.length], ['Nationer', loading ? '...' : nations]].map(([l, v]) => (
            <div key={String(l)} style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#f5c200', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>{String(l).toUpperCase()}</div>
            </div>
          ))}
        </div>

        {loading && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 32, textAlign: 'center', color: C.textMuted }}>
            Hamtar spellista...
          </div>
        )}

        {!loading && error && (
          <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 24, color: C.textMuted, fontSize: 13 }}>
            {error} — <a href="https://sllm.bowlres.se/allplayers.php?contestid=107" target="_blank" rel="noopener noreferrer" style={{ color: '#f5c200' }}>Se original</a>
          </div>
        )}

        {!loading && players.length > 0 && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sok spelare, klubb eller land..." style={{ flex: 1, minWidth: 200, background: C.card, border: '1px solid ' + C.border, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13, outline: 'none' }} />
              <div style={{ display: 'flex', gap: 6 }}>
                {[['all','Alla'],['swe','Svenska'],['int','Internationella']].map(([val, lbl]) => (
                  <button key={val} onClick={() => setFilter(val)} style={{ background: filter === val ? '#f5c200' : C.card, color: filter === val ? '#1a1400' : C.textMuted, border: '1px solid ' + (filter === val ? '#f5c200' : C.border), borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>{filtered.length} spelare visas</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filtered.map((p, i) => {
                const hue = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                const pc = 'hsl(' + hue + ',50%,' + (theme === 'dark' ? '55%' : '40%') + ')'
                const pclo = theme === 'dark' ? 'hsl(' + hue + ',40%,15%)' : 'hsl(' + hue + ',40%,95%)'
                const ini = p.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                const isOpen = expanded === p.name
                const isSwe = p.country === 'SWE'
                return (
                  <div key={i} style={{ background: C.card, borderRadius: 10, border: '1px solid ' + C.border, borderLeft: '3px solid ' + (isSwe ? pc : C.border), overflow: 'hidden' }}>
                    <div onClick={() => setExpanded(isOpen ? null : p.name)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: pclo, border: '1.5px solid ' + pc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: pc, flexShrink: 0 }}>{ini}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{p.club}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.squads.length > 0 && <span style={{ background: C.surface, borderRadius: 6, padding: '2px 8px', fontSize: 10, color: C.textMuted, border: '1px solid ' + C.border }}>{p.squads.length} squad{p.squads.length > 1 ? 's' : ''}</span>}
                        <div style={{ background: C.surface, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: isSwe ? pc : C.textMuted, border: '1px solid ' + C.border }}>{p.country}</div>
                        {p.squads.length > 0 && <span style={{ color: C.textMuted, fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>}
                      </div>
                    </div>
                    {isOpen && p.squads.length > 0 && (
                      <div style={{ borderTop: '1px solid ' + C.border, padding: '10px 16px', background: C.surface }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 8 }}>SQUADS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {p.squads.map((sq, j) => (
                            <a key={j} href={sq.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#f5c200', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f5c200', display: 'inline-block', flexShrink: 0 }} />
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
          </div>
        )}

        <div style={{ marginTop: 24, fontSize: 11, color: C.textMuted, textAlign: 'center' }}>
        </div>

      </div>
    </main>
  )
}
