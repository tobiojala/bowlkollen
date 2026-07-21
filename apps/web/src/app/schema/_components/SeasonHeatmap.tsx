'use client'

import { useEffect, useRef } from 'react'
import { MonthWeeks } from './MonthWeeks'

export type SeasonMonth = { year: number; month: number }

type Props = {
  /** Match dates, one entry per match (duplicates expected — that's the count) */
  dates:         string[]
  /** The season's month range, shared across every Atlas slide so they all render the same canvas */
  months:        SeasonMonth[]
  /** This slide's own brand hex (a division's tier color) — tints the whole
   * grid so each slide reads as its own identity, not always gold. */
  accent?:       string
  /** Land on this month instead of the current one — set when descending
   * from the year altitude or flying to the pin. Bump nonce to re-land. */
  focus?:        { year: number; month: number; nonce: number } | null
  /** The Atlas pin's date — rendered by MonthWeeks on its day cell. */
  pinDate?:      string | null
  onPreviewWeek: (weekKey: string) => void
  onCommitWeek:  (weekKey: string) => void
}

const PEEK_H = 64
const now = new Date()

/** Atlas heatmap — a vertical, snap-scrolling stack of months. Each month is
 * already full-size and tappable (no separate zoom step), with the next
 * month peeking in at the bottom edge as the scroll-forward cue — the same
 * "page + peek" pattern Stories/Wrapped use, not a grid of overview cards.
 * Lands on the current month so "now" never needs scrolling to find. */
export function SeasonHeatmap({ dates, months, accent, focus, pinDate, onPreviewWeek, onCommitWeek }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || months.length === 0) return
    const target = focus ?? { year: now.getFullYear(), month: now.getMonth() }
    const idx = months.findIndex(m => m.year === target.year && m.month === target.month)
    const child = el.children[idx >= 0 ? idx : 0] as HTMLElement | undefined
    if (child) el.scrollTop = child.offsetTop
  }, [months, focus])

  return (
    <div
      ref={scrollRef}
      style={{ height: '100%', overflowY: 'auto', scrollSnapType: 'y mandatory', scrollbarWidth: 'none' } as React.CSSProperties}
    >
      {months.map(m => (
        <div key={`${m.year}-${m.month}`} style={{ height: `calc(100% - ${PEEK_H}px)`, scrollSnapAlign: 'start' }}>
          <MonthWeeks
            year={m.year}
            month={m.month}
            dates={dates}
            accent={accent}
            pinDate={pinDate}
            onPreviewWeek={onPreviewWeek}
            onCommitWeek={onCommitWeek}
          />
        </div>
      ))}
    </div>
  )
}
