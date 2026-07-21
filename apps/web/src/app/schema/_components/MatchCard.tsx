'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { COLOR, FONT } from '@/lib/brand'
import { divisionColor, divisionShort } from '@/lib/divisions'
import { shortName } from '@/lib/utils'
import { useColors } from '@/components/ThemeProvider'
import type { Match } from './types'

export function MatchCard({ m }: { m: Match }) {
  const { isDark } = useColors()
  const d      = new Date(m.matchDate)
  const dc     = divisionColor(m.divisionName ?? '', isDark ? 'dark' : 'light')
  const isLive = false // live status isn't modeled in bits_matches yet — see SCHEMA_REVIEW.md
  const isDone = m.isFinished
  const hw     = (m.homeScore ?? 0) > (m.awayScore ?? 0)
  const aw     = (m.awayScore ?? 0) > (m.homeScore ?? 0)
  const timeStr = d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

  return (
    <Link href={`/matcher/${m.bitsMatchId}`} style={{ textDecoration: 'none', display: 'block', margin: '0 16px 8px' }}>
      <div style={{
        background: isDark ? COLOR.surface : '#ffffff',
        borderRadius: 18,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Card body */}
        <div style={{ padding: '14px 16px' }}>
          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: dc,
              padding: '3px 8px', borderRadius: 999, background: 'rgba(244,245,247,0.06)',
              flexShrink: 0,
            }}>
              {divisionShort(m.divisionName ?? '')}
            </span>
            {m.roundId != null && (
              <span style={{ fontSize: 11, color: COLOR.ink4 }}>Omg {m.roundId}</span>
            )}
            {isLive && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                <motion.span
                  animate={{ opacity: [1, 0.15, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ width: 5, height: 5, borderRadius: '50%', background: COLOR.red, display: 'block', flexShrink: 0 }}
                />
                <span style={{ fontSize: 11, fontWeight: 800, color: COLOR.red, letterSpacing: 0.6 }}>LIVE</span>
              </div>
            )}
          </div>

          {/* Teams + score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Home */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                fontSize: 15,
                fontWeight: isDone ? (hw ? 700 : 400) : 600,
                color: isDone ? (hw ? COLOR.ink : COLOR.ink3) : COLOR.ink,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, display: 'block',
              }}>
                {shortName(m.homeTeamName)}
              </span>
            </div>

            {/* Score / time */}
            <div style={{ flexShrink: 0, textAlign: 'center' as const, minWidth: 56 }}>
              {isDone ? (
                <span style={{
                  fontFamily: FONT.display,
                  fontSize: 24, fontWeight: 900, letterSpacing: -1,
                  fontVariantNumeric: 'tabular-nums' as const,
                  display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4,
                }}>
                  <span style={{ color: isLive ? COLOR.gold : hw ? COLOR.green : COLOR.ink }}>{m.homeScore}</span>
                  <span style={{ fontSize: 16, color: COLOR.ink4 }}>–</span>
                  <span style={{ color: isLive ? COLOR.gold : aw ? COLOR.green : COLOR.ink }}>{m.awayScore}</span>
                </span>
              ) : (
                <span style={{
                  fontFamily: FONT.display,
                  fontSize: 22, fontWeight: 900,
                  fontVariantNumeric: 'tabular-nums' as const,
                  color: COLOR.gold,
                }}>
                  {timeStr}
                </span>
              )}
            </div>

            {/* Away */}
            <div style={{ flex: 1, minWidth: 0, textAlign: 'right' as const }}>
              <span style={{
                fontSize: 15,
                fontWeight: isDone ? (aw ? 700 : 400) : 600,
                color: isDone ? (aw ? COLOR.ink : COLOR.ink3) : COLOR.ink,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, display: 'block',
              }}>
                {shortName(m.awayTeamName)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
