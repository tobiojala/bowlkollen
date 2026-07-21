'use client'

import { COLOR } from '@/lib/brand'
import { SeasonWeekline } from './SeasonWeekline'
import type { ArcWeek } from './SeasonWeekline'

const NAV_H = 56

type Props = {
  weeks:            ArcWeek[]
  currentWeek:      string | null
  activeWeek:       string | null
  title:            string
  onHairlineCommit: (weekKey: string) => void
  onClose:          () => void
}

/** Puls recalled as a peek overlay once you've scrolled past the hero — the
 * feed underneath never moves, so closing this returns you to exactly where
 * you were. Triggered from the top nav's SchemaNavRecall. */
export function PulsPeekOverlay({ weeks, currentWeek, activeWeek, title, onHairlineCommit, onClose }: Props) {
  return (
    <div style={{
      position: 'absolute', top: NAV_H, left: 0, right: 0, zIndex: 50,
      background: COLOR.bg, display: 'flex', flexDirection: 'column',
      borderRadius: '0 0 20px 20px', boxShadow: '0 16px 32px rgba(0,0,0,0.4)', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 0', flexShrink: 0 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: COLOR.ink4 }} />
      </div>

      <div style={{ padding: '8px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase' as const, color: COLOR.ink4 }}>
          {title}
        </span>
        <button
          onClick={onClose}
          aria-label="Stäng"
          style={{
            background: COLOR.surface2, border: 'none', borderRadius: 100, padding: '6px 14px',
            fontSize: 11, fontWeight: 700, color: COLOR.ink, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          } as React.CSSProperties}
        >
          ✕
        </button>
      </div>

      <SeasonWeekline
        weeks={weeks}
        currentWeek={currentWeek}
        activeWeek={activeWeek}
        onHairlineCommit={(weekKey) => { onHairlineCommit(weekKey); onClose() }}
      />
    </div>
  )
}
