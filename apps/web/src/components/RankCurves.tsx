'use client'

import { COLOR, FONT } from '@/lib/brand'

// Real BITS ranking-points curves for the profile's Säsongskurva sheet.
// RankCurve: rankingpoäng per competition over the season. ComboCurve: snitt +
// ranking normalised onto one 0–100 trend axis (BK deliberately excluded — it's
// still "kommer snart"). Ranking uses the neutral grey categorical, never gold.
const RANK = '#9ca5b3'
const W = 340, H = 152
const PAD = { l: 30, r: 46, t: 16, b: 22 }
const iH = H - PAD.t - PAD.b
const iW = W - PAD.l - PAD.r

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
const label = (x: number, y: number, s: string | number, fill: string, anchor: 'start' | 'middle' | 'end', weight = 500) => (
  <text x={x} y={y} fill={fill} fontSize={10.5} textAnchor={anchor} fontWeight={weight}
    fontFamily={FONT.body} style={{ fontVariantNumeric: 'tabular-nums' }}>{s}</text>
)

export function RankCurve({ points }: { points: { value: number; date: string }[] }) {
  const N = points.length
  if (N < 2) return null
  const vals = points.map(p => p.value)
  const lo = Math.min(0, ...vals), hi = Math.max(...vals)
  const pad = Math.max((hi - lo) * 0.14, 2)
  const mn = lo, mx = hi + pad
  const cx = (i: number) => PAD.l + (i / (N - 1)) * iW
  const cy = (v: number) => PAD.t + iH - ((v - mn) / (mx - mn)) * iH
  const pts = points.map((p, i) => ({ x: cx(i), y: cy(p.value) }))
  const grid = [mn, (mn + mx) / 2, mx].map(v => Math.round(v))
  const last = pts[N - 1]

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      {grid.map((v, k) => (
        <g key={k}>
          <line x1={PAD.l} y1={cy(v)} x2={W - PAD.r} y2={cy(v)} stroke={COLOR.hairline} strokeWidth={1} />
          {label(PAD.l - 6, cy(v) + 3.5, v, COLOR.ink3, 'end', 600)}
        </g>
      ))}
      <path d={smoothPath(pts)} fill="none" stroke={RANK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i === N - 1 ? 4 : 2.2} fill={RANK} />)}
      {label(last.x, last.y - 12, 'nu', RANK, 'middle', 700)}
      {label(PAD.l, H - 5, points[0].date, COLOR.ink3, 'start')}
      {label(W - PAD.r, H - 5, points[N - 1].date, COLOR.ink3, 'end')}
    </svg>
  )
}

const norm = (a: number[]) => {
  const lo = Math.min(...a), hi = Math.max(...a), r = hi - lo || 1
  return a.map(v => ((v - lo) / r) * 100)
}

export function ComboCurve({ snitt, ranking }: { snitt: number[]; ranking: number[] }) {
  if (snitt.length < 2) return null
  const cy = (v: number) => PAD.t + iH - (v / 100) * iH
  const series = [
    { d: norm(snitt), c: COLOR.gold, w: 2.4 },
    ...(ranking.length >= 2 ? [{ d: norm(ranking), c: RANK, w: 2.2 }] : []),
  ]
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
        {[0, 50, 100].map(v => (
          <g key={v}>
            <line x1={PAD.l} y1={cy(v)} x2={W - PAD.r} y2={cy(v)} stroke={COLOR.hairline} strokeWidth={1} />
            {label(PAD.l - 6, cy(v) + 3.5, `${v}%`, COLOR.ink3, 'end', 600)}
          </g>
        ))}
        {series.map(({ d, c, w }) => {
          const pts = d.map((v, i) => ({ x: PAD.l + (i / (d.length - 1)) * iW, y: cy(v) }))
          return <path key={c} d={smoothPath(pts)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
        })}
        {label(PAD.l, PAD.t - 4, 'Normaliserat — trendform', COLOR.ink4, 'start')}
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: COLOR.ink3 }}>
          <span style={{ width: 10, height: 3, borderRadius: 2, background: COLOR.gold }} />Snitt
        </span>
        {ranking.length >= 2 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: COLOR.ink3 }}>
            <span style={{ width: 10, height: 3, borderRadius: 2, background: RANK }} />Ranking
          </span>
        )}
      </div>
    </div>
  )
}
