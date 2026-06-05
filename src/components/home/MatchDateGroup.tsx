import { dark } from '@/lib/colors'
import type { Match } from '@/app/home/types'
import { dateLabel, dayDotColor } from '@/app/home/helpers'
import MatchRow from './MatchRow'

const LIMIT = 3

export default function MatchDateGroup({ date, matches, expandKey, expandedDates, onToggle, isDot, C, isDark, now }: {
  date: string
  matches: Match[]
  expandKey: string
  expandedDates: Set<string>
  onToggle: (key: string) => void
  isDot: boolean
  C: typeof dark
  isDark: boolean
  now: number
}) {
  const isExpanded = expandedDates.has(expandKey)
  const visible    = isExpanded ? matches : matches.slice(0, LIMIT)
  const hidden     = matches.length - LIMIT

  return (
    <div style={{ marginBottom: 12, borderRadius: 14, border: '1px solid ' + C.border, overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
        borderBottom: '1px solid ' + C.border,
        background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)' }}>
        <div style={{ width: 6, height: 6, borderRadius: isDot ? '50%' : 2, background: dayDotColor(date), flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{dateLabel(date)}</span>
        <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 2 }}>· {matches.length} matcher</span>
      </div>
      {/* Rows */}
      {visible.map((m, i) => (
        <div key={m.id} style={{ borderTop: i > 0 ? '1px solid ' + C.border : 'none' }}>
          <MatchRow m={m} C={C} now={now} />
        </div>
      ))}
      {/* Expand */}
      {hidden > 0 && (
        <button onClick={() => onToggle(expandKey)}
          style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none',
            borderTop: '1px solid ' + C.border, cursor: 'pointer', fontSize: 11, fontWeight: 600,
            color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
          {isExpanded ? '↑ Visa färre' : `Visa alla ${matches.length} matcher ↓`}
        </button>
      )}
    </div>
  )
}
