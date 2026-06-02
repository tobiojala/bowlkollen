'use client'

import { shortName } from '@/lib/utils'

type TableRow = { rank: number; teamId: string; teamName: string; played: number; won: number; drawn: number; lost: number; points: number }

type Props = {
  tableRows: TableRow[]
  tableDiv: 'Elitserien Herrar' | 'Elitserien Damer'
  setTableDiv: (d: 'Elitserien Herrar' | 'Elitserien Damer') => void
  followedIds: Set<string>
  C: any
  isDark: boolean
}

export default function MiniStandings({ tableRows, tableDiv, setTableDiv, followedIds, C, isDark }: Props) {
  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: 1.5, flex: 1 }}>LIGATABELL</span>
        {(['Elitserien Herrar', 'Elitserien Damer'] as const).map(div => (
          <button key={div} onClick={() => setTableDiv(div)}
            style={{
              fontSize: 9, fontWeight: 700, padding: '4px 10px', borderRadius: 8, marginLeft: 6,
              cursor: 'pointer', border: 'none',
              background: tableDiv === div ? '#f5c200' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
              color: tableDiv === div ? '#1a1400' : C.textMuted,
              WebkitTapHighlightColor: 'transparent',
            } as React.CSSProperties}>
            {div === 'Elitserien Herrar' ? 'Elit H' : 'Elit D'}
          </button>
        ))}
      </div>

      {tableRows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', fontSize: 12, color: C.textMuted, background: C.card, borderRadius: 14, border: '1px solid ' + C.border }}>
          Inga resultat ännu — matcher läggs till via Admin
        </div>
      ) : (
        <div style={{ borderRadius: 14, border: '1px solid ' + C.border, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid ' + C.border, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
            <div style={{ width: 3, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '28px 1fr 26px 34px', padding: '5px 12px' }}>
              {(['#', 'Lag', 'M', 'MP'] as const).map((h, i) => (
                <span key={h} style={{ fontSize: 9, color: C.textMuted, fontWeight: 700, textAlign: i >= 2 ? 'center' : 'left' } as React.CSSProperties}>{h}</span>
              ))}
            </div>
          </div>

          {/* Rows */}
          {tableRows.slice(0, 5).map((row, i) => {
            const zoneClr = row.rank <= 2 ? '#f5c200' : row.rank <= 6 ? '#38a088' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)')
            const isMyTeam = followedIds.has(row.teamId)
            return (
              <a key={row.teamId} href={'/teams/' + row.teamId}
                style={{
                  display: 'flex', alignItems: 'center', textDecoration: 'none',
                  borderTop: i > 0 ? '1px solid ' + C.border : 'none',
                  background: isMyTeam ? (isDark ? 'rgba(245,194,0,0.06)' : 'rgba(245,194,0,0.05)') : 'transparent',
                  WebkitTapHighlightColor: 'transparent',
                } as React.CSSProperties}
                onMouseEnter={e => (e.currentTarget.style.background = C.card)}
                onMouseLeave={e => (e.currentTarget.style.background = isMyTeam ? (isDark ? 'rgba(245,194,0,0.06)' : 'rgba(245,194,0,0.05)') : 'transparent')}
              >
                <div style={{ width: 3, flexShrink: 0, alignSelf: 'stretch', background: zoneClr }} />
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '28px 1fr 26px 34px', padding: '9px 12px', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: row.rank <= 6 ? zoneClr : C.textMuted, textAlign: 'center' }}>{row.rank}</span>
                  <span style={{ fontSize: 13, fontWeight: isMyTeam ? 700 : 400, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 4 }}>
                    {shortName(row.teamName)}
                  </span>
                  <span style={{ fontSize: 11, color: C.textMuted, textAlign: 'center' }}>{row.played}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, textAlign: 'center', color: row.rank <= 2 ? '#f5c200' : C.text }}>{row.points}</span>
                </div>
              </a>
            )
          })}

          <a href="/league" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '9px 12px', fontSize: 11, fontWeight: 600, color: C.textMuted,
            textDecoration: 'none', borderTop: '1px solid ' + C.border,
            background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)',
            WebkitTapHighlightColor: 'transparent',
          } as React.CSSProperties}>
            Visa hela tabellen →
          </a>
        </div>
      )}
    </div>
  )
}

import React from 'react'
