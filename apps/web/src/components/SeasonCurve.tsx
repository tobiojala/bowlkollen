'use client'

import { useEffect, useRef, useState } from 'react'
import { COLOR, FONT } from '@/lib/brand'

// The honest season/career curve for the profile's Säsongskurva sheet: every
// match is a faint ink dot (the real spread, good games and bad), a smoothed
// ink FORM line is the signal you read, and GOLD is spent only where it's
// earned — matches with a milestone series (≥ SERIE_GOLD_MIN) and the current
// "nu" point. Tracks its render width so 1 unit = 1px (crisp axis text at every
// screen size), the same convention as ProfileTrend, so the profile reads as one.
interface SeasonCurveProps {
  matchAvgs:  number[]   // per-match average, chronological (oldest → newest)
  dates:      string[]   // display date per match, parallel to matchAvgs
  highlights: boolean[]  // true where that match held a milestone series, parallel
  seasonAvg:  number
  recentAvg:  number     // last-4 form → drives the projection tail
  tapped:     number | null
  onTap:      (i: number | null) => void
}

const PAD = { l: 34, r: 50, t: 16, b: 24 }
const AXIS = 12  // real px (1 unit = 1px), matches ProfileTrend's crisp labels

function rollingMean(a: number[], w: number): number[] {
  const h = Math.floor((w - 1) / 2)
  return a.map((_, i) => {
    let s = 0, c = 0
    for (let j = Math.max(0, i - h); j <= Math.min(a.length - 1, i + h); j++) { s += a[j]; c++ }
    return s / c
  })
}

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

export default function SeasonCurve({ matchAvgs, dates, highlights, seasonAvg, recentAvg, tapped, onTap }: SeasonCurveProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [renderW, setRenderW] = useState(0)
  useEffect(() => {
    const el = svgRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setRenderW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const N = matchAvgs.length
  if (N < 2) return null

  const W = renderW > 0 ? renderW : 360
  const H = Math.max(150, Math.min(300, Math.round(W * 0.42)))
  const iH = H - PAD.t - PAD.b
  // Reserve the right ~18% for the "where you're heading" projection tail.
  const splitX = PAD.l + (W - PAD.l - PAD.r) * 0.82
  const win  = Math.max(5, Math.min(15, Math.round(N / 12)))
  const form = rollingMean(matchAvgs, win)

  const vals = [...matchAvgs, seasonAvg, recentAvg]
  const lo = Math.min(...vals), hi = Math.max(...vals)
  const vpad = Math.max((hi - lo) * 0.14, 6)
  const mn = lo - vpad, mx = hi + vpad

  const cx = (i: number) => PAD.l + (i / (N - 1)) * (splitX - PAD.l)
  const cy = (v: number) => PAD.t + iH - ((v - mn) / (mx - mn)) * iH

  // Nice-step gridlines — 3–5 round values, never a wall of numbers.
  const range = Math.max(1, mx - mn)
  const step = [5, 10, 20, 25, 50, 100].find(s => s >= range / 4) ?? 100
  const grid: number[] = []
  for (let v = Math.ceil(mn / step) * step; v < mx && grid.length < 6; v += step) grid.push(v)

  const mpts = matchAvgs.map((v, i) => ({ x: cx(i), y: cy(v) }))
  const fpts = form.map((v, i) => ({ x: cx(i), y: cy(v) }))
  const last = fpts[N - 1]
  const projX = W - PAD.r
  const yForm = cy(recentAvg), yAvg = cy(seasonAvg)

  const t = (x: number, y: number, s: string | number, fill: string, anchor: 'start' | 'middle' | 'end', weight = 500) => (
    <text x={x} y={y} fill={fill} fontSize={AXIS} textAnchor={anchor} fontWeight={weight}
      fontFamily={FONT.body} style={{ fontVariantNumeric: 'tabular-nums' }}>{s}</text>
  )

  return (
    <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      {grid.map(v => (
        <g key={v}>
          <line x1={PAD.l} y1={cy(v)} x2={W - PAD.r} y2={cy(v)} stroke={COLOR.hairline} strokeWidth={1} />
          {t(PAD.l - 8, cy(v) + 4, v, COLOR.ink3, 'end', 500)}
        </g>
      ))}

      {/* season-average baseline */}
      <line x1={PAD.l} y1={yAvg} x2={W - PAD.r} y2={yAvg} stroke="rgba(244,245,247,0.22)" strokeWidth={1} strokeDasharray="4,3" />
      {t(W - PAD.r + 5, yAvg + 4, `snitt ${seasonAvg}`, COLOR.ink3, 'start', 600)}

      {/* projection tail — form vs season average holding */}
      <line x1={last.x} y1={last.y} x2={projX} y2={yForm} stroke="rgba(245,194,0,0.5)" strokeWidth={1.6} strokeDasharray="4,3" strokeLinecap="round" />
      <line x1={last.x} y1={last.y} x2={projX} y2={yAvg} stroke="rgba(244,245,247,0.22)" strokeWidth={1.6} strokeDasharray="4,3" strokeLinecap="round" />

      {/* every match as a faint ink dot; milestones in gold */}
      {mpts.map((p, i) => (
        <g key={i} onClick={() => onTap(tapped === i ? null : i)} style={{ cursor: 'pointer' }}>
          <circle cx={p.x} cy={p.y} r={11} fill="transparent" />
          {tapped === i
            ? <circle cx={p.x} cy={p.y} r={5} fill="#fff" stroke={COLOR.gold} strokeWidth={2.5} />
            : highlights[i]
              ? <circle cx={p.x} cy={p.y} r={3.6} fill={COLOR.gold} />
              : <circle cx={p.x} cy={p.y} r={2.4} fill="rgba(244,245,247,0.32)" />}
        </g>
      ))}

      {/* the form line — the signal */}
      <path d={smoothPath(fpts)} fill="none" stroke={COLOR.ink2} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

      {/* "nu" — current form level */}
      <circle cx={last.x} cy={last.y} r={10} fill="rgba(245,194,0,0.16)" />
      <circle cx={last.x} cy={last.y} r={5} fill={COLOR.gold} />
      {t(last.x, last.y - 14, 'nu', COLOR.gold, 'middle', 700)}

      {/* real first/last match dates */}
      {t(PAD.l, H - 6, dates[0] ?? '', COLOR.ink3, 'start')}
      {t(splitX, H - 6, dates[N - 1] ?? '', COLOR.ink3, 'end')}
    </svg>
  )
}
