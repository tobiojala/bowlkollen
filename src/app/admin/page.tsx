'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const bg = '#10161e'
const surface = '#172030'
const card = '#1c2840'
const border = '#2a3858'
const accent = '#f5c200'
const textMuted = '#6b7a99'

type Team = { id: string; name: string }

const inp = {
  background: surface,
  border: '1px solid ' + border,
  borderRadius: 8,
  padding: '10px 12px',
  color: 'white',
  fontSize: 14,
  outline: 'none',
  width: '100%',
} as React.CSSProperties

const lbl = {
  fontSize: 11,
  fontWeight: 700,
  color: textMuted,
  letterSpacing: 1,
  marginBottom: 6,
  display: 'block',
} as React.CSSProperties

const STYLES = [
  'Enhand',
  'Tvahand',
]

export default function AdminPage() {
  const [tab, setTab] = useState('teams')
  const [msg, setMsg] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)

  const [teamName, setTeamName] = useState('')
  const [teamClub, setTeamClub] = useState('')
  const [teamCity, setTeamCity] = useState('')

  const [playerName, setPlayerName] = useState('')
  const [playerTeam, setPlayerTeam] = useState('')
  const [playerHand, setPlayerHand] = useState('right')
  const [playerStyle, setPlayerStyle] = useState('Enhand')
  const [playerAge, setPlayerAge] = useState('')
  const [playerHometown, setPlayerHometown] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('teams').select('id, name').order('name').then(({ data }) => {
      if (data) setTeams(data)
    })
  }, [msg])

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const addTeam = async () => {
    if (!teamName || !teamClub) return flash('Namn och klubb kravs')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('teams').insert({ name: teamName, club: teamClub, city: teamCity })
    if (error) flash('Fel: ' + error.message)
    else { flash('Lag tillagt!'); setTeamName(''); setTeamClub(''); setTeamCity('') }
    setLoading(false)
  }

  const addPlayer = async () => {
    if (!playerName || !playerTeam) return flash('Namn och lag kravs')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('players').insert({
      name: playerName,
      team_id: playerTeam,
      hand: playerHand,
      style: playerStyle,
      age: playerAge ? parseInt(playerAge) : null,
      hometown: playerHometown || null,
    })
    if (error) flash('Fel: ' + error.message)
    else { flash('Spelare tillagd!'); setPlayerName(''); setPlayerAge(''); setPlayerHometown('') }
    setLoading(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: bg, color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: surface, borderBottom: '1px solid ' + border, padding: '16px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            Bowl<span style={{ color: accent }}>kollen</span>
            <span style={{ fontSize: 13, color: textMuted, fontWeight: 400, marginLeft: 10 }}>Admin</span>
          </div>
          <a href="/" style={{ fontSize: 12, color: textMuted, textDecoration: 'none' }}>Tillbaka</a>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {msg && (
          <div style={{ background: msg.includes('Fel') ? '#2a1212' : '#122a1a', border: '1px solid ' + (msg.includes('Fel') ? '#4a1a1a' : '#1a4a2a'), borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, fontWeight: 600, color: msg.includes('Fel') ? '#ff6b6b' : '#4caf7d' }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: surface, borderRadius: 10, padding: 4, border: '1px solid ' + border }}>
          {['teams', 'players'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? card : 'transparent', border: tab === t ? '1px solid ' + border : '1px solid transparent', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 700, color: tab === t ? accent : textMuted, cursor: 'pointer' }}>
              {t === 'teams' ? 'Lag' : 'Spelare'}
            </button>
          ))}
        </div>

        {tab === 'teams' && (
          <div style={{ background: card, borderRadius: 14, border: '1px solid ' + border, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: accent, letterSpacing: 1, marginBottom: 20 }}>LAGG TILL LAG</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div><label style={lbl}>LAGNAMN</label><input style={inp} value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="t.ex. IFK Goteborg" /></div>
              <div><label style={lbl}>KLUBB</label><input style={inp} value={teamClub} onChange={e => setTeamClub(e.target.value)} placeholder="t.ex. IFK Goteborg BK" /></div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>STAD</label>
              <input style={inp} value={teamCity} onChange={e => setTeamCity(e.target.value)} placeholder="t.ex. Goteborg" />
            </div>
            <button onClick={addTeam} disabled={loading} style={{ background: accent, color: '#1a1400', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              + Lagg till lag
            </button>
            {teams.length > 0 && (
              <div style={{ marginTop: 24, borderTop: '1px solid ' + border, paddingTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 1, marginBottom: 12 }}>REGISTRERADE LAG</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {teams.map(t => (
                    <div key={t.id} style={{ background: surface, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'white' }}>{t.name}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'players' && (
          <div style={{ background: card, borderRadius: 14, border: '1px solid ' + border, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: accent, letterSpacing: 1, marginBottom: 20 }}>LAGG TILL SPELARE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div><label style={lbl}>NAMN</label><input style={inp} value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Fornamn Efternamn" /></div>
              <div>
                <label style={lbl}>LAG</label>
                <select style={inp} value={playerTeam} onChange={e => setPlayerTeam(e.target.value)}>
                  <option value="">-- Valj lag --</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
<div>
  <label style={lbl}>SPELSTIL</label>
  <select style={inp} value={playerStyle} onChange={e => setPlayerStyle(e.target.value)}>
    {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
  </select>
</div>
              <div>
                <label style={lbl}>HAND</label>
                <select style={inp} value={playerHand} onChange={e => setPlayerHand(e.target.value)}>
                  <option value="right">Hoger</option>
                  <option value="left">Vanster</option>
                </select>
              </div>
              <div><label style={lbl}>ALDER</label><input style={inp} type="number" value={playerAge} onChange={e => setPlayerAge(e.target.value)} placeholder="25" /></div>
              <div><label style={lbl}>HEMORT</label><input style={inp} value={playerHometown} onChange={e => setPlayerHometown(e.target.value)} placeholder="Stockholm" /></div>
            </div>
            <button onClick={addPlayer} disabled={loading} style={{ background: accent, color: '#1a1400', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              + Lagg till spelare
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
