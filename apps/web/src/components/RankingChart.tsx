'use client'

import { COLOR, FONT } from '@/lib/brand'

// Multi-line chart for the profile's ranking history (BITS Spelarprofil style):
// one or more metrics on a shared absolute value axis over the 12 months. Used
// for the Rank. tab (ranking alone, axis fitted) and Alla (spelstyrka + ranking +
// snitt on one 0-based axis, so the flat metrics sit low and ranking rides high).
export type Line = { label: string; color: string; values: number[] }

const W = 340, H = 150
const PAD = { l: 34, r: 12, t: 14, b: 22 }
const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 3) return pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

export function RankingChart({ xLabels, lines, zeroBased = false }: { xLabels: string[]; lines: Line[]; zeroBased?: boolean }) {
  const n = xLabels.length
  if (n < 2 || lines.length === 0) return null
  const all = lines.flatMap(l => l.values)
  const hi = Math.max(...all)
  const lo = zeroBased ? 0 : Math.min(...all)
  const pad = Math.max((hi - lo) * 0.12, 1)
  const mn = zeroBased ? 0 : lo - pad, mx = hi + pad

  const cx = (i: number) => PAD.l + (i / (n - 1)) * iW
  const cy = (v: number) => PAD.t + iH - ((v - mn) / (mx - mn)) * iH
  const gridN = 4
  const grid = Array.from({ length: gridN + 1 }, (_, k) => Math.round(mn + ((mx - mn) * k) / gridN))

  const t = (x: number, y: number, s: string | number, fill: string, anchor: 'start' | 'middle' | 'end', weight = 500) => (
    <text x={x} y={y} fill={fill} fontSize={10.5} textAnchor={anchor} fontWeight={weight}
      fontFamily={FONT.body} style={{ fontVariantNumeric: 'tabular-nums' }}>{s}</text>
  )

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
        {grid.map((v, k) => (
          <g key={k}>
            <line x1={PAD.l} y1={cy(v)} x2={W - PAD.r} y2={cy(v)} stroke={COLOR.hairline} strokeWidth={1} />
            {t(PAD.l - 6, cy(v) + 3.5, v, COLOR.ink3, 'end', 600)}
          </g>
        ))}
        {lines.map(l => {
          const pts = l.values.map((v, i) => ({ x: cx(i), y: cy(v) }))
          const last = pts[pts.length - 1]
          return (
            <g key={l.label}>
              <path d={smoothPath(pts)} fill="none" stroke={l.color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={last.x} cy={last.y} r={3.5} fill={l.color} />
            </g>
          )
        })}
        {t(PAD.l, H - 5, xLabels[0], COLOR.ink3, 'start')}
        {t(W - PAD.r, H - 5, xLabels[n - 1], COLOR.ink3, 'end')}
      </svg>
      {lines.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
          {lines.map(l => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: COLOR.ink3 }}>
              <span style={{ width: 10, height: 3, borderRadius: 2, background: l.color }} />{l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
