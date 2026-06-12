import type { Theme } from '@/lib/theme'
import type { Match } from '@/lib/types'
import { dateLabel, dayDotColor } from '@/lib/utils'
import MatchRow from './MatchRow'

const LIMIT = 3

function Chevron({ up }: { up: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      style={{ transition: 'transform 220ms ease', transform: up ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
    >
      <path d="M2 4.5L6 8L10 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function MatchDateGroup({ date, matches, expandKey, expandedDates, onToggle, isDot, C, isDark, now }: {
  date: string
  matches: Match[]
  expandKey: string
  expandedDates: Set<string>
  onToggle: (key: string) => void
  isDot: boolean
  C: Theme
  isDark: boolean
  now: number
}) {
  const isExpanded = expandedDates.has(expandKey)
  const visible    = isExpanded ? matches : matches.slice(0, LIMIT)
  const hidden     = matches.length - LIMIT

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Floating date label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 2px 8px' }}>
        <div style={{
          width: 7, height: 7, borderRadius: isDot ? '50%' : 2,
          background: dayDotColor(date), flexShrink: 0,
        }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: C.text }}>
          {dateLabel(date)}
        </span>
        <span style={{ fontSize: 10, color: C.muted }}>· {matches.length} matcher</span>
      </div>

      {/* Card stack with stagger entrance */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visible.map((m, i) => (
          <div key={m.id} className="match-card-in" style={{ animationDelay: `${i * 45}ms` }}>
            <MatchRow m={m} now={now} />
          </div>
        ))}
      </div>

      {/* Expand / collapse */}
      {hidden > 0 && (
        <button
          onClick={() => onToggle(expandKey)}
          style={{
            width: '100%', marginTop: 6,
            padding: '9px 14px',
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
            border: `1px solid ${C.border}`, borderRadius: 10,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 11, fontWeight: 600, color: C.muted,
            transition: 'background 150ms',
            WebkitTapHighlightColor: 'transparent',
          } as React.CSSProperties}
        >
          <Chevron up={isExpanded} />
          {isExpanded ? 'Visa färre' : `Visa ${hidden} till`}
        </button>
      )}
    </div>
  )
}
