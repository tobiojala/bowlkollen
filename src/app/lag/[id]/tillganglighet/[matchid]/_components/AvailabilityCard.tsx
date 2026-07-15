'use client'

import { useState } from 'react'
import { Check, X, HelpCircle, type LucideIcon } from 'lucide-react'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { useSubmitAvailability, type AvailabilityResponseValue, type TeamAvailabilityRow } from '@/lib/queries'

const RESPONSES: { key: AvailabilityResponseValue; label: string; icon: LucideIcon; color: string }[] = [
  { key: 'yes',   label: 'Ja, jag kan spela', icon: Check,      color: COLOR.green },
  { key: 'maybe', label: 'Kanske',            icon: HelpCircle, color: COLOR.gold  },
  { key: 'no',    label: 'Nej, kan inte',     icon: X,          color: COLOR.red   },
]

type Props = {
  bitsTeamId:  number
  bitsMatchId: number
  mine:        TeamAvailabilityRow | null
}

/** "Kan du spela?" — the responder's own answer, with an optional note. */
export function AvailabilityCard({ bitsTeamId, bitsMatchId, mine }: Props) {
  const { mutate, isPending } = useSubmitAvailability(bitsTeamId, bitsMatchId)
  const [note, setNote]         = useState(mine?.note ?? '')
  const [showNote, setShowNote] = useState(false)

  const respond = (response: AvailabilityResponseValue) => {
    mutate({ response, note: note || undefined })
    setShowNote(false)
  }

  return (
    <div style={{ background: COLOR.surface, borderRadius: RADIUS.lg, padding: SPACE[4] }}>
      <div style={{ fontSize: TYPE.title, fontWeight: 900, color: COLOR.ink, marginBottom: SPACE[3] }}>
        Kan du spela?
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
        {RESPONSES.map(r => {
          const active = mine?.response === r.key
          return (
            <button
              key={r.key}
              onClick={() => respond(r.key)}
              disabled={isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: SPACE[3],
                padding: `${SPACE[3]}px ${SPACE[4]}px`, borderRadius: RADIUS.md,
                background: active ? `${r.color}22` : COLOR.surface2,
                border: `2px solid ${active ? r.color : 'transparent'}`,
                cursor: isPending ? 'default' : 'pointer', textAlign: 'left',
                opacity: isPending ? 0.6 : 1, WebkitTapHighlightColor: 'transparent',
              }}
            >
              <r.icon size={20} color={r.color} />
              <span style={{ fontSize: TYPE.body, fontWeight: 700, color: active ? r.color : COLOR.ink }}>
                {r.label}
              </span>
            </button>
          )
        })}
      </div>

      {mine && (
        <div style={{ marginTop: SPACE[3] }}>
          {showNote ? (
            <div>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Kommentar (valfritt)"
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box', padding: `${SPACE[2]}px ${SPACE[3]}px`,
                  borderRadius: RADIUS.md, background: COLOR.bg, border: `1px solid ${COLOR.hairline}`,
                  color: COLOR.ink, fontSize: TYPE.body, outline: 'none',
                }}
              />
              <button
                onClick={() => respond(mine.response)}
                disabled={isPending}
                style={{
                  marginTop: SPACE[2], padding: `${SPACE[2]}px ${SPACE[3]}px`, borderRadius: RADIUS.md,
                  background: COLOR.gold, border: 'none', color: '#1a1400', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Spara kommentar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNote(true)}
              style={{ background: 'none', border: 'none', color: COLOR.ink3, fontSize: TYPE.caption, cursor: 'pointer', padding: 0 }}
            >
              {mine.note ? `"${mine.note}" · ändra` : '+ Lägg till kommentar'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
