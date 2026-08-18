'use client'

import { COLOR, FONT } from '@/lib/brand'

const H = 80
const FLOOR = 0.1
const LOW = 110
const HIGH = 300
const LABEL_MAX = 8

// Game-by-game graph for a series. Absolute heights (110→300, not per-series
// min→max) so a weak game reads short and a big one tall, comparable across posts.
export function SerieBars({ series }: { series: number[] }) {
  if (series.length === 0) return null
  const n = series.length
  const showLabels = n <= LABEL_MAX
  const gap = n > 8 ? 5 : 8
  const barW = n <= 4 ? 26 : n <= 6 ? 18 : n <= 8 ? 13 : 10

  const height = (g: number) => {
    const frac = Math.max(0, Math.min(1, (g - LOW) / (HIGH - LOW)))
    return Math.round((FLOOR + (1 - FLOOR) * frac) * H)
  }
  const color = (g: number) => (g >= 250 ? COLOR.ink : g >= 210 ? COLOR.ink2 : g >= 170 ? COLOR.ink3 : COLOR.ink4)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap }}>
      {series.map((g, i) => (
        <div key={i} style={{ flex: 1, maxWidth: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
          <div style={{ height: H, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div style={{ width: barW, height: height(g), borderRadius: 3, background: color(g) }} />
          </div>
          {showLabels && <span style={{ color: COLOR.ink2, fontSize: 13, fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums' }}>{g}</span>}
        </div>
      ))}
    </div>
  )
}
