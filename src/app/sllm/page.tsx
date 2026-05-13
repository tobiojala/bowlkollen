'use client'

import React, { useState, useEffect } from 'react'

type Player = { name: string; country: string; club: string }

const COUNTRIES = ['SWE','USA','NOR','DNK','FIN','GBR','DEU','ITA','NED','BEL','CZE','ISL','IRL','MEX','AUS','POL','ESP','FRA','RUS','UKR','EST','LVA','LTU','SVK','HUN','AUT','CHE','SVN','HRV','SRB','BGR','ROU','GRC','TUR','ISR','JPN','KOR','CAN','BRA','ARG','POR','GEO','AZE','ARM','KAZ']

function parsePlayers(text: string): Player[] {
  const players: Player[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/^\*\*(.+?)\*\*\s+([A-Z]{3})$/)
    if (match && COUNTRIES.includes(match[2])) {
      const name = match[1].trim()
      const country = match[2]
      const next = lines[i + 1] || ''
      const club = !next.startsWith('[') && !next.startsWith('*') && !next.startsWith('#') ? next : ''
      players.push({ name, country, club })
    }
  }
  return players
}

export default function SLLMPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/sllm')
      .then(r => r.json())
      .then(data => {
        if (data.html) {
          const parsed = parsePlayers(data.html)
          if (parsed.length > 0) {
            setPlayers(parsed)
          } else {
            setError('Inga spelare hittades i svaret')
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

  const bg = '#10161e'
  const surface = '#172030'
  const card = '#1c2840'
  const border = '#2a3858'
  const accent = '#f5c200'
  const textMuted = '#6b7a99'

  return (
    <main style={{ minHeight: '100vh', background: bg, color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ background: 'linear-gradient(135deg, #0a3a5a 0%, #172030 100%)', borderRadius: 16, borderLeft: '4px solid ' + accent, padding: '28px', marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginBottom: 8 }}>KOMMANDE TURNERING</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 6 }}>
            Storm Lucky Larsen <span style={{ color: accent }}>Masters 2026</span>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
            Det enda internationella PBA Tour-evenemanget 2026 &middot; Helsingborg, Sverige
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {[['Datum','22-30 aug 2026'],['Plats','Lucky Bowl, Helsingborg'],['Format','PBA Tour']].map(([k,v]) => (
              <div key={k} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', marginRight: 4 }}>{k}:</span>{v}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="https://sbe.bowlres.se/sllm26" target="_blank" rel="noopener noreferrer" style={{ background: accent, color: '#1a1400', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Anmal dig</a>
            <a href="https://www.luckylarsen.se" target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>Officiell sida</a>
            <a href="https://www.youtube.com/@stormluckylarsenmasters" target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(255,68,68,0.2)', color: '#ff9999', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,68,68,0.3)' }}>Livestream</a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 32 }}>
          {[['Anmalda', loading ? '...' : players.length],['Svenska', loading ? '...' : swedish.length],['Nationer', loading ? '...' : nations]].map(([l,v]) => (
            <div key={String(l)} style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: accent, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 11, color: textMuted, marginTop: 6 }}>{String(l).toUpperCase()}</div>
            </div>
          ))}
        </div>

        {loading && (
          <div style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: 32, textAlign: 'center', color: textMuted }}>
            Hamtar spellista...
          </div>
        )}

        {!loading && error && (
          <div style={{ background: card, borderRadius: 12, border: '1px solid ' + border, padding: 24 }}>
            <div style={{ color: textMuted, fontSize: 13, marginBottom: 8 }}>
              Spellistan visas inte lokalt men fungerar nar appen ar live pa Vercel.
            </div>
            <a href="https://sllm.bowlres.se/allplayers.php?contestid=107" target="_blank" rel="noopener noreferrer" style={{ color: accent, fontSize: 13 }}>
              Se alla anmalda spelare har (officiell lista)
            </a>
          </div>
        )}

        {!loading && !error && swedish.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 2, marginBottom: 16 }}>SVENSKA SPELARE ({swedish.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {swedish.map((p, i) => {
                const hue = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                const pc = 'hsl(' + hue + ',50%,55%)'
                const pclo = 'hsl(' + hue + ',40%,15%)'
                const ini = p.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <div key={i} style={{ background: card, borderRadius: 10, border: '1px solid ' + border, borderLeft: '3px solid ' + pc, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: pclo, border: '1.5px solid ' + pc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: pc, flexShrink: 0 }}>{ini}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: textMuted, marginTop: 1 }}>{p.club}</div>
                    </div>
                    <div style={{ background: surface, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: textMuted }}>SWE</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!loading && !error && international.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 2, marginBottom: 16 }}>INTERNATIONELLA ({international.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {international.map((p, i) => {
                const hue = p.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
                const pc = 'hsl(' + hue + ',50%,55%)'
                const pclo = 'hsl(' + hue + ',40%,15%)'
                const ini = p.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <div key={i} style={{ background: card, borderRadius: 10, border: '1px solid ' + border, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: pclo, border: '1.5px solid ' + pc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: pc, flexShrink: 0 }}>{ini}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: textMuted, marginTop: 1 }}>{p.club}</div>
                    </div>
                    <div style={{ background: surface, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: textMuted }}>{p.country}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, fontSize: 11, color: textMuted, textAlign: 'center' }}>
          Data hamtas fran sllm.bowlres.se &middot;
          <a href="https://sllm.bowlres.se/allplayers.php?contestid=107" target="_blank" rel="noopener noreferrer" style={{ color: accent, marginLeft: 4, textDecoration: 'none' }}>Se original</a>
        </div>

      </div>
    </main>
  )
}
