'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useColors } from '@/components/ThemeProvider'
import { teamColor, teamInitials, shortName, shortDiv } from '@/lib/utils'
import { divisionColor } from '@/lib/divisions'
import TeamTableWidget from '@/components/TeamTableWidget'
import TopPerformers   from '@/components/TopPerformers'
import type { Match } from '@/lib/types'

type Tab = 'results' | 'upcoming' | 'h2h'

type Props = {
  id: string
  matches: Match[]
}

const SPRING   = { type: 'spring', stiffness: 300, damping: 30 } as const
const PREVIEW  = 5

export default function TeamMatches({ id, matches }: Props) {
  const { C, isDark } = useColors()
  const [tab,         setTab]         = useState<Tab>('results')
  const [expandedOpp, setExpandedOpp] = useState<string | null>(null)
  const [showAll,     setShowAll]     = useState(false)

  const isHome   = (m: Match) => m.home_team_id === id
  const completed = matches.filter(m => m.status === 'completed' && m.home_score !== null)
  const upcoming  = matches.filter(m => m.status === 'upcoming' || m.status === 'live')

  // Build H2H map
  const h2hMap: Record<string, { team: { id: string; name: string }; w: number; d: number; l: number; matches: Match[] }> = {}
  completed.forEach(m => {
    const oppId = isHome(m) ? m.away_team_id! : m.home_team_id!
    const opp   = isHome(m) ? m.away : m.home
    if (!h2hMap[oppId]) h2hMap[oppId] = { team: opp, w: 0, d: 0, l: 0, matches: [] }
    const won  = isHome(m) ? m.home_score! > m.away_score! : m.away_score! > m.home_score!
    const lost = isHome(m) ? m.home_score! < m.away_score! : m.away_score! < m.home_score!
    if (won) h2hMap[oppId].w++; else if (lost) h2hMap[oppId].l++; else h2hMap[oppId].d++
    h2hMap[oppId].matches.push(m)
  })
  const h2hList = Object.values(h2hMap).sort((a, b) => b.matches.length - a.matches.length)

  const displayMatches = tab === 'results' ? completed : upcoming

  const pill = (key: Tab, label: string, count: number) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid ' + (tab === key ? C.accent : C.border), background: tab === key ? C.accent + '18' : 'transparent', color: tab === key ? C.accent : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
    >
      {label} {count > 0 && <span style={{ opacity: 0.65 }}>({count})</span>}
    </button>
  )

  const MatchRow = ({ m }: { m: Match }) => {
    const home       = isHome(m)
    const myScore    = home ? m.home_score : m.away_score
    const oppScore   = home ? m.away_score : m.home_score
    const opp        = home ? m.away : m.home
    const won        = myScore !== null && oppScore !== null && myScore > oppScore
    const lost       = myScore !== null && oppScore !== null && myScore < oppScore
    const drew       = myScore !== null && oppScore !== null && myScore === oppScore
    const label      = won ? 'V' : lost ? 'F' : drew ? 'O' : null
    const labelColor = won ? C.green : lost ? '#e05555' : C.muted
    const isLive     = m.status === 'live'
    const divC       = divisionColor(m.division)
    const tc         = teamColor(opp?.name || '', isDark)

    return (
      <Link
        href={'/matches/' + m.id}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid ' + C.border, textDecoration: 'none' }}
        onMouseEnter={e => (e.currentTarget.style.background = C.card)}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ width: 28, height: 28, borderRadius: 8, background: label ? labelColor + '22' : C.card, border: '1.5px solid ' + (label ? labelColor : C.border), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: label ? labelColor : C.muted, flexShrink: 0 }}>
          {isLive ? '●' : label || '—'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: tc.bg, border: '1.5px solid ' + tc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: tc.text, flexShrink: 0 }}>
            {teamInitials(opp?.name || '')}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(opp?.name || '')}</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 1 }}>
              <span style={{ fontSize: 10, color: C.muted }}>{home ? 'Hemma' : 'Borta'} · {m.date?.slice(0, 10)}</span>
              {m.division && <span style={{ fontSize: 9, fontWeight: 700, color: divC, background: divC + '18', borderRadius: 4, padding: '1px 5px' }}>{shortDiv(m.division)}</span>}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {myScore !== null
            ? <><div style={{ fontSize: 16, fontWeight: 800, color: won ? C.accent : C.text }}>{myScore} – {oppScore}</div><div style={{ fontSize: 9, color: C.muted }}>MP</div></>
            : <div style={{ fontSize: 11, color: isLive ? '#e05555' : C.muted, fontWeight: isLive ? 700 : 400 }}>{isLive ? '● LIVE' : m.date ? new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
          }
        </div>
      </Link>
    )
  }

  const division = completed[0]?.division ?? upcoming[0]?.division ?? null

  return (
    <section id="team-matches" style={{ scrollMarginTop: 60, borderTop: '1px solid ' + C.border }}>
      {/* Deep-stats — league table + top performers */}
      {division && <TeamTableWidget teamId={id} division={division} />}
      <TopPerformers teamId={id} />

      <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid ' + C.border }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 2 }}>MATCHER</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {pill('results',  'Resultat', completed.length)}
          {pill('upcoming', 'Kommande', upcoming.length)}
          {pill('h2h',      'H2H',      h2hList.length)}
        </div>
      </div>

      {/* Results / Upcoming */}
      {tab !== 'h2h' && (
        <div>
          {displayMatches.length === 0
            ? <div style={{ padding: '40px 24px', textAlign: 'center', color: C.muted, fontSize: 13 }}>Inga matcher att visa</div>
            : <>
                {(showAll ? displayMatches : displayMatches.slice(0, PREVIEW)).map(m => <MatchRow key={m.id} m={m} />)}
                {displayMatches.length > PREVIEW && (
                  <button
                    onClick={() => setShowAll(v => !v)}
                    style={{ width: '100%', padding: '13px', background: 'transparent', border: 'none', borderTop: '1px solid ' + C.border, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    {showAll
                      ? <>↑ Visa färre</>
                      : <>{displayMatches.length - PREVIEW} fler matcher ↓</>
                    }
                  </button>
                )}
              </>
          }
        </div>
      )}

      {/* H2H */}
      {tab === 'h2h' && (
        <div>
          {h2hList.length === 0
            ? <div style={{ padding: '40px 24px', textAlign: 'center', color: C.muted, fontSize: 13 }}>Inga matchade möten registrerade</div>
            : h2hList.map(opp => {
                const isExp  = expandedOpp === opp.team.id
                const tc     = teamColor(opp.team.name || '', isDark)
                const total  = opp.matches.length
                const winPct = total > 0 ? Math.round((opp.w / total) * 100) : 0
                return (
                  <div key={opp.team.id} style={{ borderBottom: '1px solid ' + C.border }}>
                    <div onClick={() => setExpandedOpp(isExp ? null : opp.team.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: tc.bg, border: '1.5px solid ' + tc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: tc.text, flexShrink: 0 }}>
                        {teamInitials(opp.team.name || '')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(opp.team.name || '')}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: C.green }}>{opp.w}V</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: C.muted }}>{opp.d}O</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#e05555' }}>{opp.l}F</span>
                          <span style={{ fontSize: 10, color: C.muted }}>· {total} matcher · {winPct}%</span>
                        </div>
                      </div>
                      <Link href={`/compare/teams/${id}/${opp.team.id}`} onClick={e => e.stopPropagation()} style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accent + '18', border: '1px solid ' + C.accent + '44', borderRadius: 8, padding: '5px 10px', textDecoration: 'none', flexShrink: 0 }}>
                        Jämför →
                      </Link>
                      <motion.div animate={{ rotate: isExp ? 90 : 0 }} transition={SPRING} style={{ color: C.muted, fontSize: 18, lineHeight: 1, flexShrink: 0 }}>›</motion.div>
                    </div>
                    <motion.div initial={false} animate={{ height: isExp ? 'auto' : 0, opacity: isExp ? 1 : 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <div style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                        {[...opp.matches].sort((a, b) => b.date.localeCompare(a.date)).map((m, mi) => {
                          const home2    = isHome(m)
                          const myScore  = home2 ? m.home_score : m.away_score
                          const thScore  = home2 ? m.away_score : m.home_score
                          const won2     = myScore !== null && thScore !== null && myScore > thScore
                          const lost2    = myScore !== null && thScore !== null && myScore < thScore
                          const drew2    = myScore !== null && thScore !== null && myScore === thScore
                          const label2   = won2 ? 'V' : lost2 ? 'F' : drew2 ? 'O' : null
                          const lColor   = won2 ? C.green : lost2 ? '#e05555' : C.muted
                          const dateStr  = m.date ? new Date(m.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
                          return (
                            <Link key={m.id} href={'/matches/' + m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px 10px 28px', borderTop: mi === 0 ? '1px solid ' + C.border : '1px solid ' + (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'), textDecoration: 'none' }}>
                              <div style={{ width: 24, height: 24, borderRadius: 6, background: label2 ? lColor + '22' : C.card, border: '1px solid ' + (label2 ? lColor : C.border), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: label2 ? lColor : C.muted, flexShrink: 0 }}>{label2 || '—'}</div>
                              <div style={{ flex: 1, fontSize: 12, color: C.muted }}>{dateStr} · {home2 ? 'Hemma' : 'Borta'}</div>
                              {myScore !== null && <div style={{ fontSize: 13, fontWeight: 800, color: won2 ? C.accent : C.text }}>{myScore} – {thScore}</div>}
                            </Link>
                          )
                        })}
                      </div>
                    </motion.div>
                  </div>
                )
              })
          }
        </div>
      )}
    </section>
  )
}
