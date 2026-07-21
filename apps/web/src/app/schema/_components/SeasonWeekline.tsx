'use client'

import { useRef, useState, useEffect } from 'react'
import { getISOWeek } from 'date-fns'
import { COLOR, FONT } from '@/lib/brand'

const PAD_T   = 40
const CH      = 100
const PAD_B   = 28
export const WEEKLINE_H = PAD_T + CH + PAD_B
const PAD_X   = 30
const BAR_GAP = 3
const PILL_W  = 116
const PILL_H  = 17
const LABEL_STEP_TARGET = 7   // roughly this many week labels across the chart, however many weeks there are

const MONTHS = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']
function fmtRange(startIso: string): string {
  const d = new Date(startIso + 'T12:00:00')
  const end = new Date(d); end.setDate(end.getDate() + 6)
  return `${d.getDate()}–${end.getDate()} ${MONTHS[end.getMonth()]}`
}

export interface ArcWeek {
  weekKey:   string   // ISO date of the Monday that starts this week
  count:     number
  hasLive:   boolean
}

interface Props {
  weeks:            ArcWeek[]
  currentWeek:      string | null
  activeWeek:       string | null
  onHairlineCommit: (weekKey: string) => void
}

/**
 * The "Pulse" hero — a row of bars, one per week, sized by match count, with
 * a count scale on the left and sparse week labels underneath. Deliberately
 * not a financial-style area chart (the previous SeasonArc): no curve, no
 * gradient fill — just a rhythm of bars you can drag across, closer to a
 * waveform than a ticker.
 */
export function SeasonWeekline({ weeks, currentWeek, activeWeek, onHairlineCommit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgW, setSvgW]               = useState(0)
  const [hlWeek, setHlWeek]           = useState<string>(currentWeek ?? weeks[0]?.weekKey ?? '')
  const [showTooltip, setShowTooltip] = useState(false)
  const isDragging   = useRef(false)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setSvgW(el.offsetWidth)
    const ro = new ResizeObserver(([e]) => setSvgW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!isDragging.current && activeWeek !== null) setHlWeek(activeWeek)
  }, [activeWeek])

  const ready    = weeks.length > 0 && svgW > 0
  const maxCnt   = ready ? Math.max(...weeks.map(w => w.count), 1) : 1
  const chartW   = svgW - PAD_X * 2
  const barW     = ready ? Math.max(2, chartW / weeks.length - BAR_GAP) : 0
  const baseY    = PAD_T + CH

  const weekX = (i: number) => PAD_X + (i / Math.max(weeks.length - 1, 1)) * (chartW - barW) + barW / 2
  const barH  = (c: number) => Math.max(3, (c / maxCnt) * CH)

  const hlIdx = Math.max(0, weeks.findIndex(w => w.weekKey === hlWeek))
  const hlX   = ready ? weekX(hlIdx) : svgW / 2

  const xToIdx = (cx: number, rect: DOMRect) => {
    const t = (cx - rect.left - PAD_X) / Math.max(chartW - barW, 1)
    return Math.round(Math.max(0, Math.min(weeks.length - 1, t * (weeks.length - 1))))
  }

  const openTooltip  = () => { if (tooltipTimer.current) clearTimeout(tooltipTimer.current); setShowTooltip(true) }
  const scheduleHide = () => { tooltipTimer.current = setTimeout(() => setShowTooltip(false), 1600) }

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ready) return
    isDragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    openTooltip()
    setHlWeek(weeks[xToIdx(e.clientX, e.currentTarget.getBoundingClientRect())].weekKey)
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    setHlWeek(weeks[xToIdx(e.clientX, e.currentTarget.getBoundingClientRect())].weekKey)
  }
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    isDragging.current = false
    const w = weeks[xToIdx(e.clientX, e.currentTarget.getBoundingClientRect())]
    setHlWeek(w.weekKey); onHairlineCommit(w.weekKey); scheduleHide()
  }

  const pillX  = svgW > 0 ? Math.max(PILL_W / 2 + PAD_X, Math.min(svgW - PILL_W / 2 - PAD_X, hlX)) : svgW / 2
  const labelX = svgW > 0 ? Math.max(PAD_X + 30, Math.min(svgW - PAD_X - 30, hlX)) : svgW / 2

  const halfCnt   = Math.round(maxCnt / 2)
  const labelStep = Math.max(1, Math.round(weeks.length / LABEL_STEP_TARGET))
  const currentIdx = currentWeek !== null ? weeks.findIndex(w => w.weekKey === currentWeek) : -1
  const weekLabelIndices = new Set<number>([
    ...weeks.map((_, i) => i).filter(i => i % labelStep === 0),
    ...(currentIdx >= 0 ? [currentIdx] : []),
  ])

  return (
    <div
      ref={containerRef}
      style={{ background: COLOR.bg, height: WEEKLINE_H, touchAction: 'none', cursor: ready ? 'col-resize' : 'default' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <svg width="100%" height={WEEKLINE_H} style={{ display: 'block', userSelect: 'none', pointerEvents: 'none' }}>
        {ready && (
          <>
            {/* Scale — faint reference lines + count labels, so bar height reads as an actual number */}
            <line x1={PAD_X} y1={PAD_T} x2={svgW - PAD_X} y2={PAD_T} stroke={COLOR.ink4} strokeWidth={0.5} strokeOpacity={0.4} />
            <text x={PAD_X - 8} y={PAD_T + 3} textAnchor="end" fontFamily={FONT.body} fontSize={10} fontWeight={600} fill={COLOR.ink4}>{maxCnt}</text>
            <line x1={PAD_X} y1={baseY - CH / 2} x2={svgW - PAD_X} y2={baseY - CH / 2} stroke={COLOR.ink4} strokeWidth={0.5} strokeOpacity={0.25} />
            <text x={PAD_X - 8} y={baseY - CH / 2 + 3} textAnchor="end" fontFamily={FONT.body} fontSize={10} fontWeight={600} fill={COLOR.ink4}>{halfCnt}</text>

            {/* Baseline */}
            <line x1={PAD_X} y1={baseY} x2={svgW - PAD_X} y2={baseY} stroke={COLOR.ink4} strokeWidth={0.5} />

            {/* Bars — one per week, past = gold, future = dim ink */}
            {weeks.map((w, i) => {
              const x = weekX(i)
              const h = barH(w.count)
              const isPast = currentWeek !== null && w.weekKey <= currentWeek
              const isHl   = w.weekKey === hlWeek
              return (
                <rect
                  key={w.weekKey}
                  x={x - barW / 2} y={baseY - h} width={barW} height={h} rx={1.5}
                  fill={isHl ? COLOR.gold : isPast ? COLOR.gold : COLOR.ink4}
                  fillOpacity={isHl ? 1 : isPast ? 0.55 : 0.35}
                />
              )
            })}

            {/* Live-week marker */}
            {weeks.filter(w => w.hasLive).map(w => {
              const i = weeks.indexOf(w)
              const x = weekX(i)
              return (
                <circle key={w.weekKey} cx={x} cy={baseY - barH(w.count) - 8} r={3} fill={COLOR.red}>
                  <animate attributeName="opacity" values="1;0.2;1" dur="1.3s" repeatCount="indefinite" />
                </circle>
              )
            })}

            {/* Hairline */}
            <line x1={hlX} y1={PAD_T + 6} x2={hlX} y2={baseY + 4} stroke={COLOR.gold} strokeWidth={0.9} strokeDasharray="3 3" strokeOpacity={0.55} />

            {/* Today tick */}
            {currentWeek && weeks.some(w => w.weekKey === currentWeek) && (
              <circle cx={weekX(weeks.findIndex(w => w.weekKey === currentWeek))} cy={baseY + 8} r={2} fill={COLOR.gold} />
            )}

            {/* Sparse week labels under the bars */}
            {[...weekLabelIndices].map(i => {
              const w = weeks[i]
              if (!w) return null
              const isCurrent = w.weekKey === currentWeek
              return (
                <text key={w.weekKey} x={weekX(i)} y={WEEKLINE_H - 9} textAnchor="middle"
                  fontFamily={FONT.body} fontSize={11} fontWeight={isCurrent ? 800 : 600}
                  fill={isCurrent ? COLOR.gold : COLOR.ink4}>
                  V.{getISOWeek(new Date(w.weekKey + 'T12:00:00'))}
                </text>
              )
            })}

            {/* Tooltip pill — follows hairline while dragging */}
            <g style={{ opacity: showTooltip ? 1 : 0, transition: 'opacity 0.2s ease', pointerEvents: 'none' }}>
              <rect
                x={pillX - PILL_W / 2} y={3} width={PILL_W} height={PILL_H} rx={PILL_H / 2}
                fill={COLOR.surface2} stroke={COLOR.gold} strokeWidth={0.5} strokeOpacity={0.55}
              />
              <text x={pillX} y={15} textAnchor="middle" fontFamily={FONT.body} fontSize={11} fontWeight={700}
                style={{ pointerEvents: 'none', userSelect: 'none' } as React.CSSProperties}>
                <tspan fill={COLOR.gold}>{weeks[hlIdx] ? fmtRange(weeks[hlIdx].weekKey) : ''}</tspan>
              </text>
            </g>

            {/* Static label — crossfades with tooltip */}
            <text x={labelX} y={16} textAnchor="middle" fontFamily={FONT.display} fontSize={11} fontWeight={800} letterSpacing={1.2}
              fill={COLOR.gold}
              style={{ opacity: showTooltip ? 0 : 1, transition: 'opacity 0.2s ease', pointerEvents: 'none', userSelect: 'none', textTransform: 'uppercase' } as React.CSSProperties}>
              {weeks[hlIdx] ? fmtRange(weeks[hlIdx].weekKey) : ''}
            </text>
          </>
        )}
      </svg>
    </div>
  )
}
