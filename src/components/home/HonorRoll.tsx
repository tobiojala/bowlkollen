'use client'

type HonorEntry = { playerName: string; score: number; matchId: string; seriesTotal?: number }

type Props = { honor: HonorEntry[]; C: any; isDark: boolean }

export default function HonorRoll({ honor, C, isDark }: Props) {
  if (honor.length === 0) return null
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 10px', borderBottom: '1px solid ' + C.border }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: '#f5c200', flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5 }}>HONOR ROLL</span>
        <span style={{ fontSize: 9, color: C.textMuted }}>· senaste 7 dagarna</span>
      </div>
      <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 10, padding: '12px 16px 16px' } as React.CSSProperties}>
        {honor.map((e, i) => {
          const isPerfect    = e.score === 300
          const isHighSeries = !isPerfect && (e.seriesTotal ?? 0) >= 950
          const isElite      = !isPerfect && !isHighSeries && e.score >= 250
          const nameParts    = e.playerName.split(' ')
          const firstName    = nameParts[0]
          const lastName     = nameParts.slice(1).join(' ')

          if (isPerfect) return (
            <a key={i} href={'/matches/' + e.matchId} style={{
              flexShrink: 0, textDecoration: 'none', borderRadius: 14,
              padding: '12px 14px', textAlign: 'center', minWidth: 96,
              background: '#000000', border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: 'inset 0 0 28px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.6)',
            }}>
              <div style={{ height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1.8, background: 'linear-gradient(90deg, #8a98b8, #ffffff 48%, #8a98b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>◆ PERFECT</div>
              </div>
              <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color: '#ffffff', textShadow: '0 0 2px #fff, 0 0 10px rgba(255,255,255,0.75), 0 0 28px rgba(255,255,255,0.25)' }}>300</div>
              {e.seriesTotal && <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, marginTop: 4, color: 'rgba(170,185,220,0.6)' }}>{e.seriesTotal} serie</div>}
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 7, color: 'rgba(215,222,240,0.85)', maxWidth: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
              <div style={{ fontSize: 10, color: 'rgba(140,155,185,0.7)', maxWidth: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastName || ' '}</div>
            </a>
          )

          if (isHighSeries) return (
            <a key={i} href={'/matches/' + e.matchId} style={{
              flexShrink: 0, textDecoration: 'none', borderRadius: 13,
              padding: '12px 14px', textAlign: 'center', minWidth: 86,
              background: '#07080e', border: '1px solid rgba(255,255,255,0.11)',
              boxShadow: 'inset 0 0 18px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.45)',
            }}>
              <div style={{ height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: 1.5, background: 'linear-gradient(90deg, #6a7a9a, #bcc8e0 50%, #6a7a9a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>◇ SERIE</div>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, color: '#d8dff0', textShadow: '0 0 8px rgba(205,218,255,0.55), 0 0 22px rgba(175,198,255,0.2)' }}>{e.seriesTotal}</div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, marginTop: 3, color: 'rgba(130,150,195,0.65)' }}>{e.score} bäst</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, color: 'rgba(195,208,235,0.8)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
              <div style={{ fontSize: 10, color: 'rgba(115,132,170,0.7)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastName || ' '}</div>
            </a>
          )

          const cardBorder = isElite ? 'rgba(245,194,0,0.4)' : 'rgba(245,194,0,0.25)'
          const cardBg     = isDark ? 'rgba(245,194,0,0.05)' : 'rgba(245,194,0,0.04)'
          const label      = isElite ? '★ ELITE' : '◼︎ TOP'
          return (
            <a key={i} href={'/matches/' + e.matchId} style={{
              flexShrink: 0, textDecoration: 'none', background: cardBg,
              border: `1px solid ${cardBorder}`, borderRadius: 12,
              padding: '12px 14px', textAlign: 'center', minWidth: 84,
              boxShadow: isElite ? '0 0 20px rgba(245,194,0,0.08)' : 'none',
            } as React.CSSProperties}>
              <div style={{ height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: 1.5, background: 'linear-gradient(90deg, #c8a830, #f5c200 50%, #c8a830)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{label}</div>
              </div>
              {isElite
                ? <div style={{ fontSize: 32, fontWeight: 900, color: '#ffffff', lineHeight: 1, textShadow: '0 0 8px rgba(255,255,255,0.55), 0 0 22px rgba(255,255,255,0.18)' }}>{e.score}</div>
                : <div style={{ fontSize: 28, fontWeight: 900, color: '#f5c200', lineHeight: 1, textShadow: '0 0 8px rgba(245,194,0,0.5), 0 0 20px rgba(245,194,0,0.2)' }}>{e.score}</div>
              }
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginTop: 8, maxWidth: 78, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
              <div style={{ fontSize: 10, color: C.textMuted, maxWidth: 78, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastName || ' '}</div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

import React from 'react'
