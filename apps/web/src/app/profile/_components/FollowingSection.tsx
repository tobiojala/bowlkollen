'use client'

import Link from 'next/link'
import { User, Users, Compass } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { useFollows } from '@/lib/queries'
import FollowButton from '@/components/FollowButton'
import { COLOR } from '@/lib/brand'
import type { Follow } from '@/lib/types'

function useFollowNames(follows: Follow[]) {
  const playerIds = follows.filter(f => f.entity_type === 'player').map(f => f.entity_id)
  const teamIds   = follows.filter(f => f.entity_type === 'team').map(f => f.entity_id)
  return useQuery({
    queryKey: ['follow-names', playerIds.sort().join(','), teamIds.sort().join(',')],
    queryFn: async () => {
      const supabase = createClient()
      const [{ data: players }, { data: teams }] = await Promise.all([
        playerIds.length
          ? supabase.from('players').select('id,name').in('id', playerIds)
          : Promise.resolve({ data: [] }),
        teamIds.length
          ? supabase.from('teams').select('id,name').in('id', teamIds)
          : Promise.resolve({ data: [] }),
      ])
      const map: Record<string, string> = {}
      for (const p of players ?? []) map[`player:${p.id}`] = p.name
      for (const t of teams   ?? []) map[`team:${t.id}`]   = t.name
      return map
    },
    enabled: follows.length > 0,
    staleTime: 5 * 60_000,
  })
}

export default function FollowingSection() {
  const { data: follows = [], isLoading } = useFollows()
  const { data: names = {} }              = useFollowNames(follows)

  const players = follows.filter(f => f.entity_type === 'player')
  const teams   = follows.filter(f => f.entity_type === 'team')

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 800, letterSpacing: 2,
    textTransform: 'uppercase', color: COLOR.ink4,
    padding: '20px 16px 8px',
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px',
    borderBottom: `1px solid ${COLOR.hairline}`,
  }

  if (isLoading) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: COLOR.ink4 }}>
          Följer · {follows.length}
        </div>
        <Link href="/discover" style={{ fontSize: 12, fontWeight: 600, color: COLOR.gold, textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 4 }}>
          <Compass size={12} />Hitta fler
        </Link>
      </div>

      {follows.length === 0 && (
        <div style={{ padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: COLOR.ink4 }}>
            Du följer inga spelare eller lag än.
          </div>
          <Link href="/discover" style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            background: COLOR.surface, borderRadius: 10, padding: '10px 14px',
            fontSize: 13, fontWeight: 600, color: COLOR.ink, textDecoration: 'none', alignSelf: 'flex-start' }}>
            <Compass size={14} color={COLOR.gold} />
            Hitta spelare att följa
          </Link>
        </div>
      )}

      {players.length > 0 && (
        <>
          <div style={labelStyle}>Spelare</div>
          {players.map(f => (
            <div key={f.id} style={rowStyle}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: COLOR.surface,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={15} color={COLOR.ink3} />
              </div>
              <Link href={`/players/${f.entity_id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {names[`player:${f.entity_id}`] ?? '…'}
                </div>
              </Link>
              <FollowButton entityType="player" entityId={f.entity_id} size="sm" />
            </div>
          ))}
        </>
      )}

      {teams.length > 0 && (
        <>
          <div style={labelStyle}>Lag</div>
          {teams.map(f => (
            <div key={f.id} style={rowStyle}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: COLOR.surface,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={15} color={COLOR.ink3} />
              </div>
              <Link href={`/team/${f.entity_id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {names[`team:${f.entity_id}`] ?? '…'}
                </div>
              </Link>
              <FollowButton entityType="team" entityId={f.entity_id} size="sm" />
            </div>
          ))}
        </>
      )}
    </div>
  )
}
