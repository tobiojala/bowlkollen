'use client'

import { useState, useRef, useEffect } from 'react'
import { ShieldCheck, ChevronDown } from 'lucide-react'
import { useSetTeamRole, useRequestCaptain, useVerifiedTeamMembers, type TeamRole } from '@/lib/queries'
import { COLOR } from '@/lib/brand'

const ROLES: { value: TeamRole; label: string }[] = [
  { value: 'player',    label: 'Spelare'   },
  { value: 'captain',   label: 'Kapten'    },
  { value: 'lagledare', label: 'Lagledare' },
  { value: 'reserv',    label: 'Reserv'    },
]

export const roleLabel = (r: TeamRole) => ROLES.find(x => x.value === r)?.label ?? 'Spelare'

/** A verified member's own role — private (only they see it), self-chosen —
 * except 'Kapten', which is gated server-side (see set_team_role in
 * invite_scoped_claims.sql): it only succeeds if the slot is empty and this
 * claim is vouched (via a teammate or admin invite code). Everyone else who
 * tries gets steered to request/transfer instead of a silent failure. */
export function RolePicker({ bitsTeamId, role }: { bitsTeamId: number; role: TeamRole }) {
  const [open, setOpen]     = useState(false)
  const [notice, setNotice] = useState<{ kind: 'exists' | 'needs_request'; message: string } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const { mutate, isPending }        = useSetTeamRole(bitsTeamId)
  const { mutate: request, isPending: requesting } = useRequestCaptain(bitsTeamId)
  const { data: members }            = useVerifiedTeamMembers(bitsTeamId)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const isCaptain = role === 'captain'

  const pick = (value: TeamRole) => {
    setOpen(false)
    if (value === role) return
    setNotice(null)
    mutate(value, {
      onError: (err) => {
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('captain_exists_use_transfer')) {
          const captain = members?.find(m => m.role === 'captain')
          setNotice({
            kind: 'exists',
            message: captain ? `${captain.displayName} är redan kapten — be dem föra över rollen.` : 'Laget har redan en kapten.',
          })
        } else if (msg.includes('captain_needs_request')) {
          setNotice({ kind: 'needs_request', message: 'Den här platsen behöver ett godkännande innan du kan bli kapten.' })
        }
      },
    })
  }

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
        <ShieldCheck size={16} color={isCaptain ? COLOR.gold : COLOR.ink2} />
        {roleLabel(role)}
        <ChevronDown size={14} color={COLOR.ink3} />
      </button>
      {open && (
        <div role="menu" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 30,
          minWidth: 180, padding: 6,
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
              onClick={() => pick(r.value)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 12px', borderRadius: 8,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: r.value === role ? COLOR.gold : COLOR.ink, fontSize: 14, fontWeight: 600,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      {notice && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 30,
          width: 240, padding: 12, borderRadius: 12,
          background: COLOR.surface2, border: `1px solid ${COLOR.hairline}`,
          boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
        }}>
          <div style={{ fontSize: 13, color: COLOR.ink2, lineHeight: 1.45 }}>{notice.message}</div>
          {notice.kind === 'needs_request' && (
            <button
              onClick={() => { request(); setNotice(null) }}
              disabled={requesting}
              style={{
                marginTop: 8, padding: '7px 12px', borderRadius: 8, border: 'none',
                background: COLOR.gold, color: '#1a1400', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {requesting ? 'Skickar…' : 'Skicka förfrågan'}
            </button>
          )}
          <button
            onClick={() => setNotice(null)}
            style={{ display: 'block', marginTop: 8, background: 'none', border: 'none', color: COLOR.ink3, fontSize: 12, cursor: 'pointer', padding: 0 }}
          >
            Stäng
          </button>
        </div>
      )}
    </div>
  )
}
