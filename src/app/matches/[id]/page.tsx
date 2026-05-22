'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import { dark, light } from '@/lib/colors'
import { Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import LiveLaneViewer from '@/components/LiveLaneViewer'
import { shortName } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }
type Lineup = { id: string; team_id: string; player_name: string; bord: number; position: number }
type Result = { id: string; team_id: string; bord: number; position: number; games: number[] }

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const
const SERIE_TABS = ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Totalt']

function divisionColor(d: string | null) {
  if (!d) return '#6b7a99'
  if (d.includes('SM') || d.includes('slutspel')) return '#f5c200'
  if (d.includes('Damer')) return '#d94a90'
  if (d.includes('Elitserien')) return '#4a90d9'
  if (d.includes('Allsvenskan')) return '#5ba85a'
  return '#8a7a5a'
}

// Score chip — teal glow for 250+, green for 200+, normal otherwise
function ScoreChip({ score, C }: { score: number; C: any }) {
  if (!score) return (
    <span style={{ fontSize: 20, color: C.textMuted, opacity: 0.3, fontWeight: 400, lineHeight: 1 }}>—</span>
  )
  const isElite = score >= 250
  const isGood  = score >= 200
  return (
    <span style={{
      fontSize: isElite ? 28 : isGood ? 25 : 21,
      fontWeight: isElite ? 900 : isGood ? 700 : 500,
      lineHeight: 1,
      color: isElite ? '#ffffff' : isGood ? '#4caf7d' : C.text,
      textShadow: isElite
        ? '0 0 10px rgba(0,240,255,0.3), 0 0 24px rgba(0,240,255,0.15)'
        : 'none',
    }}>
      {score}
    </span>
  )
}

export default function MatchPage({ params }: Props) {
  const { theme } = useTheme()
  const C      = theme === 'dark' ? dark : light
  const isDark = theme === 'dark'

  const [id, setId]           = useState<string | null>(null)
  const [match, setMatch]     = useState<any>(null)
  const [lineup, setLineup]   = useState<Lineup[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSerie, setActiveSerie] = useState(0)

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    const loadAll = async () => {
      const [{ data: m }, { data: lu }, { data: rs }] = await Promise.all([
        supabase.from('matches').select('*, home:teams!home_team_id(id,name,club), away:teams!away_team_id(id,name,club)').eq('id', id).single(),
        supabase.from('match_lineups').select('*').eq('match_id', id).order('bord').order('position'),
        supabase.from('match_results').select('*').eq('match_id', id),
      ])
      setMatch(m)
      setLineup((lu || []) as Lineup[])
      setResults((rs || []) as Result[])
      setLoading(false)
    }
    loadAll()
    const channel = supabase
      .channel('match-' + id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_results',  filter: 'match_id=eq.' + id }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_lineups',  filter: 'match_id=eq.' + id }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches',        filter: 'id=eq.' + id },       () => loadAll())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  if (loading) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ color: C.textMuted }}>Laddar...</div>
    </main>
  )
  if (!match) return (
    <main style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ color: C.textMuted }}>Match hittades inte</div>
    </main>
  )

  const home       = match.home
  const away       = match.away
  const homeTotal  = match.home_score
  const awayTotal  = match.away_score
  const homeWin    = (homeTotal ?? 0) > (awayTotal ?? 0)
  const awayWin    = (awayTotal ?? 0) > (homeTotal ?? 0)
  const hasScore   = homeTotal !== null && awayTotal !== null
  const isLive     = match.status === 'live'
  const isUpcoming = match.status === 'upcoming'
  const hasLineup  = lineup.length > 0
  const hasStream  = !!match.stream_url?.length
  const divColor   = divisionColor(match.division)

  const getResult = (teamId: string, bord: number, pos: number) =>
    results.find(r => r.team_id === teamId && r.bord === bord && r.position === pos)

  const getScore = (teamId: string, bord: number, pos: number): number => {
    const games = getResult(teamId, bord, pos)?.games || []
    return activeSerie === 4
      ? games.reduce((a, b) => a + b, 0)
      : games[activeSerie] || 0
  }

  const seriesTotal = (teamId: string, gi: number) =>
    results.filter(r => r.team_id === teamId).reduce((s, r) => s + ((r.games || [])[gi] || 0), 0)

  const grandTotal = (teamId: string) =>
    [0, 1, 2, 3].reduce((s, gi) => s + seriesTotal(teamId, gi), 0)

  const hGrand = grandTotal(match.home_team_id)
  const aGrand = grandTotal(match.away_team_id)

  const allPlayers = lineup.map(p => {
    const total = (getResult(p.team_id, p.bord, p.position)?.games || []).reduce((a, b) => a + b, 0)
    return { ...p, total }
  })
  const bestPlayer = allPlayers.length > 0
    ? allPlayers.reduce((best, p) => p.total > best.total ? p : best)
    : null

  const dateStr = match.date ? new Date(match.date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }) : ''
  const timeStr = match.date ? new Date(match.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : ''

  // Per-serie totals for the mini strip
  const serieSummary = [0, 1, 2, 3].map(gi => ({
    gi, h: seriesTotal(match.home_team_id, gi), a: seriesTotal(match.away_team_id, gi),
  })).filter(s => s.h > 0 || s.a > 0)

  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
  const cardBg = isDark ? 'rgba(255,255,255,0.035)' : '#ffffff'
  const cardHeaderBg = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)'
  const dividerColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 80 }}>

        {/* ── Division + status ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: divColor, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: divColor }}>{match.division || 'Match'}</span>
          {match.round && <span style={{ fontSize: 11, color: C.textMuted }}>· Omgång {match.round}</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {isLive && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, color: '#e05555' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e05555', display: 'inline-block' }} />
                LIVE
              </span>
            )}
            {isUpcoming  && <span style={{ fontSize: 10, fontWeight: 700, color: C.accent }}>KOMMANDE</span>}
            {!isLive && !isUpcoming && <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted }}>AVSLUTAD</span>}
          </div>
        </div>

        {/* ── Score hero ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, padding: '24px 16px 20px', borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}>
          <a href={'/teams/' + home?.id} style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: hasScore ? (homeWin ? C.text : C.textMuted) : C.text, lineHeight: 1.2, textAlign: 'right' }}>
              {shortName(home?.name || '')}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, textAlign: 'right', marginTop: 3 }}>Hemmalag</div>
          </a>

          <div style={{ textAlign: 'center', minWidth: 90 }}>
            {hasScore ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: homeWin ? C.accent : C.textMuted, lineHeight: 1 }}>{homeTotal}</span>
                  <span style={{ fontSize: 16, color: C.textMuted, fontWeight: 300 }}>–</span>
                  <span style={{ fontSize: 40, fontWeight: 900, color: awayWin ? C.accent : C.textMuted, lineHeight: 1 }}>{awayTotal}</span>
                </div>
                <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1.5, marginTop: 4 }}>MATCHPOÄNG</div>
                {hGrand > 0 && (
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
                    {hGrand.toLocaleString('sv')} – {aGrand.toLocaleString('sv')} <span style={{ fontSize: 10 }}>pins</span>
                  </div>
                )}
              </>
            ) : (
              <span style={{ fontSize: 18, color: C.textMuted, fontWeight: 300 }}>vs</span>
            )}
          </div>

          <a href={'/teams/' + away?.id} style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: hasScore ? (awayWin ? C.text : C.textMuted) : C.text, lineHeight: 1.2 }}>
              {shortName(away?.name || '')}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>Bortalag</div>
          </a>
        </div>

        {/* ── Date / venue / oil ── */}
        {(dateStr || match.venue || match.oil_profile) && (
          <div style={{ display: 'flex', gap: 12, padding: '10px 16px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
            {dateStr && <span style={{ fontSize: 11, color: C.textMuted }}>{dateStr}{timeStr ? ' · ' + timeStr : ''}</span>}
            {match.venue && <span style={{ fontSize: 11, color: C.textMuted }}>· {match.venue}</span>}
            {match.oil_profile && <span style={{ fontSize: 11, color: C.textMuted }}>· Olja: {match.oil_profile}</span>}
          </div>
        )}

        {/* ── Live stream ── */}
        {hasStream && isLive && (
          <div style={{ borderBottom: '1px solid #e05555' }}>
            {match.stream_url.includes('scoring.se') ? (
              <LiveLaneViewer streamUrl={match.stream_url} matchName={shortName(home?.name || '') + ' vs ' + shortName(away?.name || '')} />
            ) : (
              <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: C.textMuted }}>Live scoring</span>
                <a href={match.stream_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.accent, fontWeight: 700, textDecoration: 'none' }}>Öppna ↗</a>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════ */}
        {/*  Scorecard section                        */}
        {/* ══════════════════════════════════════════ */}
        {hasLineup && (
          <>
            {/* ── Sticky serie sub-nav with liquid capsule ── */}
            <div style={{
              position: 'sticky', top: 56, zIndex: 30,
              background: C.bg,
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', padding: '6px 10px', gap: 2 } as React.CSSProperties}>
                {SERIE_TABS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSerie(i)}
                    style={{
                      position: 'relative',
                      flexShrink: 0,
                      padding: '7px 13px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      color: activeSerie === i ? '#f5c200' : C.textMuted,
                      WebkitTapHighlightColor: 'transparent',
                    } as React.CSSProperties}
                  >
                    {activeSerie === i && (
                      <motion.div
                        layoutId="serie-tab-capsule"
                        transition={SPRING}
                        style={{
                          position: 'absolute', inset: '3px 0', borderRadius: 10,
                          background: isDark ? 'rgba(245,194,0,0.1)' : 'rgba(245,194,0,0.08)',
                          border: '1px solid rgba(245,194,0,0.22)',
                        }}
                      />
                    )}
                    <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Serie totals strip ── */}
            {serieSummary.length > 0 && (
              <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
                {serieSummary.map(({ gi, h, a }) => {
                  const hW = h > a, aW = a > h
                  const isTab = gi === activeSerie
                  return (
                    <button key={gi} onClick={() => setActiveSerie(gi)}
                      style={{ flex: 1, padding: '10px 4px 8px', border: 'none', background: isTab ? (isDark ? 'rgba(245,194,0,0.06)' : 'rgba(245,194,0,0.04)') : 'transparent', cursor: 'pointer', borderBottom: isTab ? `2px solid #f5c200` : '2px solid transparent', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
                      <div style={{ fontSize: 8, fontWeight: 800, color: isTab ? C.accent : C.textMuted, letterSpacing: 1, marginBottom: 4 }}>S{gi + 1}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: hW ? C.accent : C.text, lineHeight: 1 }}>{h}</div>
                      <div style={{ fontSize: 9, color: C.textMuted, margin: '2px 0' }}>–</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: aW ? C.accent : C.text, lineHeight: 1 }}>{a}</div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* ── Team column headers ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', padding: '10px 12px 4px' }}>
              <div style={{ textAlign: 'right', paddingRight: 14 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: C.textMuted, letterSpacing: 1 }}>
                  {shortName(home?.name || '').toUpperCase()}
                </span>
              </div>
              <div />
              <div style={{ paddingLeft: 14 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: C.textMuted, letterSpacing: 1 }}>
                  {shortName(away?.name || '').toUpperCase()}
                </span>
              </div>
            </div>

            {/* ── Banpar cards ── */}
            <div style={{ padding: '4px 12px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3, 4].map(bord => {
                const homeP = [1, 2].map(pos => ({
                  player: lineup.find(l => l.team_id === match.home_team_id && l.bord === bord && l.position === pos),
                  score: getScore(match.home_team_id, bord, pos),
                }))
                const awayP = [1, 2].map(pos => ({
                  player: lineup.find(l => l.team_id === match.away_team_id && l.bord === bord && l.position === pos),
                  score: getScore(match.away_team_id, bord, pos),
                }))

                const hasAny = homeP.some(p => p.player) || awayP.some(p => p.player)
                if (!hasAny) return null

                const homeSubtotal = homeP.reduce((s, p) => s + p.score, 0)
                const awaySubtotal = awayP.reduce((s, p) => s + p.score, 0)
                const homeWinsHere = homeSubtotal > 0 && homeSubtotal > awaySubtotal
                const awayWinsHere = awaySubtotal > 0 && awaySubtotal > homeSubtotal

                return (
                  <div key={bord} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 18, overflow: 'hidden' }}>

                    {/* Card header */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '9px 14px',
                      background: cardHeaderBg,
                      borderBottom: `1px solid ${border}`,
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>BANPAR {bord}</span>
                      {homeSubtotal > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: homeWinsHere ? C.accent : C.text }}>{homeSubtotal}</span>
                          <span style={{ fontSize: 10, color: C.textMuted }}>–</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: awayWinsHere ? C.accent : C.text }}>{awaySubtotal}</span>
                        </div>
                      )}
                    </div>

                    {/* Two matchup rows (pos 1 & 2) */}
                    {[0, 1].map(posIdx => {
                      const hp = homeP[posIdx]
                      const ap = awayP[posIdx]
                      const hWins = hp.score > 0 && ap.score > 0 && hp.score > ap.score
                      const aWins = ap.score > 0 && hp.score > 0 && ap.score > hp.score

                      return (
                        <div key={posIdx} style={{
                          display: 'grid', gridTemplateColumns: '1fr 1px 1fr',
                          borderBottom: posIdx === 0 ? `0.5px solid ${dividerColor}` : 'none',
                        }}>
                          {/* Home player */}
                          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <span style={{
                              fontSize: 11, fontWeight: hWins ? 700 : 500,
                              color: hWins ? C.text : C.textMuted,
                              textAlign: 'right', overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
                            }}>
                              {hp.player?.player_name || '—'}
                            </span>
                            <ScoreChip score={hp.score} C={C} />
                          </div>

                          {/* Center divider */}
                          <div style={{ background: dividerColor }} />

                          {/* Away player */}
                          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                            <span style={{
                              fontSize: 11, fontWeight: aWins ? 700 : 500,
                              color: aWins ? C.text : C.textMuted,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
                            }}>
                              {ap.player?.player_name || '—'}
                            </span>
                            <ScoreChip score={ap.score} C={C} />
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

        {/* ── Best player ── */}
        {bestPlayer && bestPlayer.total > 0 && (
          <div style={{ borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 5px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: divColor }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>BÄSTA SPELARE</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
              <Trophy size={16} color={C.accent} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{bestPlayer.player_name}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                  {shortName(bestPlayer.team_id === match.home_team_id ? home?.name || '' : away?.name || '')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.accent, lineHeight: 1 }}>{bestPlayer.total}</div>
                <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1 }}>PINS</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Empty states ── */}
        {!hasLineup && isUpcoming && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>Kommande match</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Lineup och live scoring visas när matchen börjar</div>
          </div>
        )}
        {!hasLineup && !isUpcoming && !isLive && hasScore && (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: C.textMuted }}>Detaljerade spelresultat ej registrerade</div>
          </div>
        )}

        {/* ── Completed stream link ── */}
        {hasStream && !isLive && (
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>Scoring från matchen</span>
            <a href={match.stream_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.accent, fontWeight: 700, textDecoration: 'none' }}>Öppna scoring ↗</a>
          </div>
        )}

      </div>
    </main>
  )
}
