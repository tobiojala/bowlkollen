'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { COLOR, FONT, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { divisionTier, TIER_COLOR, type TeamStanding, type MatchRow } from '@/lib/division-standings'

type Props = {
  divisionId:   number
  divisionName: string
  seasonYear:   number
  matches:      MatchRow[]
  standings:    TeamStanding[]
}

type Tab = 'standings' | 'matches'

function dateStr(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

function resultColor(home: number | null, away: number | null, isHome: boolean) {
  if (home == null || away == null) return COLOR.ink3
  const won   = isHome ? home > away : away > home
  const drawn = home === away
  if (drawn) return COLOR.ink3
  return won ? COLOR.green : COLOR.red
}

const STAGGER: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } }
const ITEM: Variants    = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.18 } } }

export function DivisionClient({ divisionName, seasonYear, matches, standings }: Props) {
  const [tab, setTab] = useState<Tab>('standings')

  const tier      = divisionTier(divisionName)
  const tierColor = TIER_COLOR[tier] ?? COLOR.gold

  const finishedMatches = matches.filter(m => m.is_finished)
  const upcomingMatches = matches.filter(m => !m.is_finished).reverse()

  const tabStyle = (t: Tab): React.CSSProperties => ({
    flex: 1, background: 'transparent', border: 'none', cursor: 'pointer',
    padding: `${SPACE[3]}px 0`,
    fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.06em',
    fontFamily: FONT.body,
    color: tab === t ? tierColor : COLOR.ink4,
    borderBottom: `2px solid ${tab === t ? tierColor : 'transparent'}`,
    transition: 'color 0.15s, border-color 0.15s',
    WebkitTapHighlightColor: 'transparent',
  })

  const thStyle: React.CSSProperties = {
    fontSize: TYPE.micro, fontWeight: 800, letterSpacing: '0.08em',
    fontFamily: FONT.body,
    color: COLOR.ink3, padding: `${SPACE[2]}px ${SPACE[2]}px`,
    textAlign: 'right', whiteSpace: 'nowrap',
  }
  const tdNum: React.CSSProperties = {
    fontSize: TYPE.caption, fontWeight: 700,
    fontFamily: FONT.display, fontVariantNumeric: 'tabular-nums',
    textAlign: 'right', padding: `${SPACE[3]}px ${SPACE[2]}px`,
    color: COLOR.ink3,
  }

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: FONT.body }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: `${SPACE[6]}px 0 80px` }}>

        {/* Back + header */}
        <div style={{ padding: `0 ${SPACE[4]}px`, marginBottom: SPACE[6] }}>
          <Link href="/divisioner" style={{ fontSize: TYPE.caption, color: COLOR.ink3, textDecoration: 'none' }}>
            ← Alla divisioner
          </Link>
          <div style={{ marginTop: SPACE[3] }}>
            <span style={{
              fontSize: TYPE.micro, fontWeight: 800, letterSpacing: '0.08em',
              color: tierColor, background: `${tierColor}18`, border: `1px solid ${tierColor}44`,
              borderRadius: RADIUS.sm, padding: '3px 8px',
            }}>
              {tier.toUpperCase()}
            </span>
          </div>
          {/* Division name — body font, not display font */}
          <h1 style={{
            fontFamily: FONT.body, fontSize: 24, fontWeight: 900,
            letterSpacing: '-0.02em', color: COLOR.ink,
            margin: `${SPACE[2]}px 0 0`,
          }}>
            {divisionName}
          </h1>
          <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginTop: SPACE[1] }}>
            Säsong {seasonYear} · {finishedMatches.length} spelade · {upcomingMatches.length} kommande
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${COLOR.hairline}`,
          marginBottom: SPACE[6],
          padding: `0 ${SPACE[4]}px`,
        }}>
          <button style={tabStyle('standings')} onClick={() => setTab('standings')}>TABELL</button>
          <button style={tabStyle('matches')}   onClick={() => setTab('matches')}>MATCHER</button>
        </div>

        {/* ── Standings ── */}
        {tab === 'standings' && (
          <div style={{ padding: `0 ${SPACE[4]}px` }}>
            {standings.length === 0 ? (
              <div style={{ textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.body, padding: `${SPACE[8]}px 0` }}>
                Inga avslutade matcher ännu
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, textAlign: 'left', paddingLeft: 0 }}>#</th>
                      <th style={{ ...thStyle, textAlign: 'left', paddingRight: SPACE[4] }}>LAG</th>
                      <th style={thStyle}>M</th>
                      <th style={thStyle}>V</th>
                      <th style={thStyle}>O</th>
                      <th style={thStyle}>F</th>
                      <th style={thStyle}>BP</th>
                      <th style={{ ...thStyle, color: tierColor }}>P</th>
                    </tr>
                  </thead>
                  <motion.tbody
                    variants={STAGGER}
                    initial="hidden"
                    animate="show"
                  >
                    {standings.map((s, i) => (
                      <motion.tr
                        key={s.teamId}
                        variants={ITEM}
                        style={{ borderTop: `1px solid ${COLOR.hairline}` }}
                      >
                        <td style={{ ...tdNum, color: COLOR.ink4, textAlign: 'left', paddingLeft: 0, width: 20 }}>
                          {i + 1}
                        </td>
                        <td style={{
                          padding: `${SPACE[3]}px ${SPACE[4]}px ${SPACE[3]}px 0`,
                          fontSize: TYPE.caption, fontWeight: 700, color: COLOR.ink,
                          fontFamily: FONT.body,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          maxWidth: 160,
                        }}>
                          {s.teamName}
                        </td>
                        <td style={tdNum}>{s.played}</td>
                        <td style={{ ...tdNum, color: s.won > 0 ? COLOR.green : COLOR.ink3 }}>{s.won}</td>
                        <td style={tdNum}>{s.drawn}</td>
                        <td style={{ ...tdNum, color: s.lost > 0 ? COLOR.red : COLOR.ink3 }}>{s.lost}</td>
                        <td style={{ ...tdNum, color: COLOR.ink3 }}>{s.boardWins}–{s.boardLosses}</td>
                        <td style={{ ...tdNum, fontSize: 14, fontWeight: 900, color: tierColor }}>{s.points}</td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Matches ── */}
        {tab === 'matches' && (
          <div>
            {upcomingMatches.length > 0 && (
              <>
                <div style={{
                  fontSize: TYPE.micro, fontWeight: 800, letterSpacing: '0.08em',
                  color: COLOR.ink3, padding: `0 ${SPACE[4]}px`,
                  marginBottom: SPACE[3],
                }}>
                  KOMMANDE
                </div>
                <motion.div variants={STAGGER} initial="hidden" animate="show">
                  {upcomingMatches.map(m => (
                    <motion.div
                      key={m.bits_match_id}
                      variants={ITEM}
                      style={{
                        display: 'flex', alignItems: 'center',
                        padding: `${SPACE[4]}px ${SPACE[4]}px`,
                        borderBottom: `1px solid ${COLOR.hairline}`,
                      }}
                    >
                      <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, width: 54, flexShrink: 0 }}>
                        {dateStr(m.match_date)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: TYPE.caption, fontWeight: 600, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.home_team_name}
                        </div>
                        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                          {m.away_team_name}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </>
            )}

            {finishedMatches.length > 0 && (
              <>
                <div style={{
                  fontSize: TYPE.micro, fontWeight: 800, letterSpacing: '0.08em',
                  color: COLOR.ink3,
                  padding: `${SPACE[6]}px ${SPACE[4]}px ${SPACE[3]}px`,
                  marginTop: upcomingMatches.length > 0 ? SPACE[4] : 0,
                }}>
                  SPELADE
                </div>
                <motion.div variants={STAGGER} initial="hidden" animate="show">
                  {[...finishedMatches].reverse().map(m => {
                    const homeWon = m.home_result != null && m.home_result > (m.away_result ?? 0)
                    const awayWon = m.away_result != null && m.away_result > (m.home_result ?? 0)
                    return (
                      <motion.div
                        key={m.bits_match_id}
                        variants={ITEM}
                        style={{
                          display: 'flex', alignItems: 'center',
                          padding: `${SPACE[4]}px ${SPACE[4]}px`,
                          borderBottom: `1px solid ${COLOR.hairline}`,
                        }}
                      >
                        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, width: 54, flexShrink: 0 }}>
                          {dateStr(m.match_date)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: TYPE.caption,
                            fontWeight: homeWon ? 700 : 500,
                            color: resultColor(m.home_result, m.away_result, true),
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {m.home_team_name}
                          </div>
                          <div style={{
                            fontSize: TYPE.caption,
                            fontWeight: awayWon ? 700 : 500,
                            color: resultColor(m.home_result, m.away_result, false),
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            marginTop: 2,
                          }}>
                            {m.away_team_name}
                          </div>
                        </div>
                        {m.home_result != null && m.away_result != null && (
                          <div style={{
                            fontSize: TYPE.body,
                            fontFamily: FONT.display, fontWeight: 900,
                            fontVariantNumeric: 'tabular-nums',
                            color: COLOR.ink, flexShrink: 0, marginLeft: SPACE[3],
                          }}>
                            {m.home_result}–{m.away_result}
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </motion.div>
              </>
            )}

            {matches.length === 0 && (
              <div style={{ textAlign: 'center', color: COLOR.ink3, fontSize: TYPE.body, padding: `${SPACE[8]}px 0` }}>
                Inga matcher synkade ännu
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
