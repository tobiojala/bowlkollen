'use client'

import { Check, X, HelpCircle, type LucideIcon } from 'lucide-react'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import type { AvailabilityResponseValue, TeamAvailabilityRow } from '@/lib/queries'

const GROUPS: { key: AvailabilityResponseValue; label: string; icon: LucideIcon; color: string }[] = [
  { key: 'yes',   label: 'KAN SPELA', icon: Check,      color: COLOR.green },
  { key: 'maybe', label: 'KANSKE',    icon: HelpCircle, color: COLOR.gold  },
  { key: 'no',    label: 'KAN INTE',  icon: X,          color: COLOR.red   },
]

/** The team's collective answers, grouped and with a proportion bar. */
export function AvailabilitySummary({ responses }: { responses: TeamAvailabilityRow[] }) {
  if (responses.length === 0) return null
  const total = responses.length

  return (
    <div style={{ marginTop: SPACE[6] }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.ink2, marginBottom: SPACE[3] }}>
        LAGETS SVAR ({total})
      </div>

      <div style={{ height: 6, borderRadius: 3, background: COLOR.surface2, overflow: 'hidden', display: 'flex', marginBottom: SPACE[4] }}>
        {GROUPS.map(g => {
          const count = responses.filter(r => r.response === g.key).length
          return count > 0 ? <div key={g.key} style={{ width: `${(count / total) * 100}%`, background: g.color }} /> : null
        })}
      </div>

      {GROUPS.map(g => {
        const group = responses.filter(r => r.response === g.key)
        if (group.length === 0) return null
        return (
          <div key={g.key} style={{ marginBottom: SPACE[4] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: g.color, marginBottom: SPACE[2] }}>
              <g.icon size={13} /> {g.label} ({group.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[1] }}>
              {group.map(r => (
                <div key={r.userId} style={{
                  display: 'flex', alignItems: 'center', gap: SPACE[2],
                  padding: `${SPACE[2]}px ${SPACE[3]}px`, background: `${g.color}10`, borderRadius: RADIUS.md,
                }}>
                  <span style={{ fontSize: TYPE.body, fontWeight: 600, color: COLOR.ink, flex: 1 }}>
                    {r.displayName}
                    {!r.vouched && (
                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: COLOR.ink3, letterSpacing: '0.04em' }}>
                        OBEKRÄFTAD
                      </span>
                    )}
                  </span>
                  {r.note && <span style={{ fontSize: TYPE.caption, color: COLOR.ink3, fontStyle: 'italic' }}>{r.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
