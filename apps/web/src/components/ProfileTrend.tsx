'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { COLOR, FONT, TYPE } from '@/lib/brand'

export type TrendPoint = { avg: number; date: string; label: string }

// Web mirror of the native ProfileTrend graph: solid ink line, gridlines + value
// labels, dashed "snitt" baseline, dashed prognos, and a colour-only dot + light-
// tail that follows the cursor on HOVER (drag → hover is the only platform change).
const H = 190
const PAD_L = 40
const PAD_R = 40
const PAD_T = 26
const PAD_B = 24
const AXIS = 13   // real px — viewBox width tracks the render width, so 1 unit = 1px
const BODY = "var(--font-body, 'DM Sans'), system-ui"
const ink = (o: number) => `rgba(244,245,247,${o})`

export default function ProfileTrend({
  points, label, restValue, delta, deltaSuffix, caption, footerLeft, footerRight,
  accent, baseline, baselineLabel = 'snitt', projValue, lineWidth = 2.6, tailLength = 5, yPad = 0.18,
  onSelect,
}: {
  points: TrendPoint[]
  /** When set, the scrubbed point becomes clickable — fires with its index. */
  onSelect?: (index: number) => void
  label?: string
  restValue?: number
  delta?: number | null
  deltaSuffix?: string
  caption?: string
  footerLeft?: string
  footerRight?: string
  accent?: string
  baseline?: number | null
  baselineLabel?: string
  projValue?: number | null
  lineWidth?: number
  tailLength?: number
  yPad?: number
}) {
  const gid = useId()
  const svgRef = useRef<SVGSVGElement>(null)
  const prev = useRef(points.length - 1)
  // A fixed-width viewBox shrinks all SVG text on narrow hero cards (~340px → 0.57×,
  // so 13px reads at ~7px). Instead track the real render width as the viewBox width
  // → 1 unit = 1px, so AXIS/dot sizes are true pixels at every card size.
  const [renderW, setRenderW] = useState(0)
  useEffect(() => {
    const el = svgRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setRenderW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const W = renderW > 0 ? renderW : 340
  const n = points.length
  const [active, setActive] = useState(n - 1)
  const [dir, setDir] = useState(1)
  const [hover, setHover] = useState(false)

  const avgs = points.map((p) => p.avg)
  const hasProj = projValue != null && n >= 2
  const usableW = W - PAD_L - PAD_R
  const dataW = hasProj ? usableW * 0.85 : usableW
  const vals = [...avgs, ...(hasProj ? [projValue as number] : []), ...(baseline != null ? [baseline] : [])]
  const vmin = vals.length ? Math.min(...vals) : 0
  const vmax = vals.length ? Math.max(...vals) : 1
  const vpad = Math.max((vmax - vmin) * yPad, 4)
  const lo = vmin - vpad
  const span = vmax + vpad - lo || 1
  const cy = (v: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - (v - lo) / span)
  const xs = points.map((_, i) => PAD_L + (n <= 1 ? dataW / 2 : (i / (n - 1)) * dataW))
  const ys = points.map((p) => cy(p.avg))
  const linePath = xs.map((x, i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')

  const range = Math.max(1, vmax - vmin)
  const step = [1, 2, 5, 10, 20, 25, 50, 100].find((s) => s >= range / 4) ?? 100
  const gridVals: number[] = []
  for (let v = Math.ceil(vmin / step) * step; v <= vmax && gridVals.length < 6; v += step) gridVals.push(v)

  const up = n >= 2 ? points[active].avg >= points[0].avg : true
  const color = accent ?? (up ? COLOR.green : COLOR.red)

  const tailStart = Math.max(0, Math.min(n - 1, active - dir * tailLength))
  const [a, b] = tailStart <= active ? [tailStart, active] : [active, tailStart]
  const tailPath = xs.slice(a, b + 1).map((x, i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${ys[a + i].toFixed(1)}`).join(' ')

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || n < 2) return
    const px = ((e.clientX - rect.left) / rect.width) * W
    const i = Math.max(0, Math.min(n - 1, Math.round(((px - PAD_L) / dataW) * (n - 1))))
    setDir(i > prev.current ? 1 : i < prev.current ? -1 : dir)
    prev.current = i
    setActive(i)
    setHover(true)
  }
  const onLeave = () => { setActive(n - 1); prev.current = n - 1; setHover(false) }

  const onClick = () => { if (onSelect && hover && n) onSelect(active) }

  const bigValue = hover && n ? points[active].avg : restValue ?? points[active]?.avg ?? 0
  const subLine = hover && n
    ? `${points[active].date}${points[active].label ? ` · mot ${points[active].label}` : ''}${onSelect ? '  ·  öppna matchen →' : ''}`
    : caption
  const showDelta = !hover && delta != null && delta !== 0
  const t = (x: number, y: number, fill: string, anchor: 'start' | 'end' = 'start', weight = 500) => ({
    x, y, fill, fontSize: AXIS, fontFamily: BODY, fontWeight: weight, textAnchor: anchor as 'start' | 'end',
  })

  return (
    <div>
      {/* readout */}
      <div style={{ paddingLeft: 4, marginBottom: 6 }}>
        {label ? <div style={{ color: COLOR.ink3, fontSize: TYPE.label, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div> : null}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ color: COLOR.ink, fontFamily: FONT.score, fontWeight: 800, fontSize: TYPE.hero, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{bigValue}</span>
          {showDelta ? (
            <span style={{ color: delta! > 0 ? COLOR.green : COLOR.red, fontSize: TYPE.caption, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {delta! > 0 ? `↑ +${delta}` : `↓ ${Math.abs(delta!)}`}{deltaSuffix ? ` ${deltaSuffix}` : ''}
            </span>
          ) : null}
        </div>
        {subLine ? <div style={{ color: COLOR.ink2, fontSize: TYPE.caption, fontWeight: 600, marginTop: 4 }}>{subLine}</div> : null}
      </div>

      {/* graph */}
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', cursor: onSelect ? 'pointer' : 'crosshair' }} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick}>
        {n >= 2 && (
          <>
            <defs>
              <linearGradient id={`tl${gid}`} gradientUnits="userSpaceOnUse" x1={xs[tailStart]} y1={ys[tailStart]} x2={xs[active]} y2={ys[active]}>
                <stop offset="0" stopColor={color} stopOpacity="0" />
                <stop offset="1" stopColor={color} stopOpacity="1" />
              </linearGradient>
            </defs>

            {gridVals.map((v) => <line key={`g${v}`} x1={PAD_L} y1={cy(v)} x2={W - PAD_R} y2={cy(v)} stroke={ink(0.05)} strokeWidth={1} />)}
            {gridVals.map((v) => <text key={`t${v}`} {...t(PAD_L - 6, cy(v) + 4, COLOR.ink2, 'end', 600)}>{v}</text>)}

            {baseline != null && (
              <>
                <line x1={PAD_L} y1={cy(baseline)} x2={xs[n - 1]} y2={cy(baseline)} stroke={COLOR.ink3} strokeWidth={1} strokeDasharray="4,3" />
                <text {...t(PAD_L, PAD_T - 8, COLOR.ink3, 'start', 700)}>{baselineLabel} {baseline}</text>
              </>
            )}

            {hasProj && (
              <>
                <line x1={xs[n - 1]} y1={PAD_T} x2={xs[n - 1]} y2={H - PAD_B} stroke={ink(0.06)} strokeWidth={1} />
                <path d={`M ${xs[n - 1].toFixed(1)} ${ys[n - 1].toFixed(1)} L ${(W - PAD_R).toFixed(1)} ${cy(projValue as number).toFixed(1)}`} fill="none" stroke={COLOR.ink3} strokeWidth={1.6} strokeDasharray="4,3" strokeLinecap="round" />
                <circle cx={W - PAD_R} cy={cy(projValue as number)} r={3} fill={color} opacity={0.7} />
                <text {...t(W - PAD_R, cy(projValue as number) - 6, COLOR.ink3, 'end', 700)}>{projValue}</text>
              </>
            )}

            <path d={linePath} fill="none" stroke={COLOR.ink2} strokeWidth={lineWidth} strokeLinecap="round" strokeLinejoin="round" />

            {hover && a !== b && (
              <>
                <path d={tailPath} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={lineWidth + 6} strokeLinecap="round" strokeLinejoin="round" />
                <path d={tailPath} fill="none" stroke={`url(#tl${gid})`} strokeWidth={lineWidth + 1} strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}
            {hover && <line x1={xs[active]} y1={PAD_T - 10} x2={xs[active]} y2={H - PAD_B} stroke={COLOR.ink3} strokeWidth={1} />}

            <circle cx={xs[active]} cy={ys[active]} r={hover ? 22 : 0} fill={color} opacity={0.12} />
            <circle cx={xs[active]} cy={ys[active]} r={5} fill={color} stroke={color} strokeOpacity={0.22} strokeWidth={6} />
            <circle cx={xs[active]} cy={ys[active]} r={5} fill={color} />
            <circle cx={xs[active]} cy={ys[active]} r={2} fill={COLOR.bg} />

            <text {...t(PAD_L, H - 6, COLOR.ink3, 'start', 500)}>{points[0].date}</text>
            <text {...t(PAD_L + dataW, H - 6, COLOR.ink3, 'end', 500)}>{points[n - 1].date}</text>
          </>
        )}
      </svg>

      {(footerLeft || footerRight) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 4, paddingRight: 4, marginTop: 8 }}>
          <span style={{ color: COLOR.ink3, fontSize: TYPE.caption, fontVariantNumeric: 'tabular-nums' }}>{footerLeft}</span>
          {footerRight ? <span style={{ color: COLOR.ink3, fontSize: TYPE.caption, fontVariantNumeric: 'tabular-nums' }}>{footerRight}</span> : null}
        </div>
      )}
    </div>
  )
}
