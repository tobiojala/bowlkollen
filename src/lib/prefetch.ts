import { QueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { keys } from '@/lib/queries'
import type { MatchResult } from '@/lib/player-stats'

// ── Prefetch functions — call these on hover/touchstart ───────────────────────
// Each checks the cache first (staleTime) before firing a network request.

export async function prefetchMatch(qc: QueryClient, matchId: string) {
  await Promise.all([
    qc.prefetchQuery({
      queryKey: keys.match(matchId),
      queryFn: async () => {
        const { data, error } = await createClient()
          .from('matches')
          .select('*,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
          .eq('id', matchId).single()
        if (error) throw error
        return data
      },
      staleTime: 20_000,
    }),
    qc.prefetchQuery({
      queryKey: keys.matchResults(matchId),
      queryFn: async () => {
        const { data, error } = await createClient()
          .from('match_results')
          .select('*,player:players!player_id(id,name,team_id)')
          .eq('match_id', matchId)
        if (error) throw error
        return data ?? []
      },
      staleTime: 20_000,
    }),
  ])
}

export async function prefetchPlayer(qc: QueryClient, playerId: string) {
  await Promise.all([
    qc.prefetchQuery({
      queryKey: keys.player(playerId),
      queryFn: async () => {
        const { data, error } = await createClient()
          .from('players').select('*').eq('id', playerId).single()
        if (error) throw error
        return data
      },
    }),
    qc.prefetchQuery({
      queryKey: keys.playerResults(playerId),
      queryFn: async () => {
        const { data, error } = await createClient()
          .from('match_results')
          .select('id,player_id,match_id,games,matches:match_id(id,date,division,home_team_id,away_team_id,home_score,away_score,home:teams!home_team_id(name),away:teams!away_team_id(name))')
          .eq('player_id', playerId)
          .order('created_at', { ascending: false })
        if (error) throw error
        return (data ?? []) as unknown as MatchResult[]
      },
    }),
  ])
}

export async function prefetchTeam(qc: QueryClient, teamId: string) {
  await Promise.all([
    qc.prefetchQuery({
      queryKey: keys.team(teamId),
      queryFn: async () => {
        const { data, error } = await createClient()
          .from('teams').select('*').eq('id', teamId).single()
        if (error) throw error
        return data
      },
    }),
    qc.prefetchQuery({
      queryKey: keys.teamMatches(teamId),
      queryFn: async () => {
        const { data, error } = await createClient()
          .from('matches')
          .select('id,date,status,division,home_score,away_score,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .order('date', { ascending: false })
          .limit(40)
        if (error) throw error
        return data ?? []
      },
    }),
  ])
}
