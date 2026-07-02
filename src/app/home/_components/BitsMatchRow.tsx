'use client'

import Link from 'next/link'
import { shortDiv, divColor, dateLabel } from '@/app/home/helpers'
import { COLOR, MOTION, SPACE, TYPE } from '@/lib/brand'
import { divisionTier } from '@/lib/division-standings'
import Reveal from '@/components/Reveal'
import { FeedActions } from '@/components/FeedActions'
import type { BitsMatchFeed } from '@/lib/types'

type Hook = { text: string; accent: boolean }

function matchHook(m: BitsMatchFeed, teamIds: string[]): Hook | null {
  const followsHome = teamIds.includes(String(m.home_bits_team_id))
  const followsAway = teamIds.includes(String(m.away_bits_team_id))

  if (followsHome || followsAway) {
    if (!m.is_finished) return { text: 'Kommande match', accent: true }
    const myScore  = followsHome ? (m.home_result ?? 0) : (m.away_result ?? 0)
    const oppScore = followsHome ? (m.away_result ?? 0) : (m.home_result ?? 0)
    if (myScore > oppScore) return { text: 'Ditt lag vann',        accent: true  }
    if (myScore < oppScore) return { text: 'Ditt lag förlorade',   accent: false }
    return                         { text: 'Oavgjort',             accent: false }
  }

  const tier = divisionTier(m.division_name ?? '')
  if (tier === 'Elitserien' || tier === 'Allsvenskan') {
    return { text: tier, accent: false }
  }

  return null
}

function shortName(name: string) {
  return name.length > 22 ? name.slice(0, 21) + '…' : name
}

// Matches the hairline-row pattern FeedCard/PlayerResultCard/BitsScoreCard
// all use — no filled card, no border-radius. LiveCard keeps its own boxed
// treatment (it's a hero, not a list row); this is the list-row sibling.
export default function BitsMatchRow({ m, index = 0, teamIds = [] }: { m: BitsMatchFeed; index?: number; teamIds?: string[] }) {
  const div     = m.division_name ?? ''
  const homeWon = m.home_result != null && m.away_result != null && m.home_result > m.away_result
  const awayWon = m.home_result != null && m.away_result != null && m.away_result > m.home_result
  const accent  = divColor(div)
  const hook    = matchHook(m, teamIds)

  return (
    <Reveal direction="up" distance={12} delay={Math.min(index, 8) * 0.04}>
      <div>
        <Link href={`/matcher/${m.bits_match_id}`} style={{ display: 'block', textDecoration: 'none' }}>
          <div
            style={{ padding: `${SPACE[4]}px ${SPACE[4]}px`, transition: `opacity ${MOTION.fast}s ease` }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            {/* Top row: division dot + name + date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], marginBottom: SPACE[3] }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0 }} />
              <span style={{ fontSize: TYPE.label, fontWeight: 700, color: accent, flexShrink: 0 }}>
                {shortDiv(div)}
              </span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: TYPE.micro, color: COLOR.ink3 }}>{dateLabel(m.match_date)}</span>
            </div>

            {/* Centre: home — result — away */}
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                <span style={{
                  fontSize: 15, fontWeight: homeWon ? 700 : 500,
                  color: homeWon ? COLOR.ink : COLOR.ink3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                }}>
                  {shortName(m.home_team_name)}
                </span>
              </div>

              <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 76 }}>
                {m.is_finished && m.home_result != null && m.away_result != null ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, color: homeWon ? COLOR.green : COLOR.ink2 }}>{m.home_result}</span>
                    <span style={{ fontSize: 14, color: COLOR.ink4 }}>–</span>
                    <span style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, color: awayWon ? COLOR.green : COLOR.ink2 }}>{m.away_result}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 300, color: COLOR.ink4, letterSpacing: 3 }}>vs</span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  fontSize: 15, fontWeight: awayWon ? 700 : 500,
                  color: awayWon ? COLOR.ink : COLOR.ink3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                }}>
                  {shortName(m.away_team_name)}
                </span>
              </div>
            </div>

            {/* Upcoming: venue strip */}
            {!m.is_finished && (m.hall_name || m.hall_city) && (
              <div style={{
                marginTop: SPACE[3], paddingTop: SPACE[2], borderTop: `1px solid ${COLOR.hairline}`,
                fontSize: TYPE.micro, color: COLOR.ink4, textAlign: 'center',
              }}>
                {[m.hall_name, m.hall_city].filter(Boolean).join(' · ')}
              </div>
            )}

            {/* Hook line — one contextual signal */}
            {hook && (
              <div style={{
                marginTop: SPACE[3], paddingTop: SPACE[2],
                borderTop: `1px solid ${COLOR.hairline}`,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                color: hook.accent ? COLOR.gold : COLOR.ink4,
              }}>
                {hook.text}
              </div>
            )}
          </div>
        </Link>
        <FeedActions
          saveKey={`match_${m.bits_match_id}`}
          shareTitle={`${m.home_team_name} – ${m.away_team_name}`}
          shareUrl={`/matcher/${m.bits_match_id}`}
        />
        <div style={{ borderBottom: `1px solid ${COLOR.hairline}` }} />
      </div>
    </Reveal>
  )
}
