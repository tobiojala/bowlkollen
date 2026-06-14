'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useColors } from '@/components/ThemeProvider'
import { shortName } from '@/lib/utils'
import { SCORE } from '@/lib/constants'

type Team = { id: string; name: string }
type Match = { id: string; home_team_id: string; away_team_id: string; date: string; status: string; home: { name: string }; away: { name: string } }
type Lineup = { id: string; team_id: string; player_name: string; bord: number; position: number }
type MatchResult = { id: string; player_id: string; team_id: string; games: number[]; bord: number; position: number }


export default function AdminPage() {
  const { C, isDark } = useColors()
  const inp = { background: C.surface, border: '1px solid ' + C.border, borderRadius: 8, padding: '10px 12px', color: C.text, fontSize: 14, outline: 'none', width: '100%' } as React.CSSProperties
  const lbl = { fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 6, display: 'block' } as React.CSSProperties

  const [tab, setTab] = useState('live')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])

  // Live scoring state
  const [liveMatch, setLiveMatch] = useState('')
  const [lineup, setLineup] = useState<Lineup[]>([])
  const [results, setResults] = useState<MatchResult[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  // New match state
  const [mHome, setMHome] = useState('')
  const [mAway, setMAway] = useState('')
  const [mDate, setMDate] = useState('')
  useEffect(() => { setMDate(new Date().toISOString().slice(0, 10)) }, [])
  const [mStatus, setMStatus] = useState('upcoming')
  const [mVenue, setMVenue] = useState('')

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const loadData = () => {
    const supabase = createClient()
    supabase.from('teams').select('id, name').order('name').then(({ data }) => { if (data) setTeams(data) })
    supabase.from('matches').select('id, home_team_id, away_team_id, date, status, home:teams!home_team_id(name), away:teams!away_team_id(name)').order('date', { ascending: false }).limit(30).then(({ data }) => { if (data) setMatches(data as unknown as Match[]) })
  }

  useEffect(() => { loadData() }, [])

  const loadLiveData = async (matchId: string) => {
    const supabase = createClient()
    const [{ data: lu }, { data: rs }] = await Promise.all([
      supabase.from('match_lineups').select('*').eq('match_id', matchId).order('bord').order('position'),
      supabase.from('match_results').select('*').eq('match_id', matchId),
    ])
    setLineup((lu || []) as Lineup[])
    setResults((rs || []) as MatchResult[])
  }

  const selectLiveMatch = async (matchId: string) => {
    setLiveMatch(matchId)
    const m = matches.find(m => m.id === matchId) || null
    setSelectedMatch(m)
    if (matchId) await loadLiveData(matchId)
  }

  const addPlayer = async (teamId: string, name: string, bord: number, position: number) => {
    if (!name.trim()) return
    const already = lineup.find(l => l.team_id === teamId && l.bord === bord && l.position === position)
    if (already) return flash(`Bord ${bord} pos ${position} har redan ${already.player_name}`)
    const supabase = createClient()
    const { error } = await supabase.from('match_lineups').insert({ match_id: liveMatch, team_id: teamId, player_name: name.trim(), bord, position })
    if (error) flash('Fel: ' + error.message)
    else await loadLiveData(liveMatch)
  }

  const saveScore = async (teamId: string, bord: number, position: number, gameIndex: number, score: number) => {
    const supabase = createClient()
    const player = lineup.find(l => l.team_id === teamId && l.bord === bord && l.position === position)
    if (!player) return

    const existing = results.find(r => r.team_id === teamId && r.bord === bord && r.position === position)
    if (existing) {
      const games = [...(existing.games || [0, 0, 0, 0])]
      while (games.length <= gameIndex) games.push(0)
      games[gameIndex] = score
      await supabase.from('match_results').update({ games, total: games.reduce((a, b) => a + b, 0) }).eq('id', existing.id)
    } else {
      const games = [0, 0, 0, 0]
      games[gameIndex] = score
      await supabase.from('match_results').insert({ match_id: liveMatch, team_id: teamId, bord, position, games, total: score, type: 'league' })
    }
    await loadLiveData(liveMatch)

    // Auto-update match score based on series wins
    await updateMatchScore()
  }

  const updateMatchScore = async () => {
    if (!selectedMatch) return
    const supabase = createClient()
    const homeResults = results.filter(r => r.team_id === selectedMatch.home_team_id)
    const awayResults = results.filter(r => r.team_id === selectedMatch.away_team_id)
    // Count banp (wins per game per pair)
    let homeScore = 0, awayScore = 0
    for (let bord = 1; bord <= 4; bord++) {
      for (let pos = 1; pos <= 2; pos++) {
        const hr = homeResults.find(r => r.bord === bord && r.position === pos)
        const ar = awayResults.find(r => r.bord === bord && r.position === pos)
        if (!hr || !ar) continue
        for (let g = 0; g < 4; g++) {
          const hg = (hr.games || [])[g] || 0
          const ag = (ar.games || [])[g] || 0
          if (hg > ag) homeScore++
          else if (ag > hg) awayScore++
        }
      }
    }
    await supabase.from('matches').update({ home_score: homeScore, away_score: awayScore, status: 'live' }).eq('id', liveMatch)
  }

  const setMatchStatus = async (id: string, status: string) => {
    const supabase = createClient()
    await supabase.from('matches').update({ status }).eq('id', id)
    loadData()
    flash('Status uppdaterad')
  }

  const addMatch = async () => {
    if (!mHome || !mAway) return flash('Valj hemmalag och bortalag')
    if (mHome === mAway) return flash('Lagen maste vara olika')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('matches').insert({ home_team_id: mHome, away_team_id: mAway, date: mDate, status: mStatus, venue: mVenue || null })
    if (error) flash('Fel: ' + error.message)
    else { flash('Match skapad!'); setMHome(''); setMAway(''); setMVenue(''); loadData() }
    setLoading(false)
  }

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const tabs = [
    { id: 'live', label: '● Live Scoring' },
    { id: 'matches', label: 'Matcher' },
    { id: 'teams', label: 'Lag' },
  ]

  const homeTeam = selectedMatch ? teams.find(t => t.id === selectedMatch.home_team_id) : null
  const awayTeam = selectedMatch ? teams.find(t => t.id === selectedMatch.away_team_id) : null

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>
          Bowl<span style={{ color: '#f5c200' }}>kollen</span>
          <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 400, marginLeft: 10 }}>Admin</span>
        </div>
        <button onClick={logout} style={{ background: C.surface, border: '1px solid ' + C.border, borderRadius: 8, padding: '6px 14px', fontSize: 12, color: C.textMuted, cursor: 'pointer' }}>
          Logga ut
        </button>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 60px' }}>
        {msg && (
          <div style={{ background: msg.includes('Fel') ? (isDark ? '#2a1212' : '#fff0f0') : (isDark ? '#122a1a' : '#f0fff4'), border: '1px solid ' + (msg.includes('Fel') ? '#ffaaaa' : '#aaffcc'), borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, fontWeight: 600, color: msg.includes('Fel') ? C.red : C.green }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: C.surface, borderRadius: 10, padding: 4, border: '1px solid ' + C.border }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: tab === t.id ? C.card : 'transparent', border: tab === t.id ? '1px solid ' + C.border : '1px solid transparent', borderRadius: 8, padding: '9px', fontSize: 12, fontWeight: 700, color: tab === t.id ? (t.id === 'live' ? '#e05555' : C.accent) : C.textMuted, cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* LIVE SCORING TAB */}
        {tab === 'live' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>VALJ MATCH ATT SCORA</label>
              <select style={inp} value={liveMatch} onChange={e => selectLiveMatch(e.target.value)}>
                <option value="">-- Valj match --</option>
                {matches.filter(m => m.status !== 'completed').map(m => (
                  <option key={m.id} value={m.id}>
                    {m.home?.name ? shortName(m.home.name) : ''} vs {m.away?.name ? shortName(m.away.name) : ''} — {m.date?.slice(0, 10)} ({m.status})
                  </option>
                ))}
              </select>
            </div>

            {liveMatch && selectedMatch && (
              <div>
                {/* Match header */}
                <div style={{ background: C.card, borderRadius: 14, border: '1px solid ' + C.border, padding: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
                    {shortName(selectedMatch.home?.name || '')} vs {shortName(selectedMatch.away?.name || '')}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['upcoming', 'live', 'completed'].map(s => (
                      <button key={s} onClick={() => setMatchStatus(liveMatch, s)} style={{ background: selectedMatch.status === s ? C.accent : C.surface, color: selectedMatch.status === s ? '#1a1400' : C.textMuted, border: '1px solid ' + C.border, borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        {s === 'upcoming' ? 'Kommande' : s === 'live' ? '● Live' : 'Avslutad'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lineup entry — 4 bord, 2 players each team */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  {[
                    { team: homeTeam, teamId: selectedMatch.home_team_id, label: 'HEMMALAG' },
                    { team: awayTeam, teamId: selectedMatch.away_team_id, label: 'BORTALAG' },
                  ].map(({ team, teamId, label }) => (
                    <div key={teamId} style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, padding: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 1, marginBottom: 12 }}>
                        {label} — {team ? shortName(team.name) : ''}
                      </div>
                      {[1, 2, 3, 4].map(bord => (
                        <div key={bord} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, marginBottom: 6 }}>BORD {bord}</div>
                          {[1, 2].map(pos => {
                            const existing = lineup.find(l => l.team_id === teamId && l.bord === bord && l.position === pos)
                            const result = results.find(r => r.team_id === teamId && r.bord === bord && r.position === pos)
                            return (
                              <div key={pos} style={{ marginBottom: 8 }}>
                                {!existing ? (
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <input
                                      style={{ ...inp, fontSize: 12, padding: '7px 10px' }}
                                      placeholder={'Spelare ' + pos}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                          const val = (e.target as HTMLInputElement).value
                                          addPlayer(teamId, val, bord, pos)
                                          ;(e.target as HTMLInputElement).value = ''
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={e => {
                                        const input = (e.currentTarget.previousSibling as HTMLInputElement)
                                        addPlayer(teamId, input.value, bord, pos)
                                        input.value = ''
                                      }}
                                      style={{ background: C.accent, color: '#1a1400', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                                      {existing.player_name}
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      {[0, 1, 2, 3].map(gi => {
                                        const currentVal = (result?.games || [])[gi] || 0
                                        return (
                                          <div key={gi} style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 2 }}>S{gi + 1}</div>
                                            <input
                                              type="number"
                                              min={SCORE.MIN}
                                              max={SCORE.PERFECT}
                                              defaultValue={currentVal || ''}
                                              style={{ ...inp, textAlign: 'center', fontSize: 16, fontWeight: 800, padding: '6px 2px', color: currentVal > 0 ? C.accent : C.textMuted }}
                                              onBlur={e => {
                                                const val = parseInt(e.target.value)
                                                if (!isNaN(val) && val >= SCORE.MIN && val <= SCORE.PERFECT) {
                                                  saveScore(teamId, bord, pos, gi, val)
                                                }
                                              }}
                                              onKeyDown={e => {
                                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                                              }}
                                            />
                                          </div>
                                        )
                                      })}
                                      <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 2 }}>TOT</div>
                                        <div style={{ background: C.surface, borderRadius: 8, padding: '6px 2px', fontSize: 16, fontWeight: 900, color: C.accent, border: '1px solid ' + C.border, textAlign: 'center' }}>
                                          {(result?.games || []).reduce((a, b) => a + b, 0) || '—'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Live scorecard preview */}
                {lineup.length > 0 && (
                  <div style={{ background: C.card, borderRadius: 12, border: '1px solid ' + C.border, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: C.surface, borderBottom: '1px solid ' + C.border, fontSize: 12, fontWeight: 700, color: C.textMuted, letterSpacing: 1 }}>
                      LIVE SCORECARD FORHANSVISNING
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: C.surface }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: C.textMuted, fontWeight: 700, fontSize: 10, letterSpacing: 1, borderBottom: '1px solid ' + C.border }}>SPELARE</th>
                            <th style={{ padding: '8px 8px', textAlign: 'center', color: C.textMuted, fontWeight: 700, fontSize: 10, borderBottom: '1px solid ' + C.border }}>S1</th>
                            <th style={{ padding: '8px 8px', textAlign: 'center', color: C.textMuted, fontWeight: 700, fontSize: 10, borderBottom: '1px solid ' + C.border }}>S2</th>
                            <th style={{ padding: '8px 8px', textAlign: 'center', color: C.textMuted, fontWeight: 700, fontSize: 10, borderBottom: '1px solid ' + C.border }}>S3</th>
                            <th style={{ padding: '8px 8px', textAlign: 'center', color: C.textMuted, fontWeight: 700, fontSize: 10, borderBottom: '1px solid ' + C.border }}>S4</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center', color: C.accent, fontWeight: 700, fontSize: 10, borderBottom: '1px solid ' + C.border }}>TOT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[selectedMatch.home_team_id, selectedMatch.away_team_id].map((teamId, ti) => {
                            const teamLineup = lineup.filter(l => l.team_id === teamId).sort((a, b) => a.bord - b.bord || a.position - b.position)
                            const teamName = ti === 0 ? shortName(selectedMatch.home?.name || '') : shortName(selectedMatch.away?.name || '')
                            const teamResults = results.filter(r => r.team_id === teamId)
                            const serTotals = [0, 1, 2, 3].map(gi => teamResults.reduce((sum, r) => sum + ((r.games || [])[gi] || 0), 0))
                            const grandTotal = serTotals.reduce((a, b) => a + b, 0)
                            return (
                              <React.Fragment key={teamId}>
                                <tr>
                                  <td colSpan={6} style={{ padding: '8px 12px', background: C.surface, fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: 1 }}>
                                    {teamName.toUpperCase()}
                                  </td>
                                </tr>
                                {teamLineup.map(p => {
                                  const r = results.find(r => r.team_id === teamId && r.bord === p.bord && r.position === p.position)
                                  const games = r?.games || []
                                  const total = games.reduce((a, b) => a + b, 0)
                                  return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid ' + C.border }}>
                                      <td style={{ padding: '8px 12px', color: C.text, fontWeight: 500 }}>
                                        {p.player_name}
                                        <span style={{ fontSize: 9, color: C.textMuted, marginLeft: 6 }}>B{p.bord}</span>
                                      </td>
                                      {[0, 1, 2, 3].map(gi => (
                                        <td key={gi} style={{ padding: '8px', textAlign: 'center', color: (games[gi] || 0) >= 200 ? C.green : C.text, fontWeight: (games[gi] || 0) >= 200 ? 700 : 400 }}>
                                          {games[gi] || '—'}
                                        </td>
                                      ))}
                                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 800, color: C.accent }}>
                                        {total || '—'}
                                      </td>
                                    </tr>
                                  )
                                })}
                                <tr style={{ background: C.surface, borderBottom: '2px solid ' + C.border }}>
                                  <td style={{ padding: '8px 12px', fontWeight: 800, color: C.textMuted, fontSize: 11 }}>LAGTOTAL</td>
                                  {serTotals.map((t, i) => (
                                    <td key={i} style={{ padding: '8px', textAlign: 'center', fontWeight: 800, color: C.text }}>{t || '—'}</td>
                                  ))}
                                  <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 900, fontSize: 15, color: C.accent }}>{grandTotal || '—'}</td>
                                </tr>
                              </React.Fragment>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MATCHES TAB */}
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
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>ARENA / VENUE</label>
                  <input style={inp} value={mVenue} onChange={e => setMVenue(e.target.value)} placeholder="t.ex. RC Bowl Arena, Jonkoping" />
                </div>
              </div>
              <button onClick={addMatch} disabled={loading} style={{ background: C.accent, color: '#1a1400', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
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
                          {m.home?.name ? shortName(m.home.name) : ''} <span style={{ color: C.textMuted, fontWeight: 400 }}>vs</span> {m.away?.name ? shortName(m.away.name) : ''}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: m.status === 'live' ? (isDark ? '#0a3a1a' : '#e8f5ee') : (isDark ? '#1a1a2a' : '#f0f2f5'), color: m.status === 'live' ? C.green : C.textMuted }}>
                          {m.status === 'live' ? 'LIVE' : m.status === 'completed' ? 'AVSLUTAD' : 'KOMMANDE'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>{m.date?.slice(0, 10)}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['upcoming', 'live', 'completed'].map(s => (
                          <button key={s} onClick={() => setMatchStatus(m.id, s)} style={{ background: m.status === s ? C.accent : C.card, color: m.status === s ? '#1a1400' : C.textMuted, border: '1px solid ' + C.border, borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
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

        {/* TEAMS TAB */}
        {tab === 'teams' && (
          <div style={{ background: C.card, borderRadius: 14, border: '1px solid ' + C.border, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, letterSpacing: 1, marginBottom: 16 }}>LAG I DATABASEN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {teams.map(t => (
                <div key={t.id} style={{ background: C.surface, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.text, border: '1px solid ' + C.border }}>
                  {t.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
