'use client'

import { COLOR, FONT } from '@/lib/brand'
import { SERIE_BAR, serieBarHeight, serieBarLevel, type SerieBarLevel } from '@bowlkollen/core'

const LABEL_MAX = 12   // hide per-bar labels beyond this many games

// Canonical serie graph — ONE bar language for every card that graphs a series
// (home feed, matchlogg, story cards). Absolute heights (comparable across cards)
// and colour tiers live in @bowlkollen/core so web + native can't drift. Gold is
// reserved for a genuine high game (>= 250) to keep the gold budget tight.
export function SerieBars({ series, showLabels = true }: { series: number[]; showLabels?: boolean }) {
  if (series.length === 0) return null
  const n = series.length
  const labels = showLabels && n <= LABEL_MAX
  const gap = n > 8 ? 5 : 8

  const barBg = (lvl: SerieBarLevel) =>
    lvl === 'gold'   ? `linear-gradient(180deg, ${COLOR.gold}, rgba(245,194,0,0.4))`
    : lvl === 'strong' ? COLOR.ink2
    : lvl === 'mid'    ? COLOR.ink3
    :                    COLOR.ink4

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap }}>
      {series.map((g, i) => {
        const lvl  = serieBarLevel(g)
        const gold = lvl === 'gold'
        return (
          <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 7 }}>
            <div style={{ height: SERIE_BAR.H, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ height: serieBarHeight(g), borderRadius: '4px 4px 0 0', background: barBg(lvl),
                boxShadow: gold ? '0 0 10px rgba(245,194,0,0.28)' : 'none' }} />
            </div>
            {labels && <span style={{ textAlign: 'center', color: gold ? COLOR.gold : COLOR.ink2, fontSize: 13, fontFamily: FONT.score, fontVariantNumeric: 'tabular-nums' }}>{g}</span>}
          </div>
        )
      })}
    </div>
  )
}
