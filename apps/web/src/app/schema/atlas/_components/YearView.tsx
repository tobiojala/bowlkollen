'use client'

import { useEffect, useMemo, useRef } from 'react'
import { format } from 'date-fns'
import { COLOR, FONT } from '@/lib/brand'
import { heatmapColor, buildHeatmapPalette } from '@/app/schema/_components/week'
import { PinGlyph } from '@/app/schema/_components/pin'
import type { SeasonMonth } from '@/app/schema/_components/SeasonHeatmap'

type Props = {
  months:        SeasonMonth[]
  dates:         string[]
  accent?:       string
  pinDate:       string | null
  onSelectMonth: (m: SeasonMonth) => void
}

const MONTH_SE = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

const todayStr = new Date().toISOString().slice(0, 10)

/** The "År" altitude — the whole season at once, every month as a small
 * calendar grid. Same cells, same palette as the month pages (MonthWeeks),
 * just further away: zooming between the two altitudes keeps the terrain
 * recognizable. Tap a month (or pinch out over it) to descend into it. */
export function YearView({ months, dates, accent, pinDate, onSelectMonth }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const palette = useMemo(() => buildHeatmapPalette(accent), [accent])

  const { dataMap, maxCount } = useMemo(() => {
    const dataMap = new Map<string, number>()
    for (const d of dates) {
      const dk = d.slice(0, 10)
      dataMap.set(dk, (dataMap.get(dk) ?? 0) + 1)
    }
    // Day-level max — same normalization MonthWeeks uses per week row, but
    // across the whole season so the year reads as one surface.
    const maxCount = Math.max(...dataMap.values(), 1)
    return { dataMap, maxCount }
  }, [dates])

  // Land with the current month in view, same as SeasonHeatmap does.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || months.length === 0) return
    const now = new Date()
    const idx = months.findIndex(m => m.year === now.getFullYear() && m.month === now.getMonth())
    if (idx < 0) return
    const child = el.querySelector<HTMLElement>(`[data-ym="${months[idx].year}-${months[idx].month}"]`)
    if (child) el.scrollTop = Math.max(0, child.offsetTop - 8)
  }, [months])

  return (
    <div ref={scrollRef} style={{ height: '100%', overflowY: 'auto', padding: '4px 16px 80px',
      scrollbarWidth: 'none' } as React.CSSProperties}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px 16px' }}>
        {months.map(m => {
          const monthStart = new Date(m.year, m.month, 1)
          const dim = new Date(m.year, m.month + 1, 0).getDate()
          const off = (monthStart.getDay() + 6) % 7 // Mon-first offset
          const isCurrent = todayStr.slice(0, 7) === format(monthStart, 'yyyy-MM')

          return (
            <button key={`${m.year}-${m.month}`} data-ym={`${m.year}-${m.month}`}
              onClick={() => onSelectMonth(m)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6,
                WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
              <span style={{ fontFamily: FONT.display, fontSize: 15, fontWeight: 800,
                letterSpacing: -0.2,
                color: isCurrent ? COLOR.gold : (accent ?? COLOR.ink2) }}>
                {MONTH_SE[m.month]} <span style={{ fontWeight: 500, color: COLOR.ink4 }}>{String(m.year).slice(2)}</span>
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, width: '100%' }}>
                {Array.from({ length: off + dim }, (_, slot) => {
                  const dayNum = slot - off + 1
                  if (dayNum < 1) return <div key={slot} />
                  const dateStr = `${m.year}-${String(m.month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                  const count    = dataMap.get(dateStr) ?? 0
                  const isFuture = dateStr > todayStr
                  const isToday  = dateStr === todayStr
                  const isPin    = dateStr === pinDate
                  return (
                    <div key={slot} style={{ position: 'relative', aspectRatio: '1 / 1',
                      borderRadius: 2.5,
                      backgroundColor: heatmapColor(count, maxCount, isFuture, palette),
                      opacity: isFuture ? 0.35 : 1,
                      outline: isToday ? `1.5px solid ${COLOR.gold}` : undefined,
                      outlineOffset: 0.5 }}>
                      {isPin && (
                        <div style={{ position: 'absolute', left: '50%', bottom: '35%',
                          transform: 'translateX(-50%)', zIndex: 2, pointerEvents: 'none' }}>
                          <PinGlyph size={11} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
