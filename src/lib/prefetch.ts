import { QueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { keys, mapPlayerIdentityRow, mapPlayerMatchRows } from '@/lib/queries'

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

export async function prefetchPlayer(qc: QueryClient, publicId: string) {
  await Promise.all([
    qc.prefetchQuery({
      queryKey: keys.playerIdentity(publicId),
      queryFn: async () => {
        const { data, error } = await createClient().rpc('get_player_identity', { p_public_id: publicId }).maybeSingle()
        if (error) throw error
        return mapPlayerIdentityRow(data)
      },
    }),
    qc.prefetchQuery({
      queryKey: keys.playerBitsResults(publicId),
      queryFn: async () => {
        const { data, error } = await createClient().rpc('get_player_match_history', { p_public_id: publicId })
        if (error) throw error
        return mapPlayerMatchRows(data)
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
