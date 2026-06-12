'use client'

import { useRef, useCallback } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { useColors } from '@/components/ThemeProvider'
import type { Match } from '@/lib/types'
import { shortName, shortDiv, countdown, divTierColor, teamColor } from '@/lib/utils'
import { prefetchMatch } from '@/lib/prefetch'

function TeamAvatar({ name, isDark }: { name: string; isDark: boolean }) {
  const { bg, border, text } = teamColor(name, isDark)
  const ini = name.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 9, flexShrink: 0,
      background: bg, border: `1.5px solid ${border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 8, fontWeight: 800, color: text,
      letterSpacing: -0.3, lineHeight: 1,
    }}>
      {ini}
    </div>
  )
}

type Props = { m: Match; now: number }

export default function MatchRow({ m, now }: Props) {
  const { C, isDark } = useColors()
  const qc      = useQueryClient()
  const pending = useRef(false)
  const fire    = useCallback(() => {
    if (pending.current) return
    pending.current = true
    prefetchMatch(qc, m.id).finally(() => { pending.current = false })
  }, [qc, m.id])

  const hasScore   = m.home_score !== null
  const homeWin    = hasScore && m.home_score! > m.away_score!
  const awayWin    = hasScore && m.away_score! > m.home_score!
  const isDraw     = hasScore && m.home_score === m.away_score
  const diff       = hasScore ? Math.abs(m.home_score! - m.away_score!) : 0
  const isDominant = diff >= 4
  const isLive     = m.status === 'live'
  const gold       = '#f5c200'

  // Name colours — winner glows gold on a dominant win, loser fades, draw is neutral muted
  const homeNameColor = hasScore
    ? homeWin
      ? (isDominant ? gold : (isDark ? '#e8edf5' : '#1a2535'))
      : isDraw
        ? C.muted
        : C.muted
    : (isDark ? '#e8edf5' : '#1a2535')
  const awayNameColor = hasScore
    ? awayWin
      ? (isDominant ? gold : (isDark ? '#e8edf5' : '#1a2535'))
      : isDraw
        ? C.muted
        : C.muted
    : (isDark ? '#e8edf5' : '#1a2535')

  // Score number sizing — winner is large+bold, draw is medium, loser is small+dim
  const winStyle  = { fontSize: 25, fontWeight: 700, opacity: 1   } as const
  const drawStyle = { fontSize: 21, fontWeight: 500, opacity: 0.7 } as const
  const dimStyle  = { fontSize: 18, fontWeight: 400, opacity: 0.4 } as const

  const homeStyle = hasScore ? (homeWin ? winStyle : isDraw ? drawStyle : dimStyle) : drawStyle
  const awayStyle = hasScore ? (awayWin ? winStyle : isDraw ? drawStyle : dimStyle) : drawStyle

  const homeScoreColor = homeWin
    ? (isDominant ? gold : (isDark ? '#ffffff' : '#111'))
    : isDraw ? (isDark ? '#c8d0e0' : '#555')
    : (isDark ? '#7a8ba8' : '#999')

  const awayScoreColor = awayWin
    ? (isDominant ? gold : (isDark ? '#ffffff' : '#111'))
    : isDraw ? (isDark ? '#c8d0e0' : '#555')
    : (isDark ? '#7a8ba8' : '#999')

  const divChip = (
    <span style={{
      fontSize: 8, fontWeight: 700, letterSpacing: '0.05em',
      color: divTierColor(m.division),
      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      borderRadius: 4, padding: '1px 5px',
    }}>
      {shortDiv(m.division)}
    </span>
  )

  return (
    <Link
      href={'/matches/' + m.id}
      onMouseEnter={(e) => {
        fire()
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = isDark
          ? '0 6px 20px rgba(0,0,0,0.4)'
          : '0 4px 14px rgba(0,0,0,0.10)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = ''
        el.style.boxShadow = ''
      }}
      onTouchStart={fire}
      style={{
        display: 'flex', alignItems: 'center', textDecoration: 'none',
        padding: '13px 14px', gap: 10,
        borderRadius: 14,
        background: isDark ? 'rgba(24,36,58,0.75)' : 'rgba(255,255,255,0.90)',
        border: `1px solid ${isLive ? 'rgba(245,194,0,0.30)' : C.border}`,
        transition: 'transform 160ms ease-out, box-shadow 160ms ease-out',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      } as React.CSSProperties}
    >
      {/* Home: name + avatar */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <span style={{
          fontSize: 13, fontWeight: hasScore ? (homeWin ? 600 : 400) : 500,
          color: homeNameColor,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right',
        }}>
          {shortName(m.home?.name || '')}
        </span>
        <TeamAvatar name={m.home?.name || ''} isDark={isDark} />
      </div>

      {/* Centre: score / countdown */}
      <div style={{ flexShrink: 0, width: 76, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        {isLive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
            <span className="live-dot" />
            <span style={{ fontSize: 8, fontWeight: 800, color: gold, letterSpacing: '0.14em' }}>LIVE</span>
          </div>
        )}

        {hasScore ? (
          <>
            {/* Score row */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span className="num" style={{ ...homeStyle, color: homeScoreColor }}>
                {m.home_score}
              </span>
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 300 }}>–</span>
              <span className="num" style={{ ...awayStyle, color: awayScoreColor }}>
                {m.away_score}
              </span>
            </div>
            {/* Badges row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {isDominant && !isDraw && (
                <span style={{
                  fontSize: 8, fontWeight: 800, color: gold,
                  background: 'rgba(245,194,0,0.12)',
                  border: '1px solid rgba(245,194,0,0.28)',
                  borderRadius: 4, padding: '1px 4px', letterSpacing: '0.03em',
                }}>
                  +{diff}
                </span>
              )}
              {divChip}
            </div>
          </>
        ) : (() => {
          const cd      = countdown(m.date, now)
          const timeStr = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span suppressHydrationWarning className="num" style={{ fontSize: 17, color: isDark ? '#7ab4e8' : '#5a82b4', fontWeight: 600 }}>
                {cd || timeStr || 'vs'}
              </span>
              {divChip}
            </div>
          )
        })()}
      </div>

      {/* Away: avatar + name */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <TeamAvatar name={m.away?.name || ''} isDark={isDark} />
        <span style={{
          fontSize: 13, fontWeight: hasScore ? (awayWin ? 600 : 400) : 500,
          color: awayNameColor,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {shortName(m.away?.name || '')}
        </span>
      </div>
    </Link>
  )
}
