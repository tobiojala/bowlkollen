'use client'

import { AlertTriangle } from 'lucide-react'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'

// § D 306 lineup warnings — surfaces spärr/farm-team violations so a captain
// never publishes a lineup that could forfeit the match. `issues` comes from the
// shared core engine (lineupEligibilityIssues). Ink text + warning icon; red only
// as an accent, never the sole carrier of meaning (senior-legibility rule).
export function EligibilityBanner({ issues }: { issues: string[] }) {
  if (issues.length === 0) return null
  return (
    <div
      role="alert"
      style={{
        marginTop: SPACE[4], padding: `${SPACE[3]}px ${SPACE[4]}px`,
        background: 'rgba(224,85,85,0.10)', border: `1px solid rgba(224,85,85,0.35)`,
        borderRadius: RADIUS.lg, display: 'flex', gap: SPACE[3],
      }}
    >
      <AlertTriangle size={20} color={COLOR.red} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <div style={{ fontSize: TYPE.caption, fontWeight: 800, color: COLOR.ink, marginBottom: 4, letterSpacing: '0.02em' }}>
          Spärrkontroll (§ D 306)
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {issues.map((issue, i) => (
            <li key={i} style={{ fontSize: TYPE.body, color: COLOR.ink2, lineHeight: 1.4 }}>
              {issue}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
