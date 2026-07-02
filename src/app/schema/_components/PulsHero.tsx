'use client'

import { Map } from 'lucide-react'
import { COLOR } from '@/lib/brand'
import { SeasonWeekline, WEEKLINE_H } from './SeasonWeekline'
import type { ArcWeek } from './SeasonWeekline'

export const PULS_HERO_H = WEEKLINE_H + 44

type Props = {
  title:            string
  weeks:            ArcWeek[]
  currentWeek:      string | null
  activeWeek:       string | null
  onHairlineCommit: (weekKey: string) => void
  onOpenAtlas:      () => void
}

/** The first thing you see on Schema — Puls as a hero, not a sparkline buried
 * above a list. Atlas lives on its own page now (pinch, or this icon for
 * non-touch devices — never gesture-only, see project_schema_zoom_levels). */
export function PulsHero({ title, weeks, currentWeek, activeWeek, onHairlineCommit, onOpenAtlas }: Props) {
  return (
    <div style={{ height: PULS_HERO_H, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase' as const, color: COLOR.ink4 }}>
          {title}
        </span>
        <button
          onClick={onOpenAtlas}
          aria-label="Öppna atlas"
          style={{
            background: COLOR.surface2, border: 'none', borderRadius: 100, padding: '6px 14px',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 700, color: COLOR.ink, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          } as React.CSSProperties}
        >
          <Map size={13} strokeWidth={2.25} />
          Atlas
        </button>
      </div>
      <SeasonWeekline
        weeks={weeks}
        currentWeek={currentWeek}
        activeWeek={activeWeek}
        onHairlineCommit={onHairlineCommit}
      />
    </div>
  )
}
