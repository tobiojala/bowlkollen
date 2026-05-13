'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'

type Team = { id: string; name: string }
type Player = { id: string; name: string; team_id: string }
type Match = { id: string; home_team_id: string; away_team_id: string; date: string; status: string; home: { name: string }; away: { name: string } }

const STYLES = ['Enhand', 'Tvahand']

export default function AdminPage() {
  const { theme } = useTheme()
  const C = theme === 'dark' ? dark : light

  const inp = { background: C.surface, border: '1px solid ' + C.border, borderRadius: 8, padding: '10px 12px', color: C.text, fontSize: 14, outline: 'none', width: '100%' } as React.CSSProperties
  const lbl = { fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 6, display: 'block' } as React.CSSProperties

  const [tab, setTab] = useState('matches')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])

  const [teamName, setTeamName] = useState('')
  const [teamClub, setTeamClub] = useState('')
  const [teamCity, setTeamCity] = useState('')

  const [playerName, setPlayerName] = useState('')
  const [playerTeam, setPlayerTeam] = useState('')
  const [playerHand, setPlayerHand] = useState('right')
  const [playerStyle, setPlayerStyle] = useState('Enhand')
  const [playerAge, setPlayerAge] = useState('')
  const [playerHometown, setPlayerHometown] = useState('')

  const [mHome, setMHome] = useState('')
  const [mAway, setMAway] = useState('')
  const [mDate, setMDate] = useState(new Date().toISOString().slice(0, 10))
  const [mStatus, setMStatus] = useState('upcoming')

  const [rMatch, setRMatch] = useState('')
  const [rPlayer, setRPlayer] = useState('')
  const [rTeam, setRTeam] = useState('')
  const [rRound, setRRound] = useState('')
  const [rDate, setRDate] = useState(new Date().toISOString().slice(0, 10))
  const [rType, setRType] = useState('league')
  const [games, setGames] = useState<string[]>(['', '', '', ''])

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const loadData = () => {
    const supabase = createClient()
    supabase.from('teams').select('id, name').order('name').then(({ data }) => { if (data) setTeams(data) })
    supabase.from('players').select('id, name, team_id').order('name').then(({ data }) => { if (data) setPlayers(data) })
    supabase.from('matches').select('id, home_team_id, away_team_id, date, status, home:teams!home_team_id(name), away:teams!away_team_id(name)').order('date', { ascending: false }).limit(20).then(({ data }) => { if (data) setMatches(data as unknown as Match[]) })
  }

  useEffect(() => { loadData() }, [])

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const addTeam = async () => {
    if (!teamName || !teamClub) return flash('Namn och klubb kravs')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('teams').insert({ name: teamName, club: teamClub, city: teamCity })
    if (error) flash('Fel: ' + error.message)
    else { flash('Lag tillagt!'); setTeamName(''); setTeamClub(''); setTeamCity(''); loadData() }
    setLoading(false)
  }

  const addPlayer = async () => {
    if (!playerName || !playerTeam) return flash('Namn och lag kravs')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('players').insert({ name: playerName, team_id: playerTeam, hand: playerHand, style: playerStyle, age: playerAge ? parseInt(playerAge) : null, hometown: playerHometown || null })
    if (error) flash('Fel: ' + error.message)
    else { flash('Spelare tillagd!'); setPlayerName(''); setPlayerAge(''); setPlayerHometown(''); loadData() }
    setLoading(false)
  }

  const addMatch = async () => {
    if (!mHome || !mAway) return flash('Valj hemmalag och bortalag')
    if (mHome === mAway) return flash('Lagen maste vara olika')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('matches').insert({ home_team_id: mHome, away_team_id: mAway, date: mDate, status: mStatus })
    if (error) flash('Fel: ' + error.message)
    else { flash('Match skapad!'); setMHome(''); setMAway(''); loadData() }
    setLoading(false)
  }

  const setMatchStatus = async (id: string, status: string) => {
    const supabase = createClient()
    await supabase.from('matches').update({ status }).eq('id', id)
    loadData()
    flash('Status uppdaterad')
  }

  const addGame = () => setGames([...games, ''])
  const removeGame = (i: number) => { if (games.length <= 1) return; setGames(games.filter((_, j) => j !== i)) }
  const updateGame = (i: number, v: string) => { const g = [...games]; g[i] = v; setGames(g) }

  const addResult = async () => {
    if (!rPlayer || !rTeam || !rRound) return flash('Fyll i lag, spelare och omgang')
    const parsed = games.map(g => parseInt(g))
    if (parsed.some(g => isNaN(g) || g < 0 || g > 300)) return flash('Ogiltiga poang (0-300)')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('match_results').insert({ player_id: rPlayer, team_id: rTeam, round: rRound, date: rDate, games: parsed, type: rType, match_id: rMatch || null })
    if (error) flash('Fel: ' + error.message)
    else { flash('Serie sparad!'); setGames(['', '', '', '']); setRRound('') }
    setLoading(false)
  }

  const teamPlayers = rTeam ? players.filter(p => p.team_id === rTeam) : []
  const validGames = games.filter(g => g !== '').map(g => parseInt(g)).filter(g => !isNaN(g))
  const seriesTotal = validGames.length > 0 ? validGames.reduce((a, b) => a + b, 0) : null
  const tabs = ['matches', 'results', 'teams', 'players']
  const tabLabel: Record<string, string> = { matches: 'Matcher', results: 'Resultat', teams: 'Lag', players: 'Spelare' }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>
          Bowl<span style={{ color: '#f5c200' }}>kollen</span>
          <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 400, marginLeft: 10 }}>Admin</span>
        </div>
        <button onClick={logout} style={{ background: C.surface, border: '1px solid ' + C.border, borderRadius: 8, padding: '6px 14px', fontSize: 12, color: C.textMuted, cursor: 'pointer' }}>
          Logga ut
        </button>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 60px' }}>
        {msg && (
          <div style={{ background: msg.includes('Fel') ? (theme === 'dark' ? '#2a1212' : '#fff0f0') : (theme === 'dark' ? '#122a1a' : '#f0fff4'), border: '1px solid ' + (msg.includes('Fel') ? '#ffaaaa' : '#aaffcc'), borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, fontWeight: 600, color: msg.includes('Fel') ? C.red : C.green }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: C.surface, borderRadius: 10, padding: 4, border: '1px solid ' + C.border }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? C.card : 'transparent', border: tab === t ? '1px solid ' + C.border : '1px solid transparent', borderRadius: 8, padding: '9px', fontSize: 12, fontWeight: 700, color: tab === t ? C.accent : C.textMuted, cursor: 'pointer' }}>
              {tabLabel[t]}
            </button>
          ))}
        </div>

        {tab === 'matches' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: C.card, borderRadius: 14, border: '1px solid ' + C.border, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, letterSpacing: 1, marginBottom: 20 }}>SKAPA MATCH</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>HEMMALAG</label>
                  <select style={inp} value={mHome} onChange={e => setMHome(e.target.value)}>
                    <option value="">-- Valj lag --</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>BORTALAG</label>
                  <select style={inp} value={mAway} onChange={e => setMAway(e.target.value)}>
                    <option value="">-- Valj lag --</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>DATUM</label>
                  <input style={inp} type="date" value={mDate} onChange={e => setMDate(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>STATUS</label>
                  <select style={inp} value={mStatus} onChange={e => setMStatus(e.target.value)}>
                    <option value="upcoming">Kommande</option>
                    <option value="live">Live</option>
                    <option value="completed">Avslutad</option>
                  </select>
                </div>
              </div>
              <button onClick={addMatch} disabled={loading} style={{ background: C.accent, color: theme === 'dark' ? '#1a1400' : '#ffffff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                + Skapa match
              </button>
            </div>

            {matches.length > 0 && (
              <div style={{ background: C.card, borderRadius: 14, border: '1px solid ' + C.border, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, letterSpacing: 1, marginBottom: 16 }}>MATCHER</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {matches.map(m => (
                    <div key={m.id} style={{ background: C.surface, borderRadius: 10, padding: '12px 14px', border: '1px solid ' + C.border }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
                          {m.home?.name} <span style={{ color: C.textMuted, fontWeight: 400 }}>vs</span> {m.away?.name}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: m.status === 'live' ? (theme === 'dark' ? '#0a3a1a' : '#e8f5ee') : (theme === 'dark' ? '#1a1a2a' : '#f0f2f5'), color: m.status === 'live' ? C.green : C.textMuted }}>
                          {m.status === 'live' ? 'LIVE' : m.status === 'completed' ? 'AVSLUTAD' : 'KOMMANDE'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>{m.date}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['upcoming', 'live', 'completed'].map(s => (
                          <button key={s} onClick={() => setMatchStatus(m.id, s)} style={{ background: m.status === s ? C.accent : C.card, color: m.status === s ? (theme === 'dark' ? '#1a1400' : '#ffffff') : C.textMuted, border: '1px solid ' + C.border, borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                            {s === 'upcoming' ? 'Kommande' : s === 'live' ? 'Live' : 'Avslutad'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'results' && (
          <div style={{ background: C.card, borderRadius: 14, border: '1px solid ' + C.border, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, letterSpacing: 1, marginBottom: 20 }}>REGISTRERA SERIE</div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>TYP AV RESULTAT</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ value: 'league', label: 'Seriematch', desc: 'Visas pa lagsidan' }, { value: 'individual', label: 'Individuell', desc: 'Visas bara pa spelarsidan' }].map(opt => (
                  <button key={opt.value} onClick={() => setRType(opt.value)} style={{ flex: 1, background: rType === opt.value ? (theme === 'dark' ? (opt.value === 'league' ? '#0a3a1a' : '#1a0a3a') : (opt.value === 'league' ? '#e8f5ee' : '#f0e8ff')) : C.surface, border: '1px solid ' + (rType === opt.value ? (opt.value === 'league' ? C.green : C.accent) : C.border), borderRadius: 10, padding: '12px', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: rType === opt.value ? (opt.value === 'league' ? C.green : C.accent) : C.text, marginBottom: 2 }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            {rType === 'league' && matches.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>KOPPLAD MATCH (valfritt)</label>
                <select style={inp} value={rMatch} onChange={e => setRMatch(e.target.value)}>
                  <option value="">-- Valj match --</option>
                  {matches.filter(m => m.status !== 'upcoming').map(m => (
                    <option key={m.id} value={m.id}>{m.home?.name} vs {m.away?.name} ({m.date})</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>LAG</label>
                <select style={inp} value={rTeam} onChange={e => { setRTeam(e.target.value); setRPlayer('') }}>
                  <option value="">-- Valj lag --</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>SPELARE</label>
                <select style={inp} value={rPlayer} onChange={e => setRPlayer(e.target.value)} disabled={!rTeam}>
                  <option value="">-- Valj spelare --</option>
                  {teamPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>OMGANG</label>
                <input style={inp} value={rRound} onChange={e => setRRound(e.target.value)} placeholder="t.ex. Kval 1" />
              </div>
              <div>
                <label style={lbl}>DATUM</label>
                <input style={inp} type="date" value={rDate} onChange={e => setRDate(e.target.value)} />
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 12 }}>SERIER</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {games.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, width: 56, flexShrink: 0 }}>Serie {i + 1}</div>
                  <input style={{ ...inp, textAlign: 'center', fontSize: 20, fontWeight: 800, flex: 1 }} type="number" min="0" max="300" value={g} onChange={e => updateGame(i, e.target.value)} placeholder="0" />
                  {games.length > 1 && (
                    <button onClick={() => removeGame(i)} style={{ background: theme === 'dark' ? '#2a1212' : '#fff0f0', border: '1px solid #ffaaaa', color: C.red, borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>x</button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addGame} style={{ background: C.surface, border: '1px solid ' + C.border, color: C.textMuted, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, width: '100%' }}>
              + Lagg till serie
            </button>
            {seriesTotal !== null && (
              <div style={{ background: C.surface, borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: C.textMuted }}>{validGames.length} serier · Totalt</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: C.accent }}>{seriesTotal}</span>
              </div>
            )}
            <button onClick={addResult} disabled={loading} style={{ background: C.accent, color: theme === 'dark' ? '#1a1400' : '#ffffff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer', width: '100%' }}>
              {loading ? 'Sparar...' : 'Spara serie'}
            </button>
          </div>
        )}

        {tab === 'teams' && (
          <div style={{ background: C.card, borderRadius: 14, border: '1px solid ' + C.border, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, letterSpacing: 1, marginBottom: 20 }}>LAGG TILL LAG</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div><label style={lbl}>LAGNAMN</label><input style={inp} value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="t.ex. IFK Goteborg" /></div>
              <div><label style={lbl}>KLUBB</label><input style={inp} value={teamClub} onChange={e => setTeamClub(e.target.value)} placeholder="t.ex. IFK Goteborg BK" /></div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>STAD</label>
              <input style={inp} value={teamCity} onChange={e => setTeamCity(e.target.value)} placeholder="t.ex. Goteborg" />
            </div>
            <button onClick={addTeam} disabled={loading} style={{ background: C.accent, color: theme === 'dark' ? '#1a1400' : '#ffffff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              + Lagg till lag
            </button>
            {teams.length > 0 && (
              <div style={{ marginTop: 24, borderTop: '1px solid ' + C.border, paddingTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 12 }}>REGISTRERADE LAG</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {teams.map(t => <div key={t.id} style={{ background: C.surface, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.text, border: '1px solid ' + C.border }}>{t.name}</div>)}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'players' && (
          <div style={{ background: C.card, borderRadius: 14, border: '1px solid ' + C.border, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, letterSpacing: 1, marginBottom: 20 }}>LAGG TILL SPELARE</div>
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
                <label style={lbl}>KASTHAND</label>
                <select style={inp} value={playerHand} onChange={e => setPlayerHand(e.target.value)}>
                  <option value="right">Hoger</option>
                  <option value="left">Vanster</option>
                </select>
              </div>
              <div><label style={lbl}>ALDER</label><input style={inp} type="number" value={playerAge} onChange={e => setPlayerAge(e.target.value)} placeholder="25" /></div>
              <div><label style={lbl}>HEMORT</label><input style={inp} value={playerHometown} onChange={e => setPlayerHometown(e.target.value)} placeholder="Stockholm" /></div>
            </div>
            <button onClick={addPlayer} disabled={loading} style={{ background: C.accent, color: theme === 'dark' ? '#1a1400' : '#ffffff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              + Lagg till spelare
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
