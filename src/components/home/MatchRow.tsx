'use client'

import { shortName, shortDiv, countdown, dayDotColor } from '@/lib/utils'

type Match = {
  id: string; date: string; status: string; division: string
  home_score: number | null; away_score: number | null
  home: { id: string; name: string }; away: { id: string; name: string }
}

type Props = { m: Match; C: any; now: number }

export default function MatchRow({ m, C, now }: Props) {
  const dayColor = dayDotColor(m.date.slice(0, 10))
  const hasScore = m.home_score !== null
  const homeWin  = hasScore && m.home_score! > m.away_score!
  const awayWin  = hasScore && m.away_score! > m.home_score!
  return (
    <a href={'/matches/' + m.id}
      style={{ display: 'flex', alignItems: 'stretch', textDecoration: 'none', borderRadius: 0, margin: 0, overflow: 'hidden', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
      onMouseEnter={e => (e.currentTarget.style.background = C.card)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ width: 3, flexShrink: 0, background: dayColor, opacity: 0.7 }} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', padding: '13px 12px', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: homeWin ? 700 : 400, color: hasScore ? (homeWin ? C.text : C.textMuted) : C.text, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {shortName(m.home?.name || '')}
        </div>
        <div style={{ flexShrink: 0, width: 72, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {hasScore ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ fontSize: 17, fontWeight: 900, color: homeWin ? C.accent : C.textMuted }}>{m.home_score}</span>
                <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 300 }}>–</span>
                <span style={{ fontSize: 17, fontWeight: 900, color: awayWin ? C.accent : C.textMuted }}>{m.away_score}</span>
              </div>
              <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 0.3, marginTop: 2 }}>{shortDiv(m.division)}</div>
            </>
          ) : (() => {
            const cd      = countdown(m.date, now)
            const timeStr = new Date(m.date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
            return (
              <>
                {cd
                  ? <div style={{ fontSize: 14, fontWeight: 800, color: C.accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{cd}</div>
                  : <div style={{ fontSize: 12, color: C.textMuted }}>{timeStr || 'vs'}</div>
                }
                <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 0.3, marginTop: 2 }}>{shortDiv(m.division)}</div>
              </>
            )
          })()}
        </div>
        <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: awayWin ? 700 : 400, color: hasScore ? (awayWin ? C.text : C.textMuted) : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {shortName(m.away?.name || '')}
        </div>
      </div>
    </a>
  )
}

import React from 'react'
