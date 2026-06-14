'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useColors } from '@/components/ThemeProvider'
import { motion } from 'framer-motion'
import LiveLaneViewer from '@/components/LiveLaneViewer'
import { shortName } from '@/lib/utils'
import { useMatch, useMatchLineup, useMatchResults, keys } from '@/lib/queries'
import { SCORE } from '@/lib/constants'
import type { Lineup, MatchResult } from '@/lib/types'
import MatchHero from './MatchHero'

type MatchRow = {
  id: string; date: string; status: string; division: string
  home_score: number | null; away_score: number | null
  home_team_id: string; away_team_id: string
  round?: number | null; venue?: string | null; oil_profile?: string | null
  stream_url?: string | null
  home: { id: string; name: string; club?: string }
  away: { id: string; name: string; club?: string }
}

type H2hMatch = {
  id: string; date: string
  home_score: number | null; away_score: number | null
  home: { id: string; name: string }
  away: { id: string; name: string }
}

const SPRING     = { type: 'spring', stiffness: 300, damping: 30 } as const
const SERIE_TABS = ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Totalt']

function ScoreChip({ score, C, shareData }: {
  score: number
  C: ReturnType<typeof useColors>['C']
  shareData?: { playerName: string; matchLabel: string }
}) {
  if (!score) return <span style={{ fontSize: 16, color: C.muted, opacity: 0.25, lineHeight: 1 }}>—</span>

  const isElite  = score >= SCORE.ELITE          // ≥250 — gold milestone, largest
  const isGreat  = score >= SCORE.GREAT && score < SCORE.ELITE  // 220–249 — green (positive)
  const isGood   = score >= SCORE.GOOD  && score < SCORE.GREAT  // 200–219 — green (positive)
  const isNormal = score >= 150 && score < SCORE.GOOD            // 150–199 — muted ink
  // Below 150 stays even more faded. Gold is reserved for the 250+ milestone.
  const color = isElite ? '#f5c200' : (isGreat || isGood) ? '#5dcaa5' : C.muted
  const size  = isElite ? 28 : isGreat ? 25 : isGood ? 22 : isNormal ? 19 : 17
  const opacity = isElite || isGreat || isGood ? 1 : isNormal ? 0.75 : 0.45

  const handleShare = () => {
    if (!shareData) return
    const text = `${shareData.playerName} rullade ${score} pinnar i ${shareData.matchLabel} 🎳`
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'Bowlkollen', text, url: window.location.href }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text + '\n' + window.location.href)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span className="num" style={{ fontSize: size, color, opacity, lineHeight: 1 }}>{score}</span>
      {score >= SCORE.GREAT && shareData && (
        <button onClick={handleShare} title="Dela" style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '2px 3px',
          fontSize: 12, lineHeight: 1,
          color: isElite ? 'rgba(245,194,0,0.45)' : 'rgba(93,202,165,0.5)',
          WebkitTapHighlightColor: 'transparent',
        }}>↗</button>
      )}
    </div>
  )
}

export default function MatchClient({ id }: { id: string }) {
  const { C, isDark } = useColors()
  const qc = useQueryClient()

  const { data: matchRaw, isLoading: matchLoading } = useMatch(id)
  const { data: lineupRaw = [] }                    = useMatchLineup(id)
  const { data: resultsRaw = [] }                   = useMatchResults(id)

  const match   = matchRaw as MatchRow | undefined
  const lineup  = lineupRaw as Lineup[]
  const results = resultsRaw as MatchResult[]

  const [activeSerie, setActiveSerie] = useState(0)
  const [playerIds,   setPlayerIds]   = useState<Record<string, string>>({})
  const [h2h,         setH2h]         = useState<H2hMatch[]>([])
  const [now,         setNow]         = useState(Date.now())

  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(ticker)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('match-' + id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_results', filter: 'match_id=eq.' + id },
        () => qc.invalidateQueries({ queryKey: keys.matchResults(id) }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_lineups', filter: 'match_id=eq.' + id },
        () => qc.invalidateQueries({ queryKey: keys.matchLineup(id) }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: 'id=eq.' + id },
        () => qc.invalidateQueries({ queryKey: keys.match(id) }))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, qc])

  useEffect(() => {
    if (!lineup.length) return
    const names = [...new Set(lineup.map(l => l.player_name).filter(Boolean))]
    if (!names.length) return
    createClient().from('players').select('id,name').in('name', names)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {}
          data.forEach(p => { map[p.name] = p.id })
          setPlayerIds(map)
        }
      })
  }, [lineup])

  useEffect(() => {
    if (!match) return
    createClient()
      .from('matches')
      .select('id,date,home_score,away_score,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
      .neq('id', id).not('home_score', 'is', null)
      .or(`and(home_team_id.eq.${match.home_team_id},away_team_id.eq.${match.away_team_id}),and(home_team_id.eq.${match.away_team_id},away_team_id.eq.${match.home_team_id})`)
      .order('date', { ascending: false }).limit(5)
      .then(({ data }) => { if (data) setH2h(data as unknown as H2hMatch[]) })
  }, [match?.home_team_id, match?.away_team_id])

  if (matchLoading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.muted }}>Laddar...</div>
    </main>
  )
  if (!match) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.muted }}>Match hittades inte</div>
    </main>
  )

  const home = match.home, away = match.away
  const homeTotal = match.home_score, awayTotal = match.away_score
  const homeWin = (homeTotal ?? 0) > (awayTotal ?? 0)
  const awayWin = (awayTotal ?? 0) > (homeTotal ?? 0)
  const hasScore = homeTotal !== null && awayTotal !== null
  const isLive = match.status === 'live'
  const isUpcoming = match.status === 'upcoming'
  const hasLineup = lineup.length > 0

  const getScore = (teamId: string, bord: number, pos: number) => {
    const games = results.find(r => r.team_id === teamId && r.bord === bord && r.position === pos)?.games || []
    return activeSerie === 4 ? games.reduce((a, b) => a + b, 0) : games[activeSerie] || 0
  }
  const seriesTotal = (teamId: string, gi: number) =>
    results.filter(r => r.team_id === teamId).reduce((s, r) => s + ((r.games || [])[gi] || 0), 0)
  const grandTotal = (teamId: string) =>
    [0,1,2,3].reduce((s, gi) => s + seriesTotal(teamId, gi), 0)

  const hGrand = grandTotal(match.home_team_id)
  const aGrand = grandTotal(match.away_team_id)

  const allPlayers = lineup.map(p => ({
    ...p,
    total: (results.find(r => r.team_id === p.team_id && r.bord === p.bord && r.position === p.position)?.games || []).reduce((a, b) => a + b, 0),
  }))
  const bestPlayer = allPlayers.length > 0 ? allPlayers.reduce((best, p) => p.total > best.total ? p : best) : null

  const serieSummary = [0,1,2,3].map(gi => ({
    gi, h: seriesTotal(match.home_team_id, gi), a: seriesTotal(match.away_team_id, gi),
  })).filter(s => s.h > 0 || s.a > 0)

  const matchTime = match.date ? new Date(match.date).getTime() : null
  const msLeft    = matchTime ? Math.max(0, matchTime - now) : null
  const cdDays    = msLeft !== null ? Math.floor(msLeft / 86_400_000) : null
  const cdHours   = msLeft !== null ? Math.floor((msLeft % 86_400_000) / 3_600_000) : null
  const cdMinutes = msLeft !== null ? Math.floor((msLeft % 3_600_000) / 60_000) : null
  const cdSeconds = msLeft !== null ? Math.floor((msLeft % 60_000) / 1_000) : null

  const border  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
  const cardBg  = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff'
  const divider = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const matchLabel = `${shortName(home?.name||'')} vs ${shortName(away?.name||'')}`

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 80 }}>

        <MatchHero
          home={home} away={away}
          homeScore={homeTotal} awayScore={awayTotal}
          homePins={hGrand} awayPins={aGrand}
          status={match.status as 'live' | 'completed' | 'upcoming'}
          division={match.division} round={match.round}
          date={match.date} venue={match.venue}
        />

        {match.oil_profile && (
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}` }}>
            <Link href={`/oljeprofiler?q=${encodeURIComponent(match.oil_profile)}`}
              style={{ fontSize: 12, color: C.accent, textDecoration: 'none', fontWeight: 600 }}>
              Oljeprofil: {match.oil_profile} ↗
            </Link>
          </div>
        )}

        {match.stream_url && isLive && (
          <div style={{ borderBottom: `1px solid #e05555` }}>
            {match.stream_url.includes('scoring.se') ? (
              <LiveLaneViewer streamUrl={match.stream_url} matchName={matchLabel} />
            ) : (
              <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: C.muted }}>Live scoring</span>
                <a href={match.stream_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: C.accent, fontWeight: 700, textDecoration: 'none' }}>Öppna ↗</a>
              </div>
            )}
          </div>
        )}

        {/* Scorecard */}
        {hasLineup && (
          <>
            <div style={{ position: 'sticky', top: 56, zIndex: 30, background: C.bg, borderBottom: `1px solid ${border}` }}>
              <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', padding: '6px 10px', gap: 2 } as React.CSSProperties}>
                {SERIE_TABS.map((label, i) => (
                  <button key={i} onClick={() => setActiveSerie(i)} style={{
                    position: 'relative', flexShrink: 0, padding: '7px 13px',
                    background: 'transparent', border: 'none', borderRadius: 10, cursor: 'pointer',
                    fontSize: 12, fontWeight: 700,
                    color: activeSerie === i ? '#f5c200' : C.muted,
                    WebkitTapHighlightColor: 'transparent',
                  } as React.CSSProperties}>
                    {activeSerie === i && (
                      <motion.div layoutId="serie-tab-capsule" transition={SPRING} style={{
                        position: 'absolute', inset: '3px 0', borderRadius: 10,
                        background: isDark ? 'rgba(245,194,0,0.10)' : 'rgba(245,194,0,0.08)',
                        border: '1px solid rgba(245,194,0,0.22)',
                      }} />
                    )}
                    <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {serieSummary.length > 0 && (
              <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)' }}>
                {serieSummary.map(({ gi, h, a }) => {
                  const hW = h > a, aW = a > h, isTab = gi === activeSerie
                  return (
                    <button key={gi} onClick={() => setActiveSerie(gi)} style={{
                      flex: 1, padding: '10px 4px 8px', border: 'none', cursor: 'pointer',
                      background: isTab ? (isDark ? 'rgba(245,194,0,0.05)' : 'rgba(245,194,0,0.04)') : 'transparent',
                      borderBottom: `2px solid ${isTab ? '#f5c200' : 'transparent'}`,
                      WebkitTapHighlightColor: 'transparent',
                    } as React.CSSProperties}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: isTab ? C.accent : C.muted, letterSpacing: '0.1em', marginBottom: 4 }}>S{gi+1}</div>
                      <span className="num" style={{ fontSize: 14, color: hW ? C.accent : (isDark ? '#e8edf5' : '#1a2535'), display: 'block', lineHeight: 1 }}>{h}</span>
                      <span style={{ fontSize: 8, color: C.muted, display: 'block', margin: '2px 0' }}>–</span>
                      <span className="num" style={{ fontSize: 14, color: aW ? C.accent : (isDark ? '#e8edf5' : '#1a2535'), display: 'block', lineHeight: 1 }}>{a}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', padding: '10px 12px 4px' }}>
              <div style={{ textAlign: 'right', paddingRight: 14 }}>
                <span className="section-label" style={{ color: C.muted }}>{shortName(home?.name || '')}</span>
              </div>
              <div />
              <div style={{ paddingLeft: 14 }}>
                <span className="section-label" style={{ color: C.muted }}>{shortName(away?.name || '')}</span>
              </div>
            </div>

            <div style={{ padding: '4px 12px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3,4].map(bord => {
                const homeP = [1,2].map(pos => ({ player: lineup.find(l => l.team_id === match.home_team_id && l.bord === bord && l.position === pos), score: getScore(match.home_team_id, bord, pos) }))
                const awayP = [1,2].map(pos => ({ player: lineup.find(l => l.team_id === match.away_team_id && l.bord === bord && l.position === pos), score: getScore(match.away_team_id, bord, pos) }))
                if (!homeP.some(p => p.player) && !awayP.some(p => p.player)) return null
                const homeSubtotal = homeP.reduce((s, p) => s + p.score, 0)
                const awaySubtotal = awayP.reduce((s, p) => s + p.score, 0)
                const homeWinsHere = homeSubtotal > 0 && homeSubtotal > awaySubtotal
                const awayWinsHere = awaySubtotal > 0 && awaySubtotal > homeSubtotal
                return (
                  <div key={bord} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)', borderBottom: `1px solid ${border}` }}>
                      <span className="section-label" style={{ color: C.muted }}>Banpar {bord}</span>
                      {homeSubtotal > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="num" style={{ fontSize: 16, color: homeWinsHere ? C.accent : (isDark ? '#e8edf5' : '#1a2535') }}>{homeSubtotal}</span>
                          <span style={{ fontSize: 10, color: C.muted }}>–</span>
                          <span className="num" style={{ fontSize: 16, color: awayWinsHere ? C.accent : (isDark ? '#e8edf5' : '#1a2535') }}>{awaySubtotal}</span>
                        </div>
                      )}
                    </div>
                    {[0,1].map(posIdx => {
                      const hp = homeP[posIdx], ap = awayP[posIdx]
                      const hWins = hp.score > 0 && ap.score > 0 && hp.score > ap.score
                      const aWins = ap.score > 0 && hp.score > 0 && ap.score > hp.score
                      return (
                        <div key={posIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', borderBottom: posIdx === 0 ? `0.5px solid ${divider}` : 'none' }}>
                          <div style={{ padding: '11px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                            {(() => {
                              const name = hp.player?.player_name
                              const pid = name ? playerIds[name] : null
                              const s: React.CSSProperties = { fontSize: 12, fontWeight: hWins ? 600 : 400, color: hWins ? (isDark ? '#e8edf5' : '#111') : C.muted, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', textDecoration: 'none' }
                              return pid ? <Link href={`/players/${pid}`} style={{ ...s, color: C.accent }}>{name}</Link> : <span style={s}>{name || '—'}</span>
                            })()}
                            <ScoreChip score={hp.score} C={C} shareData={hp.score >= SCORE.GREAT && hp.player?.player_name ? { playerName: hp.player.player_name, matchLabel } : undefined} />
                          </div>
                          <div style={{ background: divider }} />
                          <div style={{ padding: '11px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
                            {(() => {
                              const name = ap.player?.player_name
                              const pid = name ? playerIds[name] : null
                              const s: React.CSSProperties = { fontSize: 12, fontWeight: aWins ? 600 : 400, color: aWins ? (isDark ? '#e8edf5' : '#111') : C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', textDecoration: 'none' }
                              return pid ? <Link href={`/players/${pid}`} style={{ ...s, color: C.accent }}>{name}</Link> : <span style={s}>{name || '—'}</span>
                            })()}
                            <ScoreChip score={ap.score} C={C} shareData={ap.score >= SCORE.GREAT && ap.player?.player_name ? { playerName: ap.player.player_name, matchLabel } : undefined} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Best player achievement card */}
        {bestPlayer && bestPlayer.total > 0 && (
          <div style={{ margin: '0 12px 16px', background: isDark ? 'rgba(245,194,0,0.06)' : 'rgba(245,194,0,0.05)', border: '1px solid rgba(245,194,0,0.22)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(245,194,0,0.14)' }}>
              <span className="section-label" style={{ color: '#c8a830' }}>Bästa spelare</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'rgba(245,194,0,0.12)', border: '1.5px solid rgba(245,194,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏆</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {playerIds[bestPlayer.player_name] ? (
                  <Link href={`/players/${playerIds[bestPlayer.player_name]}`} style={{ fontSize: 15, fontWeight: 700, color: '#f5c200', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bestPlayer.player_name}
                  </Link>
                ) : (
                  <div style={{ fontSize: 15, fontWeight: 700, color: isDark ? '#e8edf5' : '#1a2535', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bestPlayer.player_name}</div>
                )}
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {shortName(bestPlayer.team_id === match.home_team_id ? home?.name||'' : away?.name||'')}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span className="num" style={{ fontSize: 40, color: '#f5c200', display: 'block', lineHeight: 1 }}>{bestPlayer.total}</span>
                <span style={{ fontSize: 9, color: 'rgba(245,194,0,0.6)', letterSpacing: '0.1em', display: 'block', marginTop: 2 }}>PINS</span>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming: countdown + H2H */}
        {!hasLineup && isUpcoming && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)', borderBottom: `1px solid ${border}` }}>
                <span className="section-label" style={{ color: C.muted }}>{msLeft === 0 ? 'Matchen börjar snart' : 'Matchen börjar om'}</span>
              </div>
              <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                {msLeft !== null && msLeft > 0 ? (
                  cdDays! > 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 20, alignItems: 'flex-end' }}>
                      {[{ val: String(cdDays), label: 'DAGAR' }, { val: String(cdHours).padStart(2,'0'), label: 'TIMMAR' }].map(({ val, label }) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                          <span className="num" style={{ fontSize: 52, color: label === 'DAGAR' ? C.accent : (isDark ? '#e8edf5' : '#111'), display: 'block', lineHeight: 1 }}>{val}</span>
                          <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.1em', marginTop: 6 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, alignItems: 'flex-end' }}>
                      {[{ val: String(cdHours).padStart(2,'0'), label: 'TIM', i: 0 }, { val: String(cdMinutes).padStart(2,'0'), label: 'MIN', i: 1 }, { val: String(cdSeconds).padStart(2,'0'), label: 'SEK', i: 2 }].map(({ val, label, i }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                          {i > 0 && <span className="num" style={{ fontSize: 40, color: C.muted, lineHeight: 1, marginBottom: 18, opacity: 0.3 }}>:</span>}
                          <div style={{ textAlign: 'center' }}>
                            <span className="num" style={{ fontSize: 52, color: i === 1 ? C.accent : (isDark ? '#e8edf5' : '#111'), display: 'block', lineHeight: 1 }}>{val}</span>
                            <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.1em', marginTop: 6 }}>{label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.muted }}>Lineup visas när matchen börjar</div>
                )}
              </div>
            </div>

            {h2h.length > 0 && (
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '8px 14px', background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)', borderBottom: `1px solid ${border}` }}>
                  <span className="section-label" style={{ color: C.muted }}>Tidigare möten</span>
                </div>
                {h2h.map((hm, i) => {
                  const hmHScore = hm.home_score ?? 0, hmAScore = hm.away_score ?? 0
                  const hmHWin = hmHScore > hmAScore, hmAWin = hmAScore > hmHScore
                  const hmDate = hm.date ? new Date(hm.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
                  return (
                    <Link key={hm.id} href={`/matches/${hm.id}`} style={{ display: 'block', textDecoration: 'none', padding: '10px 14px', borderBottom: i < h2h.length - 1 ? `1px solid ${divider}` : 'none' }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 5 }}>{hmDate}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: hmHWin ? 600 : 400, color: hmHWin ? (isDark ? '#e8edf5' : '#111') : C.muted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(hm.home?.name||'')}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                          <span className="num" style={{ fontSize: 16, color: hmHWin ? C.accent : C.muted }}>{hmHScore}</span>
                          <span style={{ fontSize: 10, color: C.muted }}>–</span>
                          <span className="num" style={{ fontSize: 16, color: hmAWin ? C.accent : C.muted }}>{hmAScore}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: hmAWin ? 600 : 400, color: hmAWin ? (isDark ? '#e8edf5' : '#111') : C.muted, flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(hm.away?.name||'')}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {!hasLineup && !isUpcoming && !isLive && hasScore && (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: C.muted }}>Detaljerade spelresultat ej registrerade</div>
          </div>
        )}

        {match.stream_url && !isLive && (
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${border}` }}>
            <span style={{ fontSize: 12, color: C.muted }}>Scoring från matchen</span>
            <a href={match.stream_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.accent, fontWeight: 700, textDecoration: 'none' }}>Öppna scoring ↗</a>
          </div>
        )}

      </div>
    </main>
  )
}
