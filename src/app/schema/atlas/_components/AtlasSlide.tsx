'use client'

import { useMemo } from 'react'
import { COLOR, FONT } from '@/lib/brand'
import { SeasonHeatmap } from '@/app/schema/_components/SeasonHeatmap'
import type { SeasonMonth } from '@/app/schema/_components/SeasonHeatmap'
import { busiestWeek } from '@/app/schema/_components/week'

type Props = {
  title:         string
  count:         number
  dates:         string[]
  months:        SeasonMonth[]
  accent?:       string
  /** Only the active slide + its immediate neighbors mount the real heatmap
   * — with ~115 divisions, mounting every slide's full month stack (each
   * with animated cells) at once is fine on desktop but overwhelms mobile
   * Safari/Chrome (WebKit), which was failing to load Atlas at all. */
  isActive:      boolean
  onCommitWeek:  (weekKey: string) => void
}

/** One Atlas carousel page — Sweden or a single division, full-bleed. */
export function AtlasSlide({ title, count, dates, months, accent, isActive, onCommitWeek }: Props) {
  const busiest = useMemo(() => busiestWeek(dates), [dates])

  return (
    <div style={{ flex: '0 0 100%', scrollSnapAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '4px 20px 10px', flexShrink: 0 }}>
        <div style={{ fontFamily: FONT.display, fontSize: 26, fontWeight: 900, color: accent ?? COLOR.ink, letterSpacing: -0.5 }}>
          {title}
        </div>
        <span style={{ fontSize: 12, color: COLOR.ink3 }}>
          {count} {count === 1 ? 'match' : 'matcher'} den här säsongen
          {busiest && busiest.count > 1 && ` · Tätast V.${busiest.isoWeek} (${busiest.count})`}
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {isActive && (
          <SeasonHeatmap dates={dates} months={months} accent={accent} onPreviewWeek={() => {}} onCommitWeek={onCommitWeek} />
        )}
      </div>
    </div>
  )
}
