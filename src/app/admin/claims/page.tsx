'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { COLOR, SPACE, TYPE, RADIUS } from '@/lib/brand'

type PendingClaim = { claimId: string; publicId: string; playerName: string; clubName: string | null; claimedAt: string }

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

export default function AdminClaimsPage() {
  const { data: claims = [], isLoading } = usePendingClaims()
  const { mutate, isPending } = useUpdateClaimStatus()
  const [acting, setActing] = useState<string | null>(null)

  function act(claimId: string, status: 'verified' | 'rejected') {
    setActing(claimId)
    mutate({ claimId, status }, { onSettled: () => setActing(null) })
  }

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, padding: `${SPACE[6]}px ${SPACE[4]}px` }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ fontSize: TYPE.title, fontWeight: 800, marginBottom: SPACE[2] }}>Väntande spelarklaims</div>
        <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginBottom: SPACE[6] }}>
          Manuell granskning — ingen automatisk verifiering. Verifierar du en minderårig spelare,
          intygar du att den som klickade är en vårdnadshavare eller lagledare.
        </div>

        {isLoading && <div style={{ color: COLOR.ink3, fontSize: TYPE.body }}>Laddar…</div>}
        {!isLoading && claims.length === 0 && (
          <div style={{ color: COLOR.ink3, fontSize: TYPE.body }}>Inga väntande klaims.</div>
        )}

        {claims.map(c => (
          <div key={c.claimId} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3],
            padding: SPACE[3], borderBottom: `1px solid ${COLOR.hairline}`,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: TYPE.body, fontWeight: 600 }}>{c.playerName}</div>
              <div style={{ fontSize: TYPE.caption, color: COLOR.ink3 }}>
                {[c.clubName, new Date(c.claimedAt).toLocaleDateString('sv-SE')].filter(Boolean).join(' · ')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: SPACE[2], flexShrink: 0 }}>
              <button
                onClick={() => act(c.claimId, 'verified')}
                disabled={isPending && acting === c.claimId}
                style={{
                  padding: '8px 14px', borderRadius: RADIUS.md, border: 'none', cursor: 'pointer',
                  background: COLOR.green, color: COLOR.bg, fontSize: TYPE.caption, fontWeight: 700,
                  opacity: isPending && acting === c.claimId ? 0.6 : 1,
                }}
              >
                Verifiera
              </button>
              <button
                onClick={() => act(c.claimId, 'rejected')}
                disabled={isPending && acting === c.claimId}
                style={{
                  padding: '8px 14px', borderRadius: RADIUS.md, border: `1px solid ${COLOR.hairline}`, cursor: 'pointer',
                  background: 'transparent', color: COLOR.ink3, fontSize: TYPE.caption, fontWeight: 700,
                  opacity: isPending && acting === c.claimId ? 0.6 : 1,
                }}
              >
                Avslå
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
