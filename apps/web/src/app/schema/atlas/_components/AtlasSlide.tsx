'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { COLOR, FONT } from '@/lib/brand'
import { SeasonHeatmap } from '@/app/schema/_components/SeasonHeatmap'
import type { SeasonMonth } from '@/app/schema/_components/SeasonHeatmap'
import { busiestWeek } from '@/app/schema/_components/week'
import { YearView } from './YearView'
import { ZoomConductor } from './ZoomConductor'

export type Altitude = 'month' | 'year'

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
  /** Shared across slides — the zoom altitude is a property of the camera,
   * not of any one division, so swiping keeps your height. */
  altitude:      Altitude
  onAltitude:    (a: Altitude) => void
  /** Pinch-in at the year altitude keeps ascending — into the Karta. */
  onExitToMap:   () => void
  pinDate:       string | null
  /** Bumped by the header's pin chip — land the month view on the pin. */
  flyToPinNonce: number
  onCommitWeek:  (weekKey: string) => void
}

/** One Atlas carousel page — Sweden or a single division, full-bleed.
 * Hosts two altitudes of the same terrain: the month pages (SeasonHeatmap)
 * and the whole season at once (YearView), connected by continuous pinch. */
export function AtlasSlide({
  title, count, dates, months, accent, isActive,
  altitude, onAltitude, onExitToMap, pinDate, flyToPinNonce, onCommitWeek,
}: Props) {
  const busiest = useMemo(() => busiestWeek(dates), [dates])
  const [focus, setFocus] = useState<{ year: number; month: number; nonce: number } | null>(null)

  // Header pin chip pressed → land the month altitude on the pin's month.
  const pinFocus = useMemo(() => {
    if (flyToPinNonce === 0 || !pinDate) return null
    return { year: +pinDate.slice(0, 4), month: +pinDate.slice(5, 7) - 1, nonce: flyToPinNonce }
  }, [flyToPinNonce, pinDate])
  const effectiveFocus = pinFocus && (!focus || pinFocus.nonce > focus.nonce) ? pinFocus : focus

  const descendToMonth = (m: SeasonMonth) => {
    setFocus(f => ({ year: m.year, month: m.month, nonce: Math.max(f?.nonce ?? 0, flyToPinNonce) + 1 }))
    onAltitude('month')
  }

  // Pinch-out over the year view → descend into the month under the fingers.
  const zoomInAtPoint = (clientX: number, clientY: number) => {
    if (altitude !== 'year') return
    const el = document.elementFromPoint(clientX, clientY)
    const node = el?.closest('[data-ym]')
    if (!node) return
    const [y, m] = node.getAttribute('data-ym')!.split('-').map(Number)
    descendToMonth({ year: y, month: m })
  }

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
          <ZoomConductor
            onZoomOut={() => (altitude === 'month' ? onAltitude('year') : onExitToMap())}
            onZoomInAt={altitude === 'year' ? zoomInAtPoint : undefined}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {altitude === 'month' ? (
                <motion.div key="month" style={{ height: '100%' }}
                  initial={{ opacity: 0, scale: 1.25 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.25 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
                  <SeasonHeatmap
                    dates={dates} months={months} accent={accent}
                    focus={effectiveFocus} pinDate={pinDate}
                    onPreviewWeek={() => {}} onCommitWeek={onCommitWeek}
                  />
                </motion.div>
              ) : (
                <motion.div key="year" style={{ height: '100%' }}
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
                  <YearView
                    months={months} dates={dates} accent={accent}
                    pinDate={pinDate} onSelectMonth={descendToMonth}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </ZoomConductor>
        )}
      </div>
    </div>
  )
}
