'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const bg = '#10161e'
const surface = '#172030'
const card = '#1c2840'
const border = '#2a3858'
const accent = '#f5c200'
const textMuted = '#6b7a99'

export default function AdminPage() {
  const [teamName, setTeamName] = useState('')
  const [teamClub, setTeamClub] = useState('')
  const [teamCity, setTeamCity] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const addTeam = async () => {
    if (!teamName || !teamClub) {
      setMsg('Namn och klubb krävs')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('teams')
      .insert({ name: teamName, club: teamClub, city: teamCity })

    if (error) {
      setMsg('Fel: ' + error.message)
    } else {
      setMsg('Lag tillagt!')
      setTeamName('')
      setTeamClub('')
      setTeamCity('')
    }
    setLoading(false)
  }

  const inputStyle = {
    background: surface,
    border: '1px solid ' + border,
    borderRadius: 8,
    padding: '10px 12px',
    color: 'white',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  }

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: textMuted,
    letterSpacing: 1,
    marginBottom: 6,
    display: 'block',
  }

  return (
    <main style={{ minHeight: '100vh', background: bg, color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: surface, borderBottom: '1px solid ' + border, padding: '16px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            Bowl<span style={{ color: accent }}>kollen</span>
            <span style={{ fontSize: 13, color: textMuted, fontWeight: 400, marginLeft: 10 }}>Admin</span>
          </div>
          <a href="/" style={{ fontSize: 12, color: textMuted, textDecoration: 'none' }}>
            Tillbaka
          </a>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {msg && (
          <div style={{
            background: msg.includes('Fel') ? '#2a1212' : '#122a1a',
            border: '1px solid ' + (msg.includes('Fel') ? '#4a1a1a' : '#1a4a2a'),
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 24,
            fontSize: 13,
            fontWeight: 600,
            color: msg.includes('Fel') ? '#ff6b6b' : '#4caf7d'
          }}>
            {msg}
          </div>
        )}

        <div style={{ background: card, borderRadius: 14, border: '1px solid ' + border, padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: accent, letterSpacing: 1, marginBottom: 20 }}>
            LÄGG TILL LAG
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>LAGNAMN</label>
              <input
                style={inputStyle}
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="t.ex. IFK Göteborg"
              />
            </div>
            <div>
              <label style={labelStyle}>KLUBB</label>
              <input
                style={inputStyle}
                value={teamClub}
                onChange={e => setTeamClub(e.target.value)}
                placeholder="t.ex. IFK Göteborg BK"
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>STAD</label>
            <input
              style={inputStyle}
              value={teamCity}
              onChange={e => setTeamCity(e.target.value)}
              placeholder="t.ex. Göteborg"
            />
          </div>

          <button
            onClick={addTeam}
            disabled={loading}
            style={{
              background: accent,
              color: '#1a1400',
              border: 'none',
              borderRadius: 10,
              padding: '11px 24px',
              fontSize: 14,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Sparar...' : '+ Lägg till lag'}
          </button>
        </div>

      </div>
    </main>
  )
}