import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import type { MatchResult } from '@/lib/player-stats'

export const keys = {
  homeMatches:   ['home', 'matches']                    as const,
  homeStandings: ['home', 'standings']                  as const,
  player:        (id: string) => ['player', id]         as const,
  playerResults: (id: string) => ['player', id, 'results'] as const,
  playerClaim:   (id: string) => ['player', id, 'claim']   as const,
  team:          (id: string) => ['team', id]           as const,
  teamMatches:   (id: string) => ['team', id, 'matches'] as const,
  match:         (id: string) => ['match', id]          as const,
  matchResults:  (id: string) => ['match', id, 'results'] as const,
  session:       ['session']                            as const,
}

export function useSession() {
  return useQuery({
    queryKey: keys.session,
    queryFn: async () => {
      const { data: { session } } = await createClient().auth.getSession()
      return session
    },
    staleTime: 5 * 60_000,
  })
}

export function useHomeMatches() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const today        = new Date().toISOString().slice(0, 10)
  const supabase     = createClient()
  return useQuery({
    queryKey: keys.homeMatches,
    queryFn: async () => {
      const [{ data: recentLive }, { data: upcoming }] = await Promise.all([
        supabase.from('matches')
          .select('id,date,status,division,home_score,away_score,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
          .in('status', ['live', 'completed'])
          .gte('date', sevenDaysAgo)
          .order('date', { ascending: false })
          .limit(40),
        supabase.from('matches')
          .select('id,date,status,division,home_score,away_score,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
          .eq('status', 'upcoming')
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(15),
      ])
      return { recentLive: recentLive ?? [], upcoming: upcoming ?? [] }
    },
    staleTime: 30_000,
  })
}

export function useHonorRoll(matchIds: string[]) {
  return useQuery({
    queryKey: ['home', 'honor', matchIds.slice().sort().join(',')],
    queryFn: async () => {
      if (!matchIds.length) return []
      const { data } = await createClient()
        .from('match_results')
        .select('games,player_id,match_id,player:players!player_id(id,name)')
        .in('match_id', matchIds)
        .not('player_id', 'is', null)
      const entries: { playerName: string; score: number; matchId: string }[] = []
      const seen = new Set<string>()
      data?.forEach((r: any) => {
        const player = r.player
        if (!player) return
        const best = Math.max(...(r.games ?? []))
        if (best >= 220) {
          const key = `${r.player_id}_${r.match_id}`
          if (!seen.has(key)) { seen.add(key); entries.push({ playerName: player.name, score: best, matchId: r.match_id }) }
        }
      })
      return entries.sort((a, b) => b.score - a.score).slice(0, 12)
    },
    enabled: matchIds.length > 0,
    staleTime: 60_000,
  })
}

export function useStandings() {
  return useQuery({
    queryKey: keys.homeStandings,
    queryFn: async () => {
      const { data } = await createClient()
        .from('matches')
        .select('home_team_id,away_team_id,home_score,away_score,division,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
        .eq('status', 'completed')
        .in('division', ['Elitserien Herrar', 'Elitserien Damer'])
        .not('home_score', 'is', null)
      return data ?? []
    },
    staleTime: 5 * 60_000,
  })
}

export function usePlayer(id: string) {
  return useQuery({
    queryKey: keys.player(id),
    queryFn: async () => {
      const { data, error } = await createClient().from('players').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function usePlayerResults(id: string) {
  return useQuery({
    queryKey: keys.playerResults(id),
    queryFn: async () => {
      const { data, error } = await createClient()
        .from('match_results')
        .select('id,player_id,match_id,games,matches:match_id(id,date,division,home_team_id,away_team_id,home_score,away_score,home:teams!home_team_id(name),away:teams!away_team_id(name))')
        .eq('player_id', id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as MatchResult[]
    },
    enabled: !!id,
  })
}

export function usePlayerClaim(playerId: string, userId: string | undefined) {
  return useQuery({
    queryKey: keys.playerClaim(playerId),
    queryFn: async () => {
      const { data } = await createClient()
        .from('player_claims')
        .select('id')
        .eq('user_id', userId!)
        .eq('player_id', playerId)
        .single()
      return !!data
    },
    enabled: !!playerId && !!userId,
    staleTime: 10 * 60_000,
  })
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: keys.team(id),
    queryFn: async () => {
      const { data, error } = await createClient().from('teams').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useTeamMatches(id: string) {
  return useQuery({
    queryKey: keys.teamMatches(id),
    queryFn: async () => {
      const { data, error } = await createClient()
        .from('matches')
        .select('id,date,status,division,home_score,away_score,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
        .or(`home_team_id.eq.${id},away_team_id.eq.${id}`)
        .order('date', { ascending: false })
        .limit(40)
      if (error) throw error
      return data ?? []
    },
    enabled: !!id,
  })
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: keys.match(id),
    queryFn: async () => {
      const { data, error } = await createClient()
        .from('matches')
        .select('*,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
    staleTime: 20_000,
  })
}

export function useMatchResults(matchId: string) {
  return useQuery({
    queryKey: keys.matchResults(matchId),
    queryFn: async () => {
      const { data, error } = await createClient()
        .from('match_results')
        .select('*,player:players!player_id(id,name,team_id)')
        .eq('match_id', matchId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!matchId,
    staleTime: 20_000,
  })
}
