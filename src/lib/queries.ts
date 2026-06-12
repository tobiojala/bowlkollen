import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import type { MatchResult, TeamEvent } from '@/lib/types'
import { QUERY, STALE, SCORE, SEASON, STANDINGS_DIVISIONS } from '@/lib/constants'

export const keys = {
  homeMatches:   ['home', 'matches']                       as const,
  homeStandings: ['home', 'standings']                     as const,
  player:        (id: string) => ['player', id]            as const,
  playerResults: (id: string) => ['player', id, 'results'] as const,
  playerClaim:   (id: string) => ['player', id, 'claim']   as const,
  team:          (id: string) => ['team', id]              as const,
  teamMatches:   (id: string) => ['team', id, 'matches']   as const,
  teamEvents:    (id: string) => ['team', id, 'events']    as const,
  match:         (id: string) => ['match', id]             as const,
  matchResults:  (id: string) => ['match', id, 'results']  as const,
  matchLineup:   (id: string) => ['match', id, 'lineup']   as const,
  session:       ['session']                               as const,
}

export function useSession() {
  return useQuery({
    queryKey: keys.session,
    queryFn: async () => {
      const { data: { session } } = await createClient().auth.getSession()
      return session
    },
    staleTime: STALE.MEDIUM,
  })
}

export function useHomeMatches() {
  const windowMs     = QUERY.HOME_MATCH_WINDOW_DAYS * 86400000
  const sevenDaysAgo = new Date(Date.now() - windowMs).toISOString().slice(0, 10)
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
          .limit(QUERY.HOME_MATCHES_LIMIT),
        supabase.from('matches')
          .select('id,date,status,division,home_score,away_score,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
          .eq('status', 'upcoming')
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(QUERY.HOME_UPCOMING_LIMIT),
      ])
      return { recentLive: recentLive ?? [], upcoming: upcoming ?? [] }
    },
    staleTime: STALE.SHORT,
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
      data?.forEach((r) => {
        // Supabase returns the join as array; take the first element.
        const player = Array.isArray(r.player) ? r.player[0] : r.player
        if (!player) return
        const best = Math.max(...(r.games ?? []))
        if (best >= SCORE.HONOR_ROLL) {
          const key = `${r.player_id}_${r.match_id}`
          if (!seen.has(key)) { seen.add(key); entries.push({ playerName: player.name, score: best, matchId: r.match_id }) }
        }
      })
      return entries.sort((a, b) => b.score - a.score).slice(0, QUERY.HONOR_ROLL_LIMIT)
    },
    enabled: matchIds.length > 0,
    staleTime: STALE.DEFAULT,
  })
}

export function useStandings() {
  return useQuery({
    queryKey: keys.homeStandings,
    queryFn: async () => {
      const { data } = await createClient()
        .from('matches')
        .select('home_team_id,away_team_id,home_score,away_score,division,date,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
        .eq('status', 'completed')
        .in('division', STANDINGS_DIVISIONS)
        .not('home_score', 'is', null)
      return data ?? []
    },
    staleTime: STALE.MEDIUM,
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
    staleTime: STALE.LONG,
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

export function useTeamEvents(id: string) {
  return useQuery({
    queryKey: keys.teamEvents(id),
    queryFn: async () => {
      const { data, error } = await createClient()
        .from('team_events')
        .select('*, reactions:team_event_reactions(id, user_id, reaction)')
        .eq('team_id', id)
        .eq('is_hidden', false)
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return (data ?? []) as TeamEvent[]
    },
    enabled: !!id,
    staleTime: STALE.SHORT,
  })
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: { session } } = await createClient().auth.getSession()
      if (!session) return []
      const { data } = await createClient()
        .from('notifications')
        .select('id, team_id, event_id, event_type, title, read_at, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      return data ?? []
    },
    staleTime: STALE.SHORT,
  })
}

export function usePlayerCheers(teamId: string) {
  return useQuery({
    queryKey: ['player-cheers', teamId],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: { session } } = await createClient().auth.getSession()
      const { data } = await createClient()
        .from('player_cheers')
        .select('player_id, user_id')
        .eq('team_id', teamId)
        .gte('created_at', cutoff)
      const rows = data ?? []
      const counts: Record<string, number> = {}
      rows.forEach(r => { counts[r.player_id] = (counts[r.player_id] ?? 0) + 1 })
      const mine = new Set(
        session ? rows.filter(r => r.user_id === session.user.id).map(r => r.player_id) : []
      )
      return { counts, mine, userId: session?.user?.id ?? null }
    },
    enabled: !!teamId,
    staleTime: STALE.SHORT,
  })
}

export function usePredictions(matchId: string | null) {
  return useQuery({
    queryKey: ['predictions', matchId],
    queryFn: async () => {
      if (!matchId) return { counts: { W: 0, D: 0, L: 0 }, mine: null as string | null }
      const { data: { session } } = await createClient().auth.getSession()
      const { data } = await createClient()
        .from('match_predictions')
        .select('user_id, prediction')
        .eq('match_id', matchId)
      const rows = data ?? []
      const counts = { W: 0, D: 0, L: 0 } as Record<string, number>
      rows.forEach(r => { counts[r.prediction] = (counts[r.prediction] ?? 0) + 1 })
      const mine = session ? (rows.find(r => r.user_id === session.user.id)?.prediction ?? null) : null
      return { counts, mine }
    },
    enabled: !!matchId,
    staleTime: STALE.SHORT,
  })
}

export function useTeamDivisionMatches(division: string | null) {
  return useQuery({
    queryKey: ['division', 'matches', division],
    queryFn: async () => {
      if (!division) return []
      const { data } = await createClient()
        .from('matches')
        .select('home_team_id,away_team_id,home_score,away_score')
        .eq('status', 'completed')
        .eq('division', division)
        .gte('date', SEASON.CURRENT)
        .not('home_score', 'is', null)
      return (data ?? []) as { home_team_id: string; away_team_id: string; home_score: number; away_score: number }[]
    },
    enabled: !!division,
    staleTime: STALE.MEDIUM,
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
        .limit(QUERY.TEAM_MATCHES_LIMIT)
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
    staleTime: STALE.LIVE,
  })
}

export function useMatchLineup(matchId: string) {
  return useQuery({
    queryKey: keys.matchLineup(matchId),
    queryFn: async () => {
      const { data, error } = await createClient()
        .from('match_lineups')
        .select('*')
        .eq('match_id', matchId)
        .order('bord')
        .order('position')
      if (error) throw error
      return data ?? []
    },
    enabled: !!matchId,
    staleTime: STALE.LIVE,
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
    staleTime: STALE.LIVE,
  })
}
