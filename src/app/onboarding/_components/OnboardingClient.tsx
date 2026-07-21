'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { useAnonViewSuggestions, useDeleteAnonViews } from '@/lib/queries'
import { getAnonId } from '@/lib/anon-id'
import { COLOR, SPACE, TYPE, RADIUS } from '@/lib/brand'
import FollowButton from '@/components/FollowButton'
import TeamPicker from './TeamPicker'
import SuggestionTiers from './SuggestionTiers'
import { ClaimTeamSheet } from '@/app/lag/[id]/_components/ClaimTeamSheet'
import type { AnonViewSuggestion, FollowEntityType } from '@/lib/types'

type InviteTeam = { id: number; name: string }

type ResolvedSuggestion = { entityType: FollowEntityType; entityId: string; name: string }

function useResolveAnonSuggestions(suggestions: AnonViewSuggestion[]) {
  return useQuery<ResolvedSuggestion[]>({
    queryKey: ['onboarding', 'anon-views', 'resolved', suggestions.map(s => s.entityId).join(',')],
    enabled: suggestions.length > 0,
    queryFn: async () => {
      const supabase  = createClient()
      const playerIds = suggestions.filter(s => s.entityType === 'player').map(s => s.entityId)
      const teamIds   = suggestions.filter(s => s.entityType === 'team').map(s => Number(s.entityId))

      const [{ data: players }, { data: teams }] = await Promise.all([
        playerIds.length
          ? supabase.from('bits_players').select('public_id,first_name,sur_name').in('public_id', playerIds)
          : Promise.resolve({ data: [] as { public_id: string; first_name: string; sur_name: string }[] }),
        teamIds.length
          ? supabase.from('bits_teams').select('bits_team_id,name').in('bits_team_id', teamIds)
          : Promise.resolve({ data: [] as { bits_team_id: number; name: string }[] }),
      ])

      const byPlayer = new Map((players ?? []).map(p => [p.public_id, `${p.first_name} ${p.sur_name}`.trim()]))
      const byTeam   = new Map((teams ?? []).map(t => [String(t.bits_team_id), t.name]))

      return suggestions
        .map(s => ({ entityType: s.entityType, entityId: s.entityId, name: s.entityType === 'player' ? byPlayer.get(s.entityId) : byTeam.get(s.entityId) }))
        .filter((s): s is ResolvedSuggestion => !!s.name)
    },
  })
}

export default function OnboardingClient({ inviteTeam, inviteCode }: { inviteTeam: InviteTeam | null; inviteCode: string | null }) {
  const router = useRouter()
  const [anonId, setAnonId]       = useState<string | null>(null)
  const [pickedTeam, setPickedTeam] = useState<{ id: number; name: string } | null>(inviteTeam)
  const [claimOpen, setClaimOpen] = useState(false)

  useEffect(() => { setAnonId(getAnonId()) }, [])

  const { data: anonSuggestions = [] } = useAnonViewSuggestions(anonId)
  const { data: resolved = [] }        = useResolveAnonSuggestions(anonSuggestions)
  const { mutate: deleteAnonViews }    = useDeleteAnonViews()

  // Anonymous view history has served its purpose once it's been offered as
  // a suggestion — delete it rather than keep it around (data minimization).
  useEffect(() => {
    if (anonId && anonSuggestions.length > 0) deleteAnonViews(anonId)
  }, [anonId, anonSuggestions.length, deleteAnonViews])

  async function finish() {
    await createClient().auth.updateUser({ data: { onboarding_seen: true } })
    router.push('/')
  }

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, paddingBottom: 120 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: `${SPACE[8]}px ${SPACE[4]}px` }}>
        <h1 style={{ fontSize: TYPE.title, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
          Välkommen till Bowlkollen
        </h1>
        <p style={{ fontSize: TYPE.body, color: COLOR.ink2, marginTop: SPACE[2] }}>
          Följ ditt lag och dina lagkamrater för en feed som känns som din egen.
        </p>

        {resolved.length > 0 && (
          <section style={{ marginTop: SPACE[8] }}>
            <div style={sectionLabel}>DU TITTADE PÅ</div>
            {resolved.map(r => (
              <div key={`${r.entityType}-${r.entityId}`} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3],
                padding: '10px 0', borderBottom: `1px solid ${COLOR.hairline}`,
              }}>
                <span style={{ fontSize: TYPE.body, fontWeight: 600 }}>{r.name}</span>
                <FollowButton entityType={r.entityType} entityId={r.entityId} variant="pill" size="sm" />
              </div>
            ))}
          </section>
        )}

        <section style={{ marginTop: SPACE[8] }}>
          <div style={sectionLabel}>VILKET LAG ÄR DITT?</div>
          {!pickedTeam ? (
            <TeamPicker onPicked={(id, name) => setPickedTeam({ id, name })} />
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', background: COLOR.surface2, borderRadius: RADIUS.md,
            }}>
              <span style={{ fontSize: TYPE.body, fontWeight: 700, color: COLOR.gold }}>✓ {pickedTeam.name}</span>
              <button
                onClick={() => setPickedTeam(null)}
                style={{ background: 'none', border: 'none', color: COLOR.ink3, fontSize: TYPE.caption, cursor: 'pointer' }}
              >
                Byt
              </button>
            </div>
          )}

          {/* Arrived via a teammate's or admin's invite link — the vouch
              already happened, so skip straight to claiming instead of just
              following. */}
          {inviteTeam && pickedTeam?.id === inviteTeam.id && (
            <div style={{ marginTop: SPACE[3], padding: '12px 14px', background: 'rgba(245,194,0,0.08)', border: '1px solid rgba(245,194,0,0.25)', borderRadius: RADIUS.md }}>
              <div style={{ fontSize: TYPE.body, fontWeight: 700, color: COLOR.ink }}>Du blev inbjuden till {inviteTeam.name}</div>
              <div style={{ fontSize: TYPE.caption, color: COLOR.ink3, marginTop: 2, marginBottom: SPACE[2] }}>
                Gör anspråk på din plats i laget — det tar bara ditt licensnummer.
              </div>
              <button
                onClick={() => setClaimOpen(true)}
                style={{ padding: '8px 14px', borderRadius: RADIUS.md, border: 'none', background: COLOR.gold, color: '#1a1400', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Gör anspråk
              </button>
            </div>
          )}
        </section>

        {pickedTeam && <SuggestionTiers bitsTeamId={pickedTeam.id} />}

        {inviteTeam && (
          <ClaimTeamSheet
            open={claimOpen}
            onClose={() => setClaimOpen(false)}
            teamId={inviteTeam.id}
            teamName={inviteTeam.name}
            inviteCode={inviteCode ?? undefined}
          />
        )}

        <div style={{ marginTop: SPACE[12], display: 'flex', flexDirection: 'column', gap: SPACE[3] }}>
          {pickedTeam && (
            <button onClick={finish} style={{
              padding: '14px 0', background: COLOR.gold, color: COLOR.bg, border: 'none',
              borderRadius: RADIUS.md, fontSize: TYPE.body, fontWeight: 700, cursor: 'pointer',
            }}>
              Klar
            </button>
          )}
          <button onClick={finish} style={{
            padding: '14px 0', background: 'transparent', color: COLOR.ink3, border: 'none',
            fontSize: TYPE.caption, fontWeight: 600, cursor: 'pointer',
          }}>
            Hoppa över
          </button>
        </div>
      </div>
    </main>
  )
}

const sectionLabel: React.CSSProperties = {
  fontSize: TYPE.label, fontWeight: 800, letterSpacing: '0.1em', color: COLOR.ink2, marginBottom: SPACE[2],
}
