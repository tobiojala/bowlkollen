'use client'

import { useQuery } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { useSession } from '@/lib/queries'
import { STALE } from '@/lib/constants'

export type ScoutForm = 'V' | 'F' | 'O'
export type ScoutTag = 'bogey' | 'favorit' | 'even'
export type ScoutOpponent = {
  publicId: string | null; name: string
  myWins: number; myLosses: number; ties: number; meetings: number
  recent: ScoutForm[]; tag: ScoutTag
}
export type Scouting = { opponentTeamId: number; opponentName: string; opponents: ScoutOpponent[]; leadCount: number; total: number }

export type ScoutMatch = { homeTeamId: number | null; awayTeamId: number | null; homeName: string; awayName: string }
type RpcRow = { opp_public_id: string | null; opp_name: string; my_wins: number; my_losses: number; ties: number; meetings: number; recent: number[] | null }

const toForm = (n: number): ScoutForm => (n === 1 ? 'V' : n === -1 ? 'F' : 'O')
const rank = (o: ScoutOpponent) => (o.tag === 'bogey' ? 0 : o.tag === 'even' ? 1 : 2)

async function myTeamIds(db: SupabaseClient, uid: string): Promise<number[]> {
  const { data: claims } = await db.from('team_claims').select('bits_team_id').eq('user_id', uid).eq('status', 'verified')
  let ids = ((claims ?? []) as { bits_team_id: number }[]).map((c) => c.bits_team_id)
  if (!ids.length) {
    const { data: follows } = await db.from('follows').select('entity_id').eq('user_id', uid).eq('entity_type', 'team')
    ids = ((follows ?? []) as { entity_id: string }[]).map((f) => Number(f.entity_id)).filter((n) => n > 0)
  }
  return ids
}

// The viewer's career head-to-head vs the opponent's roster for a given match.
// null unless the viewer is a verified claimed player AND one of the teams is theirs.
export function usePlayerScouting(match: ScoutMatch | null) {
  const { data: session } = useSession()
  const uid = session?.user?.id
  const home = match?.homeTeamId ?? null
  const away = match?.awayTeamId ?? null

  return useQuery({
    queryKey: ['player-scouting', uid, home, away],
    enabled: !!uid && !!home && !!away,
    staleTime: STALE.LONG,
    queryFn: async (): Promise<Scouting | null> => {
      const db = createClient() as unknown as SupabaseClient
      // The verified claimed player for this user.
      const { data: claim } = await db.from('player_claims').select('player_id, status').eq('user_id', uid!).maybeSingle()
      const c = claim as { player_id: string; status: string } | null
      if (!c || c.status !== 'verified') return null
      const publicId = c.player_id

      const teamIds = await myTeamIds(db, uid!)
      const opponentTeamId = teamIds.includes(home!) ? away : teamIds.includes(away!) ? home : null
      if (!opponentTeamId) return null
      const opponentName = opponentTeamId === home ? match!.homeName : match!.awayName

      const { data, error } = await db.rpc('get_player_scouting', { p_public_id: publicId, p_opponent_team_id: opponentTeamId })
      if (error) throw error

      const opponents: ScoutOpponent[] = ((data ?? []) as RpcRow[]).map((r) => ({
        publicId: r.opp_public_id, name: r.opp_name,
        myWins: r.my_wins, myLosses: r.my_losses, ties: r.ties, meetings: r.meetings,
        recent: (r.recent ?? []).map(toForm),
        tag: (r.my_wins > r.my_losses ? 'favorit' : r.my_wins < r.my_losses ? 'bogey' : 'even') as ScoutTag,
      }))
      opponents.sort((a, b) => rank(a) - rank(b) || b.meetings - a.meetings)

      return {
        opponentTeamId, opponentName, opponents,
        leadCount: opponents.filter((o) => o.myWins > o.myLosses).length,
        total: opponents.length,
      }
    },
  })
}
