'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { shortName } from '@/lib/utils'
import {
  adminCardClass,
  adminFlashClass,
  adminGhostBtnClass,
  adminIconBtnClass,
  adminInputClass,
  adminLabelClass,
  adminMatchStatusBadge,
  adminPrimaryBtnClass,
  adminSectionTitleClass,
  adminStatusChipClass,
  adminSurfaceCardClass,
  adminTabClass,
} from '@/lib/admin-ui'

type Team = { id: string; name: string }
type Match = {
  id: string
  home_team_id: string
  away_team_id: string
  date: string
  status: string
  home: { name: string }
  away: { name: string }
}
type Lineup = { id: string; team_id: string; player_name: string; bord: number; position: number }
type MatchResult = {
  id: string
  player_id: string
  team_id: string
  games: number[]
  bord: number
  position: number
}

const TABS = [
  { id: 'live', label: '● Live Scoring' },
  { id: 'matches', label: 'Matcher' },
  { id: 'teams', label: 'Lag' },
] as const

export function AdminPageContent() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('live')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])

  const [liveMatch, setLiveMatch] = useState('')
  const [lineup, setLineup] = useState<Lineup[]>([])
  const [results, setResults] = useState<MatchResult[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  const [mHome, setMHome] = useState('')
  const [mAway, setMAway] = useState('')
  const [mDate, setMDate] = useState(new Date().toISOString().slice(0, 10))
  const [mStatus, setMStatus] = useState('upcoming')
  const [mVenue, setMVenue] = useState('')

  const flash = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 4000)
  }

  const loadData = () => {
    const supabase = createClient()
    supabase
      .from('teams')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (data) setTeams(data)
      })
    supabase
      .from('matches')
      .select(
        'id, home_team_id, away_team_id, date, status, home:teams!home_team_id(name), away:teams!away_team_id(name)',
      )
      .order('date', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) setMatches(data as unknown as Match[])
      })
  }

  useEffect(() => {
    loadData()
  }, [])

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
    const m = matches.find(x => x.id === matchId) || null
    setSelectedMatch(m)
    if (matchId) await loadLiveData(matchId)
  }

  const addPlayer = async (teamId: string, name: string, bord: number, position: number) => {
    if (!name.trim()) return
    const already = lineup.find(l => l.team_id === teamId && l.bord === bord && l.position === position)
    if (already) return flash(`Bord ${bord} pos ${position} har redan ${already.player_name}`)
    const supabase = createClient()
    const { error } = await supabase.from('match_lineups').insert({
      match_id: liveMatch,
      team_id: teamId,
      player_name: name.trim(),
      bord,
      position,
    })
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
      await supabase
        .from('match_results')
        .update({ games, total: games.reduce((a, b) => a + b, 0) })
        .eq('id', existing.id)
    } else {
      const games = [0, 0, 0, 0]
      games[gameIndex] = score
      await supabase.from('match_results').insert({
        match_id: liveMatch,
        team_id: teamId,
        bord,
        position,
        games,
        total: score,
        type: 'league',
      })
    }
    await loadLiveData(liveMatch)
    await updateMatchScore()
  }

  const updateMatchScore = async () => {
    if (!selectedMatch) return
    const supabase = createClient()
    const homeResults = results.filter(r => r.team_id === selectedMatch.home_team_id)
    const awayResults = results.filter(r => r.team_id === selectedMatch.away_team_id)
    let homeScore = 0
    let awayScore = 0
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
    await supabase
      .from('matches')
      .update({ home_score: homeScore, away_score: awayScore, status: 'live' })
      .eq('id', liveMatch)
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
    const { error } = await supabase.from('matches').insert({
      home_team_id: mHome,
      away_team_id: mAway,
      date: mDate,
      status: mStatus,
      venue: mVenue || null,
    })
    if (error) flash('Fel: ' + error.message)
    else {
      flash('Match skapad!')
      setMHome('')
      setMAway('')
      setMVenue('')
      loadData()
    }
    setLoading(false)
  }

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const homeTeam = selectedMatch ? teams.find(t => t.id === selectedMatch.home_team_id) : null
  const awayTeam = selectedMatch ? teams.find(t => t.id === selectedMatch.away_team_id) : null

  return (
    <div className="text-light-text dark:text-dark-text">
      <div className="mx-auto mb-4 flex max-w-[1000px] items-center justify-between px-6 pt-6">
        <div className="text-lg font-extrabold">
          Bowl<span className="text-gold">kollen</span>
          <span className="ml-2.5 text-[13px] font-normal text-dark-muted">Admin</span>
        </div>
        <button type="button" onClick={logout} className={adminGhostBtnClass}>
          Logga ut
        </button>
      </div>

      <div className="mx-auto max-w-[1000px] px-6 pb-15">
        {msg && <div className={adminFlashClass(msg.includes('Fel'))}>{msg}</div>}

        <div className="mb-6 flex gap-1 rounded-[10px] border border-light-border bg-light-surface p-1 dark:border-dark-border dark:bg-dark-surface">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={adminTabClass(tab === t.id, t.id === 'live')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'live' && (
          <div>
            <div className="mb-5">
              <label className={adminLabelClass}>VALJ MATCH ATT SCORA</label>
              <select className={adminInputClass} value={liveMatch} onChange={e => selectLiveMatch(e.target.value)}>
                <option value="">-- Valj match --</option>
                {matches
                  .filter(m => m.status !== 'completed')
                  .map(m => (
                    <option key={m.id} value={m.id}>
                      {m.home?.name ? shortName(m.home.name) : ''} vs{' '}
                      {m.away?.name ? shortName(m.away.name) : ''} — {m.date?.slice(0, 10)} ({m.status})
                    </option>
                  ))}
              </select>
            </div>

            {liveMatch && selectedMatch && (
              <div>
                <div
                  className={cn(
                    adminCardClass,
                    'mb-5 flex items-center justify-between py-4',
                  )}
                >
                  <div className="text-base font-extrabold bk-text-primary">
                    {shortName(selectedMatch.home?.name || '')} vs{' '}
                    {shortName(selectedMatch.away?.name || '')}
                  </div>
                  <div className="flex gap-2">
                    {(['upcoming', 'live', 'completed'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setMatchStatus(liveMatch, s)}
                        className={adminStatusChipClass(s, selectedMatch.status === s)}
                      >
                        {s === 'upcoming' ? 'Kommande' : s === 'live' ? '● Live' : 'Avslutad'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    { team: homeTeam, teamId: selectedMatch.home_team_id, label: 'HEMMALAG' },
                    { team: awayTeam, teamId: selectedMatch.away_team_id, label: 'BORTALAG' },
                  ].map(({ team, teamId, label }) => (
                    <div key={teamId} className={cn(adminCardClass, 'p-4')}>
                      <div className="mb-3 text-[11px] font-bold tracking-wide text-gold">
                        {label} — {team ? shortName(team.name) : ''}
                      </div>
                      {[1, 2, 3, 4].map(bord => (
                        <div key={bord} className="mb-3">
                          <div className="mb-1.5 text-[10px] font-bold text-dark-muted">BORD {bord}</div>
                          {[1, 2].map(pos => {
                            const existing = lineup.find(
                              l => l.team_id === teamId && l.bord === bord && l.position === pos,
                            )
                            const result = results.find(
                              r => r.team_id === teamId && r.bord === bord && r.position === pos,
                            )
                            return (
                              <div key={pos} className="mb-2">
                                {!existing ? (
                                  <div className="flex gap-1.5">
                                    <input
                                      className={cn(adminInputClass, 'py-[7px] text-xs')}
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
                                      type="button"
                                      onClick={e => {
                                        const input = e.currentTarget.previousSibling as HTMLInputElement
                                        addPlayer(teamId, input.value, bord, pos)
                                        input.value = ''
                                      }}
                                      className={adminIconBtnClass}
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="mb-1 text-xs font-bold bk-text-primary">
                                      {existing.player_name}
                                    </div>
                                    <div className="flex gap-1">
                                      {[0, 1, 2, 3].map(gi => {
                                        const currentVal = (result?.games || [])[gi] || 0
                                        return (
                                          <div key={gi} className="flex-1 text-center">
                                            <div className="mb-0.5 text-[9px] text-dark-muted">
                                              S{gi + 1}
                                            </div>
                                            <input
                                              type="number"
                                              min={0}
                                              max={300}
                                              defaultValue={currentVal || ''}
                                              className={cn(
                                                adminInputClass,
                                                'px-0.5 py-1.5 text-center text-base font-extrabold',
                                                currentVal > 0 ? 'text-gold' : 'text-dark-muted',
                                              )}
                                              onBlur={e => {
                                                const val = parseInt(e.target.value, 10)
                                                if (!isNaN(val) && val >= 0 && val <= 300) {
                                                  saveScore(teamId, bord, pos, gi, val)
                                                }
                                              }}
                                              onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                  (e.target as HTMLInputElement).blur()
                                                }
                                              }}
                                            />
                                          </div>
                                        )
                                      })}
                                      <div className="flex-1 text-center">
                                        <div className="mb-0.5 text-[9px] text-dark-muted">TOT</div>
                                        <div className="rounded-lg border border-light-border bg-light-surface py-1.5 text-center text-base font-black text-gold dark:border-dark-border dark:bg-dark-surface">
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

                {lineup.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-light-border dark:border-dark-border">
                    <div className="border-b border-light-border bg-light-surface px-4 py-3 text-xs font-bold tracking-wide text-dark-muted dark:border-dark-border dark:bg-dark-surface">
                      LIVE SCORECARD FORHANSVISNING
                    </div>
                    <div className="overflow-x-auto bg-light-card dark:bg-dark-card">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-light-surface dark:bg-dark-surface">
                            <th className="border-b border-light-border px-3 py-2 text-left text-[10px] font-bold tracking-wide text-dark-muted dark:border-dark-border">
                              SPELARE
                            </th>
                            {['S1', 'S2', 'S3', 'S4'].map(h => (
                              <th
                                key={h}
                                className="border-b border-light-border px-2 py-2 text-center text-[10px] font-bold text-dark-muted dark:border-dark-border"
                              >
                                {h}
                              </th>
                            ))}
                            <th className="border-b border-light-border px-3 py-2 text-center text-[10px] font-bold text-gold dark:border-dark-border">
                              TOT
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[selectedMatch.home_team_id, selectedMatch.away_team_id].map((teamId, ti) => {
                            const teamLineup = lineup
                              .filter(l => l.team_id === teamId)
                              .sort((a, b) => a.bord - b.bord || a.position - b.position)
                            const teamName =
                              ti === 0
                                ? shortName(selectedMatch.home?.name || '')
                                : shortName(selectedMatch.away?.name || '')
                            const teamResults = results.filter(r => r.team_id === teamId)
                            const serTotals = [0, 1, 2, 3].map(gi =>
                              teamResults.reduce((sum, r) => sum + ((r.games || [])[gi] || 0), 0),
                            )
                            const grandTotal = serTotals.reduce((a, b) => a + b, 0)
                            return (
                              <React.Fragment key={teamId}>
                                <tr>
                                  <td
                                    colSpan={6}
                                    className="bg-light-surface px-3 py-2 text-[11px] font-extrabold tracking-wide text-gold dark:bg-dark-surface"
                                  >
                                    {teamName.toUpperCase()}
                                  </td>
                                </tr>
                                {teamLineup.map(p => {
                                  const r = results.find(
                                    x =>
                                      x.team_id === teamId &&
                                      x.bord === p.bord &&
                                      x.position === p.position,
                                  )
                                  const games = r?.games || []
                                  const total = games.reduce((a, b) => a + b, 0)
                                  return (
                                    <tr
                                      key={p.id}
                                      className="border-b border-light-border dark:border-dark-border"
                                    >
                                      <td className="px-3 py-2 font-medium bk-text-primary">
                                        {p.player_name}
                                        <span className="ml-1.5 text-[9px] text-dark-muted">B{p.bord}</span>
                                      </td>
                                      {[0, 1, 2, 3].map(gi => {
                                        const g = games[gi] || 0
                                        return (
                                          <td
                                            key={gi}
                                            className={cn(
                                              'px-2 py-2 text-center',
                                              g >= 200
                                                ? 'font-bold text-[#4caf7d]'
                                                : 'font-normal bk-text-primary',
                                            )}
                                          >
                                            {games[gi] || '—'}
                                          </td>
                                        )
                                      })}
                                      <td className="px-3 py-2 text-center font-extrabold text-gold">
                                        {total || '—'}
                                      </td>
                                    </tr>
                                  )
                                })}
                                <tr className="border-b-2 border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface">
                                  <td className="px-3 py-2 text-[11px] font-extrabold text-dark-muted">
                                    LAGTOTAL
                                  </td>
                                  {serTotals.map((t, i) => (
                                    <td key={i} className="px-2 py-2 text-center font-extrabold bk-text-primary">
                                      {t || '—'}
                                    </td>
                                  ))}
                                  <td className="px-3 py-2 text-center text-[15px] font-black text-gold">
                                    {grandTotal || '—'}
                                  </td>
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

        {tab === 'matches' && (
          <div className="flex flex-col gap-4">
            <div className={adminCardClass}>
              <div className={adminSectionTitleClass}>SKAPA MATCH</div>
              <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className={adminLabelClass}>HEMMALAG</label>
                  <select className={adminInputClass} value={mHome} onChange={e => setMHome(e.target.value)}>
                    <option value="">-- Valj lag --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={adminLabelClass}>BORTALAG</label>
                  <select className={adminInputClass} value={mAway} onChange={e => setMAway(e.target.value)}>
                    <option value="">-- Valj lag --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={adminLabelClass}>DATUM</label>
                  <input
                    className={adminInputClass}
                    type="date"
                    value={mDate}
                    onChange={e => setMDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className={adminLabelClass}>STATUS</label>
                  <select className={adminInputClass} value={mStatus} onChange={e => setMStatus(e.target.value)}>
                    <option value="upcoming">Kommande</option>
                    <option value="live">Live</option>
                    <option value="completed">Avslutad</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={adminLabelClass}>ARENA / VENUE</label>
                  <input
                    className={adminInputClass}
                    value={mVenue}
                    onChange={e => setMVenue(e.target.value)}
                    placeholder="t.ex. RC Bowl Arena, Jonkoping"
                  />
                </div>
              </div>
              <button type="button" onClick={addMatch} disabled={loading} className={adminPrimaryBtnClass}>
                + Skapa match
              </button>
            </div>

            {matches.length > 0 && (
              <div className={adminCardClass}>
                <div className={adminSectionTitleClass}>MATCHER</div>
                <div className="flex flex-col gap-2">
                  {matches.map(m => (
                    <div key={m.id} className={adminSurfaceCardClass}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm font-bold bk-text-primary">
                          {m.home?.name ? shortName(m.home.name) : ''}{' '}
                          <span className="font-normal text-dark-muted">vs</span>{' '}
                          {m.away?.name ? shortName(m.away.name) : ''}
                        </div>
                        <span className={adminMatchStatusBadge(m.status)}>
                          {m.status === 'live'
                            ? 'LIVE'
                            : m.status === 'completed'
                              ? 'AVSLUTAD'
                              : 'KOMMANDE'}
                        </span>
                      </div>
                      <div className="mb-2 text-[11px] text-dark-muted">{m.date?.slice(0, 10)}</div>
                      <div className="flex gap-1.5">
                        {(['upcoming', 'live', 'completed'] as const).map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setMatchStatus(m.id, s)}
                            className={cn(
                              'cursor-pointer rounded-md border px-2.5 py-0.5 text-[10px] font-bold',
                              m.status === s
                                ? 'border-gold/30 bg-gold text-[#1a1400]'
                                : 'border-light-border bg-light-card text-dark-muted dark:border-dark-border dark:bg-dark-card',
                            )}
                          >
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

        {tab === 'teams' && (
          <div className={adminCardClass}>
            <div className={adminSectionTitleClass}>LAG I DATABASEN</div>
            <div className="flex flex-col gap-1.5">
              {teams.map(t => (
                <div key={t.id} className={cn(adminSurfaceCardClass, 'text-[13px] bk-text-primary')}>
                  {t.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
