'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { usePendingCaptainRequests, useAdminBootstrapCaptain, useCreateBootstrapCode } from '@/lib/queries'
import { COLOR, SPACE, TYPE, RADIUS } from '@/lib/brand'

type PendingClaim = { claimId: string; publicId: string; playerName: string; clubName: string | null; claimedAt: string }
type PendingTeamClaim = { claimId: string; bitsTeamId: number; teamName: string | null; clubName: string | null; userEmail: string | null; claimedAt: string }

function usePendingClaims() {
  return useQuery<PendingClaim[]>({
    queryKey: ['admin', 'pending-claims'],
    queryFn: async () => {
      const { data, error } = await createClient().rpc('get_pending_claims')
      if (error) throw error
      return (data ?? []).map(r => ({
        claimId: r.claim_id, publicId: r.public_id, playerName: r.player_name,
        clubName: r.club_name, claimedAt: r.claimed_at,
      }))
    },
  })
}

function usePendingTeamClaims() {
  return useQuery<PendingTeamClaim[]>({
    queryKey: ['admin', 'pending-team-claims'],
    queryFn: async () => {
      const { data, error } = await createClient().rpc('get_pending_team_claims')
      if (error) throw error
      return (data ?? []).map(r => ({
        claimId: r.claim_id, bitsTeamId: r.bits_team_id, teamName: r.team_name,
        clubName: r.club_name, userEmail: r.user_email, claimedAt: r.claimed_at,
      }))
    },
  })
}

function useUpdateClaimStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ claimId, status }: { claimId: string; status: 'verified' | 'rejected' }) => {
      const { error } = await createClient().rpc('update_claim_status', { p_claim_id: claimId, p_status: status })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'pending-claims'] }),
  })
}

function useUpdateTeamClaimStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ claimId, status }: { claimId: string; status: 'verified' | 'rejected' }) => {
      const { error } = await createClient().rpc('update_team_claim_status', { p_claim_id: claimId, p_status: status })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'pending-team-claims'] }),
  })
}

function ClaimRow({ title, titleHref, subtitle, busy, onVerify, onReject }: {
  title: string
  titleHref?: string
  subtitle: string
  busy: boolean
  onVerify: () => void
  onReject: () => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3],
      padding: SPACE[3], borderBottom: `1px solid ${COLOR.hairline}`,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: TYPE.body, fontWeight: 600 }}>
          {titleHref
            ? <Link href={titleHref} style={{ color: COLOR.ink, textDecoration: 'none' }}>{title}</Link>
            : title}
        </div>
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', gap: SPACE[2], flexShrink: 0 }}>
        <button
          onClick={onVerify}
          disabled={busy}
          style={{
            padding: '8px 14px', borderRadius: RADIUS.md, border: 'none', cursor: 'pointer',
            background: COLOR.green, color: COLOR.bg, fontSize: TYPE.caption, fontWeight: 700,
            opacity: busy ? 0.6 : 1,
          }}
        >
          Verifiera
        </button>
        <button
          onClick={onReject}
          disabled={busy}
          style={{
            padding: '8px 14px', borderRadius: RADIUS.md, border: `1px solid ${COLOR.hairline}`, cursor: 'pointer',
            background: 'transparent', color: COLOR.ink3, fontSize: TYPE.caption, fontWeight: 700,
            opacity: busy ? 0.6 : 1,
          }}
        >
          Avslå
        </button>
      </div>
    </div>
  )
}

function SectionTitle({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <div style={{ fontSize: TYPE.title, fontWeight: 800, marginBottom: SPACE[2], marginTop: first ? 0 : SPACE[8] }}>
      {children}
    </div>
  )
}

/** Tier-1 gate — a brand-new team with no verified members yet needs one
 * admin-vetted link to found it. Bounded by number of teams, not players. */
function BootstrapLinkTool() {
  const [teamId, setTeamId] = useState('')
  const [link, setLink]     = useState<string | null>(null)
  const { mutate, isPending, error } = useCreateBootstrapCode()

  const create = () => {
    const id = Number(teamId)
    if (!id) return
    setLink(null)
    mutate(id, { onSuccess: code => setLink(`${location.origin}/invite/${code}`) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
      <div style={{ display: 'flex', gap: SPACE[2] }}>
        <input
          value={teamId} onChange={e => setTeamId(e.target.value)}
          placeholder="bits_team_id"
          style={{
            flex: 1, padding: '8px 12px', borderRadius: RADIUS.md, border: `1px solid ${COLOR.hairline}`,
            background: COLOR.surface, color: COLOR.ink, fontSize: TYPE.body, outline: 'none',
          }}
        />
        <button
          onClick={create}
          disabled={isPending || !teamId}
          style={{ padding: '8px 14px', borderRadius: RADIUS.md, border: 'none', background: COLOR.gold, color: '#1a1400', fontSize: TYPE.caption, fontWeight: 700, cursor: 'pointer' }}
        >
          {isPending ? 'Skapar…' : 'Skapa länk'}
        </button>
      </div>
      {error && <div style={{ fontSize: TYPE.caption, color: COLOR.red }}>Något gick fel — försök igen.</div>}
      {link && <div style={{ fontSize: TYPE.caption, color: COLOR.ink2, wordBreak: 'break-all' }}>{link}</div>}
    </div>
  )
}

export default function AdminClaimsPage() {
  const { data: claims = [], isLoading } = usePendingClaims()
  const { data: teamClaims = [], isLoading: teamsLoading } = usePendingTeamClaims()
  const { data: captainRequests = [], isLoading: captainsLoading } = usePendingCaptainRequests()
  const player = useUpdateClaimStatus()
  const team = useUpdateTeamClaimStatus()
  const bootstrapCaptain = useAdminBootstrapCaptain()
  const [acting, setActing] = useState<string | null>(null)

  function act(kind: 'player' | 'team', claimId: string, status: 'verified' | 'rejected') {
    setActing(claimId)
    const m = kind === 'player' ? player : team
    m.mutate({ claimId, status }, { onSettled: () => setActing(null) })
  }

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, padding: `${SPACE[6]}px ${SPACE[4]}px` }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <SectionTitle first>Väntande spelarklaims</SectionTitle>
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginBottom: SPACE[6] }}>
          Manuell granskning — ingen automatisk verifiering. Verifierar du en minderårig spelare,
          intygar du att den som klickade är en vårdnadshavare eller lagledare.
        </div>

        {isLoading && <div style={{ color: COLOR.ink3, fontSize: TYPE.body }}>Laddar…</div>}
        {!isLoading && claims.length === 0 && (
          <div style={{ color: COLOR.ink3, fontSize: TYPE.body }}>Inga väntande klaims.</div>
        )}

        {claims.map(c => (
          <ClaimRow
            key={c.claimId}
            title={c.playerName}
            subtitle={[c.clubName, new Date(c.claimedAt).toLocaleDateString('sv-SE')].filter(Boolean).join(' · ')}
            busy={player.isPending && acting === c.claimId}
            onVerify={() => act('player', c.claimId, 'verified')}
            onReject={() => act('player', c.claimId, 'rejected')}
          />
        ))}

        <SectionTitle>Väntande lagklaims</SectionTitle>
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginBottom: SPACE[6] }}>
          Licensnumret matchade varken lagets spelare eller klubb (eller tillhör en junior).
          Verifiering gör användaren till medlem i laget — aldrig kapten automatiskt.
        </div>

        {teamsLoading && <div style={{ color: COLOR.ink3, fontSize: TYPE.body }}>Laddar…</div>}
        {!teamsLoading && teamClaims.length === 0 && (
          <div style={{ color: COLOR.ink3, fontSize: TYPE.body }}>Inga väntande klaims.</div>
        )}

        {teamClaims.map(c => (
          <ClaimRow
            key={c.claimId}
            title={c.teamName ?? `Lag #${c.bitsTeamId}`}
            titleHref={`/lag/${c.bitsTeamId}`}
            subtitle={[c.clubName, c.userEmail, new Date(c.claimedAt).toLocaleDateString('sv-SE')].filter(Boolean).join(' · ')}
            busy={team.isPending && acting === c.claimId}
            onVerify={() => act('team', c.claimId, 'verified')}
            onReject={() => act('team', c.claimId, 'rejected')}
          />
        ))}

        <SectionTitle>Kaptensförfrågningar</SectionTitle>
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginBottom: SPACE[6] }}>
          Ingen kapten finns än för laget — bounded av antal lag som frågar, inte antal spelare.
        </div>

        {captainsLoading && <div style={{ color: COLOR.ink3, fontSize: TYPE.body }}>Laddar…</div>}
        {!captainsLoading && captainRequests.length === 0 && (
          <div style={{ color: COLOR.ink3, fontSize: TYPE.body }}>Inga väntande förfrågningar.</div>
        )}

        {captainRequests.map(r => (
          <div key={r.claimId} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3],
            padding: SPACE[3], borderBottom: `1px solid ${COLOR.hairline}`,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: TYPE.body, fontWeight: 600 }}>
                <Link href={`/lag/${r.bitsTeamId}`} style={{ color: COLOR.ink, textDecoration: 'none' }}>
                  {r.teamName ?? `Lag #${r.bitsTeamId}`}
                </Link>
              </div>
              <div style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>
                {[r.clubName, r.userEmail, new Date(r.captainRequestedAt).toLocaleDateString('sv-SE')].filter(Boolean).join(' · ')}
              </div>
            </div>
            <button
              onClick={() => bootstrapCaptain.mutate(r.claimId)}
              disabled={bootstrapCaptain.isPending}
              style={{
                padding: '8px 14px', borderRadius: RADIUS.md, border: 'none', cursor: 'pointer',
                background: COLOR.gold, color: '#1a1400', fontSize: TYPE.caption, fontWeight: 700,
                opacity: bootstrapCaptain.isPending ? 0.6 : 1, flexShrink: 0,
              }}
            >
              Godkänn som kapten
            </button>
          </div>
        ))}

        <SectionTitle>Bootstrap-länk för nytt lag</SectionTitle>
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginBottom: SPACE[4] }}>
          Ger den som löser in länken kaptenskap direkt när deras licens matchar laget/klubben.
        </div>
        <BootstrapLinkTool />
      </div>
    </main>
  )
}
