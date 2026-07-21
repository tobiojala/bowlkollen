'use client'

import { SPACE } from '@/lib/brand'

function smooth(pts: { x: number; y: number }[]) {
  return pts.map((p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)},${p.y.toFixed(1)}`
    const pv = pts[i - 1], cpx = ((pv.x + p.x) / 2).toFixed(1)
    return `C ${cpx},${pv.y.toFixed(1)} ${cpx},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ')
}

export function FormCurve({
  matchAvgs,
  seasonAvg,
  recentAvg,
  gid = 'fc',
}: {
  matchAvgs: number[]
  seasonAvg: number
  recentAvg: number
  gid?: string
}) {
  const N = matchAvgs.length
  if (N < 2) return null

  const W = 300, H = 72
  const PAD = { l: 2, r: 24, t: 22, b: 6 }
  const iH  = H - PAD.t - PAD.b

  const dataMin = Math.min(...matchAvgs)
  const dataMax = Math.max(...matchAvgs)
  const vPad = Math.max((dataMax - dataMin) * 0.25, 6)
  const mn = dataMin - vPad
  const mx = dataMax + vPad

  const cx = (i: number) => PAD.l + (i / (N - 1)) * (W - PAD.l - PAD.r)
  const cy = (v: number) => PAD.t + iH - ((v - mn) / (mx - mn)) * iH

  const pts  = matchAvgs.map((v, i) => ({ x: cx(i), y: cy(v) }))
  const line = smooth(pts)
  const fill = `${line} L ${pts[N-1].x.toFixed(1)},${(PAD.t+iH).toFixed(1)} L ${PAD.l},${(PAD.t+iH).toFixed(1)} Z`
  const avgY = cy(seasonAvg)
  const last = pts[N - 1]

  // Trend color: based on whether the latest value is above or below season avg
  const aboveAvg   = last.y < avgY  // SVG y is inverted — smaller y = higher score
  const tipColor   = aboveAvg ? '#f5c200' : '#e05555'
  const labelY     = Math.max(last.y - 10, PAD.t - 2)

  // Transition starts ~55 viewBox units before the terminal dot
  const tipStartX  = Math.max(PAD.l, last.x - 55)

  return (
    <div style={{ marginTop: SPACE[3] }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <defs>
          {/* Green area fill gradient */}
          <linearGradient id={`${gid}_f`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="rgba(48,212,126,0.22)" />
            <stop offset="100%" stopColor="rgba(48,212,126,0)"    />
          </linearGradient>

          {/*
            Tip overlay: transparent green → gold/red over the last ~55px.
            Layered on top of the green stroke — the curve stays green,
            then bleeds into the trend color right before the dot.
          */}
          <linearGradient id={`${gid}_tip`} gradientUnits="userSpaceOnUse"
            x1={tipStartX} y1="0" x2={last.x} y2="0">
            <stop offset="0%"   stopColor="rgba(48,212,126,0)" />
            <stop offset="100%" stopColor={tipColor}            />
          </linearGradient>
        </defs>

        {/* Season average — dashed reference */}
        <line
          x1={PAD.l} y1={avgY} x2={W - PAD.r} y2={avgY}
          stroke="rgba(244,245,247,0.14)" strokeWidth="1" strokeDasharray="3,3"
        />

        {/* Avg label — right end of dashed line */}
        <text x={W - PAD.r - 3} y={avgY - 4}
          fontSize={10} textAnchor="end"
          fill="rgba(244,245,247,0.45)" fontFamily="system-ui, sans-serif">
          snitt {seasonAvg.toFixed(0)}
        </text>

        {/* Area fill — green */}
        <path d={fill} fill={`url(#${gid}_f)`} />

        {/* Base curve — full green */}
        <path d={line} fill="none" stroke="#30d47e" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Tip overlay — transparent → gold/red, layered on top */}
        <path d={line} fill="none" stroke={`url(#${gid}_tip)`} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Terminal dot — trend color */}
        <circle cx={last.x} cy={last.y} r={4}
          fill={tipColor}
          stroke={aboveAvg ? 'rgba(245,194,0,0.22)' : 'rgba(224,85,85,0.22)'}
          strokeWidth={6} />

        {/* Recent value — above the dot, trend color */}
        <text x={last.x} y={labelY}
          fontSize={12} textAnchor="middle" fontWeight="700"
          fill={tipColor}
          fontFamily="'Barlow Condensed', system-ui, sans-serif">
          {recentAvg.toFixed(0)}
        </text>
      </svg>
    </div>
  )
}
