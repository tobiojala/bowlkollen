'use client'

import { useMemo, useRef, useState } from 'react'
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, getISOWeek } from 'date-fns'
import { motion } from 'framer-motion'
import { COLOR, FONT } from '@/lib/brand'
import { heatmapColor, heatmapLevel, buildHeatmapPalette } from './week'
import { PinGlyph } from './pin'

type Props = {
  year:          number
  month:         number   // 0-indexed, JS Date convention
  dates:         string[]
  accent?:       string
  /** The Atlas pin's date — draws the pin glyph on that day cell. */
  pinDate?:      string | null
  onPreviewWeek: (weekKey: string) => void
  onCommitWeek:  (weekKey: string) => void
}

const MONTH_LONG = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December']
const MONTH_SE   = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']
const DAY_LABELS = ['Mån','Tis','Ons','Tor','Fre','Lör','Sön']

const GAP = 6

const todayStr = format(new Date(), 'yyyy-MM-dd')

type WeekRow = { w: number; weekKey: string; weekStart: Date; month: number; days: Date[]; totalCount: number; isoWeek: number }
type ActiveRow = { w: number; weekKey: string }

function buildMonthWeeks(year: number, month: number, dates: string[]): { weeks: WeekRow[]; dataMap: Map<string, number>; maxCount: number } {
  const dataMap = new Map<string, number>()
  for (const d of dates) {
    const dk = d.slice(0, 10)
    dataMap.set(dk, (dataMap.get(dk) ?? 0) + 1)
  }
  const monthStart     = new Date(year, month, 1)
  const monthEnd       = new Date(year, month + 1, 0)
  const firstWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const lastWeekStart  = startOfWeek(monthEnd, { weekStartsOn: 1 })
  const numWeeks = Math.round((lastWeekStart.getTime() - firstWeekStart.getTime()) / (7 * 86400000)) + 1
  const weeks: WeekRow[] = Array.from({ length: numWeeks }, (_, w) => {
    const weekStart = addDays(firstWeekStart, w * 7)
    const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) })
    const totalCount = days.reduce((s, d) => s + (dataMap.get(format(d, 'yyyy-MM-dd')) ?? 0), 0)
    return {
      w, weekKey: format(weekStart, 'yyyy-MM-dd'), weekStart, month: weekStart.getMonth(),
      days, totalCount, isoWeek: getISOWeek(weekStart),
    }
  })
  const maxCount = Math.max(...weeks.map(w => w.totalCount), 1)
  return { weeks, dataMap, maxCount }
}

/** One month, full-size and already tappable — a "page" in the Atlas's
 * vertical peek-scroll (see SeasonHeatmap), not a separate zoomed-in view
 * reached by tapping a tile. No card chrome — sits directly on the
 * background, identity carried by the month name and the accent tint.
 * Cells are a true fluid grid (1fr columns), not fixed-px — they fill the
 * full width instead of leaving dead space on wider phones. */
export function MonthWeeks({ year, month, dates, accent, pinDate, onPreviewWeek, onCommitWeek }: Props) {
  const [active, setActive] = useState<ActiveRow | null>(null)
  const dragging  = useRef(false)

  const palette = useMemo(() => buildHeatmapPalette(accent), [accent])
  const { weeks, dataMap, maxCount } = buildMonthWeeks(year, month, dates)

  const rowAtPoint = (x: number, y: number): ActiveRow | null => {
    const el = document.elementFromPoint(x, y) as Element | null
    const node = el?.closest('[data-week-key]')
    if (!node) return null
    return { w: Number(node.getAttribute('data-w')), weekKey: node.getAttribute('data-week-key')! }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    const row = rowAtPoint(e.clientX, e.clientY)
    if (row) { setActive(row); onPreviewWeek(row.weekKey) }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const row = rowAtPoint(e.clientX, e.clientY)
    if (row && row.weekKey !== active?.weekKey) { setActive(row); onPreviewWeek(row.weekKey) }
  }

  const onPointerUp = () => {
    if (!dragging.current) return
    dragging.current = false
    if (active) onCommitWeek(active.weekKey)
    setActive(null)
  }

  const activeRow = active ? weeks[active.w] : null

  return (
    <div
      style={{ position: 'relative', padding: '4px 16px 24px', touchAction: 'pan-y', userSelect: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div style={{ fontFamily: FONT.display, fontSize: 28, fontWeight: 900, letterSpacing: -0.5, color: accent ?? COLOR.ink, padding: '4px 0 14px' }}>
        {MONTH_LONG[month]}
      </div>

      {/* Day-letter header — same 7-column grid as the rows, so letters land exactly above their column regardless of screen width */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: GAP, marginBottom: 8 }}>
        {DAY_LABELS.map((d, i) => {
          const isWeekend = i >= 5 // Lör, Sön
          return (
            <span key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: isWeekend ? 'rgba(245,194,0,0.6)' : COLOR.ink4 }}>
              {i % 2 === 0 ? d[0] : ''}
            </span>
          )
        })}
      </div>

      {/* Week rows — the whole row is the tap target, not the individual cell */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
        {weeks.map((week, w) => {
          // Only the rare boundary week (e.g. starts in August but the page is September)
          // gets a label — every other row belongs to this page's own month already
          // named in the big header above, so repeating it on every row would just be noise.
          const isBoundary = week.month !== month
          const isActiveRow = active?.w === w

          return (
            <div key={w} style={{ position: 'relative' }}>
              {isBoundary && (
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' as const, color: COLOR.ink4, marginBottom: 4 }}>
                  {MONTH_SE[week.month]}
                </div>
              )}

              <motion.div
                data-week-key={week.weekKey}
                data-w={String(w)}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: w * 0.03, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: GAP,
                  cursor: week.totalCount > 0 ? 'pointer' : 'default',
                }}
              >
                {week.days.map((day, j) => {
                  const dateStr  = format(day, 'yyyy-MM-dd')
                  const count    = dataMap.get(dateStr) ?? 0
                  const isFuture = dateStr > todayStr
                  const isToday  = dateStr === todayStr

                  return (
                    <div
                      key={j}
                      title={`${format(day, 'd MMM')}: ${count} matcher`}
                      style={{
                        position: 'relative',
                        aspectRatio: '1 / 1', width: '100%', borderRadius: 6,
                        backgroundColor: heatmapColor(count, maxCount, isFuture, palette),
                        opacity: isFuture ? 0.35 : 1,
                        outline: isToday ? `2px solid ${COLOR.gold}` : isActiveRow ? `1px solid ${COLOR.ink3}` : undefined,
                        outlineOffset: '1px',
                        animation: isToday ? 'bk-pulse-ring 2s infinite' : undefined,
                        transform: isActiveRow ? 'scale(1.1)' : 'scale(1)',
                        transition: 'transform 0.1s ease-out',
                        display: isToday ? 'flex' : undefined,
                        alignItems: isToday ? 'center' : undefined,
                        justifyContent: isToday ? 'center' : undefined,
                      }}
                    >
                      {isToday && (
                        <span style={{ fontSize: 9, fontWeight: 800, color: heatmapLevel(count, maxCount, isFuture) >= 3 ? '#1a1400' : COLOR.ink }}>
                          {format(day, 'd')}
                        </span>
                      )}
                      {dateStr === pinDate && (
                        <div style={{ position: 'absolute', left: '50%', bottom: '40%',
                          transform: 'translateX(-50%)', zIndex: 3, pointerEvents: 'none' }}>
                          <PinGlyph size={15} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </motion.div>

              {isActiveRow && activeRow && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 10,
                  background: COLOR.surface2, borderRadius: 8, padding: '5px 10px',
                  fontSize: 11, fontWeight: 700, color: COLOR.ink, whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                }}>
                  V.{activeRow.isoWeek} — {format(activeRow.weekStart, 'd')} {MONTH_SE[activeRow.month]} ({activeRow.totalCount} matcher)
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes bk-pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(245,194,0,0.55); }
          70%  { box-shadow: 0 0 0 5px rgba(245,194,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,194,0,0); }
        }
      `}</style>
    </div>
  )
}
