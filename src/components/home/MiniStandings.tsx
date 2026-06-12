'use client'

import React from 'react'
import Link from 'next/link'
import { shortName } from '@/lib/utils'
import type { TableRow, FormResult } from '@/lib/types'

type Props = {
  tableRows: TableRow[]
  tableDiv: 'Elitserien Herrar' | 'Elitserien Damer'
  setTableDiv: (d: 'Elitserien Herrar' | 'Elitserien Damer') => void
  followedIds: Set<string>
  C: any
  isDark: boolean
}

const FORM_COLOR: Record<FormResult, string> = {
  W: '#5dcaa5',
  D: 'rgba(140,155,185,0.45)',
  L: '#e05555',
}

function FormDots({ form }: { form: FormResult[] }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {form.map((r, i) => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: FORM_COLOR[r], flexShrink: 0 }} />
      ))}
      {Array.from({ length: Math.max(0, 5 - form.length) }).map((_, i) => (
        <div key={`ph-${i}`} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
      ))}
    </div>
  )
}

export default function MiniStandings({ tableRows, tableDiv, setTableDiv, followedIds, C, isDark }: Props) {
  const total = tableRows.length

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <span className="section-label" style={{ flex: 1, color: C.textMuted }}>Ligatabell</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['Elitserien Herrar', 'Elitserien Damer'] as const).map(div => {
            const active = tableDiv === div
            return (
              <button key={div} onClick={() => setTableDiv(div)} style={{
                fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 8,
                cursor: 'pointer', border: 'none', transition: 'all 120ms',
                background: active
                  ? (isDark ? 'rgba(245,194,0,0.15)' : 'rgba(245,194,0,0.18)')
                  : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                color: active ? '#f5c200' : C.textMuted,
                WebkitTapHighlightColor: 'transparent',
              } as React.CSSProperties}>
                {div === 'Elitserien Herrar' ? 'Herrar' : 'Damer'}
              </button>
            )
          })}
        </div>
      </div>

      {tableRows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 16px', fontSize: 12, color: C.textMuted, background: C.card, borderRadius: 16, border: '1px solid ' + C.border }}>
          Inga resultat ännu
        </div>
      ) : (
        <div style={{ borderRadius: 16, border: '1px solid ' + C.border, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 28px 44px', padding: '6px 14px', borderBottom: '1px solid ' + C.border, background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)' }}>
            {['#', 'Lag', 'P', 'Form'].map(h => (
              <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textMuted, textAlign: h === 'P' ? 'center' as const : 'left' as const }}>
                {h}
              </span>
            ))}
          </div>

          {tableRows.slice(0, 6).map((row, i) => {
            const isFirst  = row.rank === 1
            const isTop    = row.rank <= Math.ceil(total / 2)
            const isMyTeam = followedIds.has(row.teamId)
            const rankColor = isFirst ? '#f5c200' : isTop ? '#5dcaa5' : C.textMuted

            return (
              <Link key={row.teamId} href={'/teams/' + row.teamId} style={{
                display: 'grid', gridTemplateColumns: '28px 1fr 28px 44px',
                padding: '9px 14px', alignItems: 'center', textDecoration: 'none',
                borderTop: i > 0 ? '1px solid ' + C.border : 'none',
                background: isMyTeam ? (isDark ? 'rgba(245,194,0,0.05)' : 'rgba(245,194,0,0.04)') : 'transparent',
                WebkitTapHighlightColor: 'transparent',
              } as React.CSSProperties}
                onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = isMyTeam ? (isDark ? 'rgba(245,194,0,0.05)' : 'rgba(245,194,0,0.04)') : 'transparent')}
              >
                <span className="num" style={{ fontSize: 14, color: rankColor }}>{row.rank}</span>

                <span style={{ fontSize: 13, fontWeight: isMyTeam ? 600 : 400, color: isDark ? '#e8edf5' : '#1a2535', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 6 }}>
                  {shortName(row.teamName)}
                  {isMyTeam && <span style={{ marginLeft: 5, fontSize: 8, fontWeight: 700, color: '#f5c200', letterSpacing: '0.06em' }}>DU</span>}
                </span>

                <span className="num" style={{ fontSize: 16, textAlign: 'center', color: isFirst ? '#f5c200' : (isDark ? '#e8edf5' : '#1a2535'), fontWeight: isFirst ? 700 : 600 }}>
                  {row.points}
                </span>

                <FormDots form={row.form} />
              </Link>
            )
          })}

          <Link href="/league" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', fontSize: 12, fontWeight: 500, color: C.textMuted,
            textDecoration: 'none', borderTop: '1px solid ' + C.border,
            background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)',
            WebkitTapHighlightColor: 'transparent',
          } as React.CSSProperties}
            onMouseEnter={e => (e.currentTarget.style.color = isDark ? '#e8edf5' : '#1a2535')}
            onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
          >
            <span>Hela tabellen</span>
            <span style={{ fontSize: 14, opacity: 0.4 }}>→</span>
          </Link>
        </div>
      )}
    </div>
  )
}
