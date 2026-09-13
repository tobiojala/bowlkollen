'use client'

import Link from 'next/link'
import { Lock, ArrowDownUp, HelpCircle, FileSignature } from 'lucide-react'
import { IdentityAvatar } from '@/components/IdentityAvatar'
import { COLOR, FONT, RADIUS, TYPE } from '@/lib/brand'
import type { EligibilityVerdict } from '@/lib/eligibility'

// The shared player card — the web twin of native's CandidateRow. One row treatment
// used everywhere a player is listed: the team roster (Trupp), the laguttagning
// picker, scouting. Avatar · name (+ eligibility badge) · availability pill · support
// lines · a right-hand headline stat OR a trailing control. Cardless (hairline
// separated) to match the list design language.

type Avail = 'yes' | 'maybe' | 'no'

const AVAIL: Record<Avail, { label: string; color: string }> = {
  yes:   { label: 'Kan spela', color: COLOR.green },
  maybe: { label: 'Kanske',    color: COLOR.gold  },
  no:    { label: 'Kan inte',  color: COLOR.red   },
}

// Eligibility (§ D 306) is shown WITHOUT colour — colour is reserved for availability.
// State reads via icon + label + fill (solid vs outline).
const ELIG = {
  blocked:    { label: 'SPÄRRAD',    Icon: Lock,        solid: true  },
  restricted: { label: 'NEDFLYTTAD', Icon: ArrowDownUp, solid: false },
  unknown:    { label: 'SPÄRR?',     Icon: HelpCircle,  solid: false },
} as const

export type PlayerRowProps = {
  name: string
  imageUrl?: string | null
  /** Right-hand headline number (e.g. snitt / fit). Omit for a trailing control instead. */
  stat?: { value: string | number | null; label: string }
  /** Supporting lines under the name (nulls filtered out). */
  sub?: (string | null | undefined)[]
  availability?: Avail | null
  /** Render the availability pill even when unanswered (shows "Ej svarat"). */
  showAvailability?: boolean
  eligibility?: EligibilityVerdict
  /** Here on a spelaravtal (contracted, primary club elsewhere) — shows an AVTAL chip. */
  agreement?: boolean
  disabled?: boolean
  href?: string
  onClick?: () => void
  /** Right-hand control (chevron, +) — used when there's no `stat`. */
  trailing?: React.ReactNode
}

export function PlayerRow({
  name, imageUrl, stat, sub, availability, showAvailability, eligibility, agreement, disabled, href, onClick, trailing,
}: PlayerRowProps) {
  const elig = eligibility && eligibility.state !== 'ok' ? ELIG[eligibility.state] : null
  const av = availability ? AVAIL[availability] : null
  const subs = (sub ?? []).filter(Boolean) as string[]

  const inner = (
    <>
      <IdentityAvatar name={name} size={44} imageUrl={imageUrl ?? null} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          {agreement && (
            <span title="Spelaravtal — kontrakterad från en annan klubb" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0, padding: '2px 7px', borderRadius: RADIUS.pill, border: `1px solid ${COLOR.ink4}`, background: COLOR.surface2 }}>
              <FileSignature size={12} color={COLOR.ink2} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.03em', color: COLOR.ink2 }}>AVTAL</span>
            </span>
          )}
          {elig && (
            <span title={eligibility?.reason} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0, padding: '2px 7px', borderRadius: RADIUS.pill, border: `1px solid ${elig.solid ? COLOR.ink : COLOR.ink4}`, background: elig.solid ? COLOR.ink : COLOR.surface2 }}>
              <elig.Icon size={12} color={elig.solid ? COLOR.bg : COLOR.ink2} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.03em', color: elig.solid ? COLOR.bg : COLOR.ink2 }}>{elig.label}</span>
            </span>
          )}
        </div>
        {(av || showAvailability) && (
          <span style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', gap: 5, padding: '4px 10px', borderRadius: RADIUS.pill, background: av ? av.color : 'transparent', border: av ? 'none' : `1px solid ${COLOR.ink4}` }}>
            <span style={{ fontSize: TYPE.caption, fontWeight: 700, color: av ? '#0b0d10' : COLOR.ink2 }}>{av ? av.label : 'Ej svarat'}</span>
          </span>
        )}
        {subs.map((s, i) => (
          <span key={i} style={{ fontSize: TYPE.caption, color: COLOR.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s}</span>
        ))}
      </div>
      {stat ? (
        <div style={{ width: 78, flexShrink: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: COLOR.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: FONT.score }}>{stat.value ?? '–'}</div>
          <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 3 }}>{stat.label}</div>
        </div>
      ) : trailing}
    </>
  )

  const base: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
    padding: '13px 0', borderBottom: `1px solid ${COLOR.hairline}`,
    background: 'none', border: 'none', borderBottomWidth: 1, textDecoration: 'none',
    opacity: disabled ? 0.4 : 1, WebkitTapHighlightColor: 'transparent',
    cursor: disabled ? 'default' : (href || onClick) ? 'pointer' : 'default',
  }

  if (href && !disabled) return <Link href={href} style={base}>{inner}</Link>
  if (onClick) return <button onClick={disabled ? undefined : onClick} disabled={disabled} style={base}>{inner}</button>
  return <div style={base}>{inner}</div>
}
