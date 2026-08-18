'use client'

import Link from 'next/link'
import { Heart, Users, User } from 'lucide-react'
import { useFollows, useSession } from '@/lib/queries'
import { createClient } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { COLOR } from '@/lib/brand'
import type { Follow } from '@/lib/types'
import FollowButton from '@/components/FollowButton'

function useFollowsWithNames(follows: Follow[]) {
  const playerIds = follows.filter(f => f.entity_type === 'player').map(f => f.entity_id)
  const teamIds   = follows.filter(f => f.entity_type === 'team').map(f => f.entity_id)

  return useQuery({
    queryKey: ['follows-names', playerIds.sort().join(','), teamIds.sort().join(',')],
    queryFn: async () => {
      const supabase = createClient()
      // Follows are bits ids: players = bits_players.public_id, teams = bits_team_id.
      const [{ data: players }, { data: teams }] = await Promise.all([
        playerIds.length
          ? supabase.from('bits_players').select('public_id, first_name, sur_name').in('public_id', playerIds)
          : Promise.resolve({ data: [] }),
        teamIds.length
          ? supabase.from('bits_teams').select('bits_team_id, name').in('bits_team_id', teamIds.map(Number))
          : Promise.resolve({ data: [] }),
      ])
      const nameMap: Record<string, string> = {}
      for (const p of (players ?? []) as { public_id: string; first_name: string | null; sur_name: string | null }[]) {
        nameMap[`player:${p.public_id}`] = `${p.first_name ?? ''} ${p.sur_name ?? ''}`.trim() || 'Spelare'
      }
      for (const t of (teams ?? []) as { bits_team_id: number; name: string }[]) {
        nameMap[`team:${t.bits_team_id}`] = t.name
      }
      return nameMap
    },
    enabled: follows.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

function FollowRow({ follow, name }: { follow: Follow; name: string }) {
  const isPlayer = follow.entity_type === 'player'
  const href     = isPlayer ? `/players/${follow.entity_id}` : `/lag/${follow.entity_id}`
  const Icon     = isPlayer ? User : Users

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: COLOR.surface, borderRadius: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: COLOR.surface2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={COLOR.ink3} />
      </div>
      <Link href={href} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLOR.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </div>
        <div style={{ fontSize: 12, color: COLOR.ink4, marginTop: 2 }}>
          {isPlayer ? 'Spelare' : 'Lag'}
        </div>
      </Link>
      <FollowButton entityType={follow.entity_type} entityId={follow.entity_id} size="sm" />
    </div>
  )
}

export default function FollowingPage() {
  const { data: session, isLoading: sessionLoading } = useSession()
  const { data: follows = [], isLoading: followsLoading } = useFollows()
  const { data: nameMap = {} } = useFollowsWithNames(follows)

  const isLoading = sessionLoading || followsLoading

  const players = follows.filter(f => f.entity_type === 'player')
  const teams   = follows.filter(f => f.entity_type === 'team')

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 80px' }}>

        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Följer</div>
        <div style={{ fontSize: 14, color: COLOR.ink3, marginBottom: 32 }}>
          {follows.length > 0 ? `${follows.length} ${follows.length === 1 ? 'person eller lag' : 'personer och lag'}` : 'Spelare och lag du följer'}
        </div>

        {!session && !isLoading && (
          <div style={{ background: COLOR.surface, borderRadius: 20, padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: COLOR.ink2, marginBottom: 8 }}>Logga in för att följa</div>
            <div style={{ fontSize: 14, color: COLOR.ink4 }}>Skapa ett konto för att följa spelare och lag.</div>
          </div>
        )}

        {session && !isLoading && follows.length === 0 && (
          <div style={{ background: COLOR.surface, borderRadius: 20, padding: '48px 24px', textAlign: 'center' }}>
            <Heart size={36} color={COLOR.ink4} style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: COLOR.ink2, marginBottom: 8 }}>Du följer ingen ännu</div>
            <div style={{ fontSize: 14, color: COLOR.ink4, lineHeight: 1.5 }}>
              Hitta spelare och lag under<br />Hitta-fliken och börja följa dem.
            </div>
          </div>
        )}

        {players.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: COLOR.ink4, marginBottom: 10 }}>
              Spelare
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {players.map(f => (
                <FollowRow key={f.id} follow={f} name={nameMap[`player:${f.entity_id}`] ?? '…'} />
              ))}
            </div>
          </section>
        )}

        {teams.length > 0 && (
          <section>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: COLOR.ink4, marginBottom: 10 }}>
              Lag
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teams.map(f => (
                <FollowRow key={f.id} follow={f} name={nameMap[`team:${f.entity_id}`] ?? '…'} />
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
