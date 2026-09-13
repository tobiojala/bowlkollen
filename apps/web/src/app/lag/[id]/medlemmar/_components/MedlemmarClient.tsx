'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Users, UserPlus, ChevronRight, Check, X } from 'lucide-react'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import {
  useSession, useTeamClaim, useVerifiedTeamMembers, useSetMemberRole, useCreateTeamInviteCode,
  type TeamRole, type VerifiedTeamMember,
} from '@/lib/queries'
import { useBitsTeamName } from '@/lib/team-stats-data'

const ROLES: { value: TeamRole; label: string }[] = [
  { value: 'player',    label: 'Spelare'   },
  { value: 'captain',   label: 'Kapten'    },
  { value: 'lagledare', label: 'Lagledare' },
  { value: 'reserv',    label: 'Reserv'    },
]
const roleLabel = (r: TeamRole) => ROLES.find(x => x.value === r)?.label ?? 'Spelare'
const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export default function MedlemmarClient({ teamId }: { teamId: number }) {
  const router = useRouter()
  const { data: session, isLoading } = useSession()
  const { data: claim } = useTeamClaim(teamId)
  const { data: members = [] } = useVerifiedTeamMembers(teamId)
  const { data: teamName } = useBitsTeamName(teamId)
  const { mutate: setRole, isPending: savingRole } = useSetMemberRole(teamId)
  const { mutate: createInvite, isPending: inviting } = useCreateTeamInviteCode(teamId)

  const [editing, setEditing] = useState<VerifiedTeamMember | null>(null)
  const [error, setError]     = useState<string | null>(null)

  if (!isLoading && !session) { if (typeof window !== 'undefined') window.location.href = '/login'; return null }

  const isMember  = claim?.status === 'verified'
  const isCaptain = isMember && claim.role === 'captain'

  const invite = () => createInvite(undefined, {
    onSuccess: code => {
      const url = `${location.origin}/invite/${code}`
      if (typeof navigator !== 'undefined' && navigator.share) navigator.share({ title: `Gå med i ${teamName ?? 'laget'}`, url }).catch(() => {})
      else navigator.clipboard?.writeText(url).catch(() => {})
    },
  })

  const assign = (role: TeamRole) => {
    if (!editing) return
    const target = editing
    setEditing(null); setError(null)
    setRole({ userId: target.userId, role }, {
      onError: (e) => {
        const msg = (e as { message?: string })?.message ?? ''
        setError(msg.includes('last_captain') ? 'Laget måste ha minst en kapten.'
          : msg.includes('not_captain') ? 'Bara kaptener kan ändra roller.'
          : 'Gick inte att ändra — försök igen.')
      },
    })
  }

  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: SPACE[3], width: '100%',
    padding: `${SPACE[3]}px 0`, borderBottom: `1px solid ${COLOR.hairline}`,
    background: 'none', border: 'none', borderBottomWidth: 1, textAlign: 'left',
  }

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 20px 96px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button onClick={() => router.push(`/lag/${teamId}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: COLOR.ink2, fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: '4px 0', alignSelf: 'flex-start' }}>
          <ChevronLeft size={20} /> Laget
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={22} color={COLOR.gold} />
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.4, margin: 0 }}>Medlemmar</h1>
        </div>

        {!isMember ? (
          <p style={{ color: COLOR.ink3, fontSize: TYPE.body, padding: `${SPACE[8]}px 0`, textAlign: 'center' }}>
            Bara verifierade lagmedlemmar ser medlemslistan.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: COLOR.ink3 }}>
                MEDLEMMAR{members.length > 0 ? ` · ${members.length}` : ''}
              </span>
              <button onClick={invite} disabled={inviting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: inviting ? 'default' : 'pointer', color: COLOR.gold, fontSize: 14, fontWeight: 700 }}>
                <UserPlus size={16} /> Bjud in
              </button>
            </div>

            {error && <p style={{ color: COLOR.red, fontSize: TYPE.caption, margin: 0 }}>{error}</p>}

            <div>
              {members.map(m => {
                const me = m.userId === session?.user?.id
                const inner = (
                  <>
                    <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 20, background: COLOR.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: COLOR.ink2 }}>{initials(m.displayName)}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: TYPE.body, fontWeight: 600, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.displayName}{me ? ' (du)' : ''}</span>
                      <span style={{ display: 'block', fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 1 }}>{roleLabel(m.role)}</span>
                    </span>
                    {isCaptain ? <ChevronRight size={18} color={COLOR.ink4} />
                      : m.role === 'captain' && <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: COLOR.gold }}>KAPTEN</span>}
                  </>
                )
                return isCaptain
                  ? <button key={m.userId} onClick={() => { setError(null); setEditing(m) }} style={{ ...row, cursor: 'pointer' }}>{inner}</button>
                  : m.publicId
                    ? <button key={m.userId} onClick={() => router.push(`/players/${m.publicId}`)} style={{ ...row, cursor: 'pointer' }}>{inner}</button>
                    : <div key={m.userId} style={row}>{inner}</div>
              })}
              {members.length === 0 && <p style={{ color: COLOR.ink3, fontSize: TYPE.caption, padding: `${SPACE[3]}px 0` }}>Inga medlemmar har gått med än. Bjud in laget!</p>}
            </div>
          </>
        )}
      </div>

      {/* Role picker — captains only */}
      {editing && (
        <>
          <div onClick={() => setEditing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 'max(0px, calc(50vw - 300px))', right: 'max(0px, calc(50vw - 300px))', zIndex: 61, background: COLOR.surface, borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`, boxShadow: '0 -12px 48px rgba(0,0,0,0.5)', padding: `${SPACE[4]}px` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[3] }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: COLOR.ink }}>{editing.displayName}</span>
              <button onClick={() => setEditing(null)} aria-label="Stäng" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><X size={20} color={COLOR.ink3} /></button>
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: COLOR.ink3, marginBottom: SPACE[2] }}>VÄLJ ROLL</div>
            {ROLES.map(r => {
              const on = editing.role === r.value
              return (
                <button key={r.value} onClick={() => assign(r.value)} disabled={savingRole}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: `${SPACE[4]}px`, marginBottom: SPACE[2], borderRadius: RADIUS.md, border: 'none', background: on ? COLOR.gold : COLOR.surface2, color: on ? '#1a1400' : COLOR.ink, fontSize: TYPE.body, fontWeight: on ? 800 : 600, cursor: savingRole ? 'default' : 'pointer' }}>
                  {r.label}{on && <Check size={18} color="#1a1400" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}
