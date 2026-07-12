'use client'

import { useState, useRef, useEffect } from 'react'
import { ShieldCheck, ChevronDown } from 'lucide-react'
import { useSetTeamRole, type TeamRole } from '@/lib/queries'
import { COLOR } from '@/lib/brand'

const ROLES: { value: TeamRole; label: string }[] = [
  { value: 'player',    label: 'Spelare'   },
  { value: 'captain',   label: 'Kapten'    },
  { value: 'lagledare', label: 'Lagledare' },
  { value: 'reserv',    label: 'Reserv'    },
]

export const roleLabel = (r: TeamRole) => ROLES.find(x => x.value === r)?.label ?? 'Spelare'

/** A verified member's own role — private (only they see it), self-chosen.
 * 'Kapten' is what unlocks lineup/admin tools. */
export function RolePicker({ bitsTeamId, role }: { bitsTeamId: number; role: TeamRole }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { mutate, isPending } = useSetTeamRole(bitsTeamId)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const isCaptain = role === 'captain'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isPending}
        aria-haspopup="menu" aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 2px', background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 600, color: isCaptain ? COLOR.gold : COLOR.ink2,
          WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap',
          opacity: isPending ? 0.6 : 1,
        }}
      >
        <ShieldCheck size={16} strokeWidth={2} color={isCaptain ? COLOR.gold : COLOR.ink2} />
        {roleLabel(role)}
        <ChevronDown size={14} color={COLOR.ink3} />
      </button>
      {open && (
        <div role="menu" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 30,
          minWidth: 160, padding: 6,
          background: COLOR.surface2, border: `1px solid ${COLOR.hairline}`,
          borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: COLOR.ink3, padding: '6px 12px 4px' }}>
            DIN ROLL — SYNS BARA FÖR DIG
          </div>
          {ROLES.map(r => (
            <button
              key={r.value}
              role="menuitem"
              onClick={() => { setOpen(false); if (r.value !== role) mutate(r.value) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 12px', borderRadius: 8,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: r.value === role ? COLOR.gold : COLOR.ink, fontSize: 14, fontWeight: 600,
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = COLOR.surface)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
