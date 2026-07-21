'use client'

import Link from 'next/link'
import type { TableRow } from '@/app/home/types'
import { HC } from './tokens'

type Div = 'Elitserien Herrar' | 'Elitserien Damer'
type Zone = { playoffRanks?: number; promotionRanks?: number; relegationRanks: number }

const formColor = (r: 'W' | 'D' | 'L') => r === 'W' ? HC.GREEN : r === 'L' ? HC.RED : HC.INK4

/** Mini league table with a division toggle and promotion/relegation zones. */
export default function StandingsCard({ rows, div, setDiv, zone, followedIds }: {
  rows: TableRow[]
  div: Div
  setDiv: (d: Div) => void
  zone?: Zone
  followedIds: Set<string>
}) {
  const total = rows.length
  const rankTone = (rank: number): string => {
    if (!zone) return HC.INK4
    if (zone.promotionRanks && rank <= zone.promotionRanks) return HC.GOLD
    if (zone.playoffRanks && rank <= zone.playoffRanks) return HC.GREEN
    if (rank > total - zone.relegationRanks) return HC.RED
    return HC.INK4
  }

  return (
    <div style={{ padding: '32px 20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: HC.INK3 }}>TABELL</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['Elitserien Herrar', 'Elitserien Damer'] as const).map(d => (
            <button key={d} onClick={() => setDiv(d)}
              style={{ minHeight: 32, padding: '0 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                background: div === d ? HC.INK : HC.SURFACE2,
                color: div === d ? HC.BG : HC.INK3 }}>
              {d === 'Elitserien Herrar' ? 'Herrar' : 'Damer'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: HC.SURFACE, borderRadius: 16, overflow: 'hidden' }}>
        {rows.map((t, i) => {
          const followed = followedIds.has(t.teamId)
          return (
            <Link key={t.teamId} href={`/teams/${t.teamId}`}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', textDecoration: 'none',
                borderTop: i > 0 ? `1px solid ${HC.HAIRLINE}` : 'none',
                background: followed ? 'rgba(245,194,0,0.05)' : 'transparent' }}>
              <span style={{ width: 16, fontSize: 13, fontWeight: 800, color: rankTone(t.rank),
                fontVariantNumeric: 'tabular-nums', textAlign: 'center', flexShrink: 0 }}>{t.rank}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: followed ? 700 : 500, color: HC.INK,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.teamName}</span>
              <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                {t.form.slice(0, 5).map((r, fi) => (
                  <span key={fi} style={{ width: 5, height: 5, borderRadius: '50%', background: formColor(r) }} />
                ))}
              </div>
              <span style={{ width: 26, flexShrink: 0, textAlign: 'right', fontSize: 14, fontWeight: 800, color: HC.INK,
                fontVariantNumeric: 'tabular-nums' }}>{t.points}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
