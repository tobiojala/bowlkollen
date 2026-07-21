import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import type { TeamEvent, TeamEventReaction, Follow, FollowEntityType, FeedItem, ReactionType, BitsMatchFeed, BitsMatchDetail, BitsTopScore, BitsPlayerIdentity, BitsPlayerMatchRow, AnonViewSuggestion, OnboardingSuggestions, TeamSuggestion, PlayerSuggestion, SeasonMatch } from '@/lib/types'
import { QUERY, STALE, SCORE, SEASON, STANDINGS_DIVISIONS } from '@/lib/constants'
import { composePlayerSuggestions } from '@/lib/onboarding-suggestions'

export const keys = {
  homeMatches:   ['home', 'matches']                       as const,
  homeStandings: ['home', 'standings']                     as const,
  playerIdentity:   (publicId: string) => ['player', publicId, 'identity']    as const,
  playerBitsResults: (publicId: string) => ['player', publicId, 'bits-results'] as const,
  playerPercentile: (publicId: string) => ['player', publicId, 'percentile']  as const,
  playerClaim:   (id: string) => ['player', id, 'claim']   as const,
  teamClaim:     (bitsTeamId: number) => ['team-claim', bitsTeamId] as const,
  teamAvailability: (bitsTeamId: number, bitsMatchId: number) => ['team-availability', bitsTeamId, bitsMatchId] as const,
  teamLineup:       (bitsTeamId: number, bitsMatchId: number) => ['team-lineup', bitsTeamId, bitsMatchId] as const,
  team:          (id: string) => ['team', id]              as const,
  teamMatches:   (id: string) => ['team', id, 'matches']   as const,
  teamEvents:    (id: string) => ['team', id, 'events']    as const,
  myTeamId:      ['my-team-id']                            as const,
  match:             (id: string)                    => ['match', id]                      as const,
  matchResults:      (id: string)                    => ['match', id, 'results']           as const,
  matchLineup:       (id: string)                    => ['match', id, 'lineup']            as const,
  matchPredictions:  (id: string)                    => ['match', id, 'predictions']       as const,
  myPrediction:      (id: string, uid: string)       => ['match', id, 'predictions', uid]  as const,
  session:           ['session']                                                            as const,
  follows:           ['follows']                                                            as const,
  anonViewSuggestions:   (anonId: string)        => ['onboarding', 'anon-views', anonId]        as const,
  onboardingSuggestions: (bitsTeamId: number)    => ['onboarding', 'suggestions', bitsTeamId]   as const,
  userSeasonMatches:     ['schema', 'season-matches']                                            as const,
  allDivisions:          ['divisions', 'all']                                                     as const,
  divisionMatches:       (id: number) => ['division', id, 'matches']                              as const,
  seasonMatchDates:      ['schema', 'season-match-dates']                                          as const,
  bitsMatch:             (bitsMatchId: number) => ['bits-match', bitsMatchId]                       as const,
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
          if (!r.match_id) return
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

// Raw RPC row shapes (snake_case, as Postgres returns them) → typed,
// camelCase domain shapes. Shared by the client hooks below and the
// Server Component prefetches in players/[id]/page.tsx + prefetch.ts, so
// the mapping can't drift between the two.
type RawPlayerIdentityRow = {
  public_id: string; name: string; club_name: string | null
  licence_average: number | null; licence_skill_lvl: number | null; is_junior: boolean; is_claimed: boolean
}
type RawPlayerMatchRow = {
  match_date: string; division_name: string | null; opponent_name: string
  is_home_team: boolean; series: number[]; total_result: number
  home_points: number | null; away_points: number | null; season_id: number
}

export function mapPlayerIdentityRow(row: RawPlayerIdentityRow | null): BitsPlayerIdentity | null {
  if (!row) return null
  return {
    publicId: row.public_id, name: row.name, clubName: row.club_name,
    licenceAverage: row.licence_average, licenceSkillLvl: row.licence_skill_lvl,
    isJunior: row.is_junior, isClaimed: row.is_claimed,
  }
}

export function mapPlayerMatchRows(rows: RawPlayerMatchRow[] | null): BitsPlayerMatchRow[] {
  return (rows ?? []).map(r => ({
    matchDate: r.match_date, divisionName: r.division_name, opponentName: r.opponent_name,
    isHomeTeam: r.is_home_team, series: r.series, totalResult: r.total_result,
    homePoints: r.home_points, awayPoints: r.away_points, seasonId: r.season_id,
  }))
}

/** Real player identity (name/club/average) — joins through lic_nbr server-side, never returns it. */
export function usePlayerIdentity(publicId: string) {
  return useQuery({
    queryKey: keys.playerIdentity(publicId),
    queryFn: async () => {
      const { data, error } = await createClient().rpc('get_player_identity', { p_public_id: publicId }).maybeSingle()
      if (error) throw error
      return mapPlayerIdentityRow(data as RawPlayerIdentityRow | null)
    },
    enabled: !!publicId,
    staleTime: STALE.LONG,
  })
}

/** Real match history for a player, oldest first — feeds buildProfileFromBitsRows(). */
export function usePlayerBitsResults(publicId: string) {
  return useQuery({
    queryKey: keys.playerBitsResults(publicId),
    queryFn: async () => {
      const { data, error } = await createClient().rpc('get_player_match_history', { p_public_id: publicId })
      if (error) throw error
      return mapPlayerMatchRows(data as RawPlayerMatchRow[] | null)
    },
    enabled: !!publicId,
  })
}

type RawSeasonMatchRow = {
  bits_match_id: number; match_date: string; round_id: number | null
  home_team_name: string; away_team_name: string; home_score: number | null; away_score: number | null
  division_name: string | null; is_finished: boolean | null; hall_name: string | null
  is_personalized?: boolean
}

/** isPersonalizedOverride lets explicit-division-browse callers (no `is_personalized` column) force false, rather than reading it per-row off the RPC result. */
export function mapSeasonMatchRows(rows: RawSeasonMatchRow[] | null, isPersonalizedOverride?: boolean): SeasonMatch[] {
  return (rows ?? []).map(r => ({
    bitsMatchId: r.bits_match_id, matchDate: r.match_date, roundId: r.round_id,
    homeTeamName: r.home_team_name, awayTeamName: r.away_team_name,
    homeScore: r.home_score, awayScore: r.away_score,
    divisionName: r.division_name, isFinished: r.is_finished ?? false, hallName: r.hall_name,
    isPersonalized: isPersonalizedOverride ?? r.is_personalized ?? true,
  }))
}

/** Resolves a legacy team page's id to the real bits_team_id, by name match (see resolve_bits_team_id). Null means no confident match — callers should hide follow affordances rather than write a dead follow. */
export function useResolvedBitsTeamId(legacyTeamId: string) {
  return useQuery({
    queryKey: ['team', legacyTeamId, 'bits-team-id'],
    queryFn: async () => {
      const { data, error } = await createClient().rpc('resolve_bits_team_id', { p_legacy_team_id: legacyTeamId })
      if (error) throw error
      return data as number | null
    },
    enabled: !!legacyTeamId,
    staleTime: STALE.LONG,
  })
}

/** "Your season" — matches from the divisions your followed players/teams (or your own verified claim) appear in. Falls back to Elitserien (isPersonalized: false on every row) when you follow nobody yet, rather than an empty array. */
export function useUserSeasonMatches() {
  return useQuery({
    queryKey: keys.userSeasonMatches,
    queryFn: async () => {
      const { data, error } = await createClient().rpc('get_user_season_matches')
      if (error) throw error
      return mapSeasonMatchRows(data as RawSeasonMatchRow[] | null)
    },
    staleTime: STALE.MEDIUM,
  })
}

/** All real divisions for the current season — for the Schema "browse divisions" zoom level. Public read, no auth needed. */
export function useAllDivisions() {
  return useQuery({
    queryKey: keys.allDivisions,
    queryFn: async () => {
      const { data, error } = await createClient()
        .from('bits_divisions')
        .select('bits_division_id, name')
        .eq('season_id', Number(SEASON.CURRENT.slice(0, 4)))
        .order('name')
      if (error) throw error
      return data ?? []
    },
    staleTime: STALE.LONG,
  })
}

/** One division's real matches — the explicit-browse path in Schema, as opposed to useUserSeasonMatches' personalized/fallback scoping. Public read, no auth needed. */
export function useDivisionMatches(divisionId: number | null) {
  return useQuery({
    queryKey: divisionId != null ? keys.divisionMatches(divisionId) : ['division', 'none'],
    queryFn: async () => {
      const { data, error } = await createClient()
        .from('bits_matches')
        .select('bits_match_id, match_date, round_id, home_team_name, away_team_name, home_score, away_score, division_name, is_finished, hall_name')
        .eq('bits_division_id', divisionId!)
        .eq('season_id', Number(SEASON.CURRENT.slice(0, 4)))
        .order('match_date')
      if (error) throw error
      return mapSeasonMatchRows(data, false)
    },
    enabled: divisionId != null,
    staleTime: STALE.MEDIUM,
  })
}

/** Match date + division across every division, current season — backs the Atlas page's
 * Sweden-wide overview and its per-division slides. Just the two columns a heatmap needs
 * (no team/score detail), public read, one query instead of one-per-division. */
export function useSeasonMatchDates() {
  return useQuery({
    queryKey: keys.seasonMatchDates,
    queryFn: async () => {
      const { data, error } = await createClient()
        .from('bits_matches')
        .select('match_date, bits_division_id')
        .eq('season_id', Number(SEASON.CURRENT.slice(0, 4)))
      if (error) throw error
      return (data ?? []) as { match_date: string; bits_division_id: number }[]
    },
    staleTime: STALE.LONG,
  })
}

/** Real "top X%" from BITS' own licence_average distribution. Null when not enough data — caller falls back to the simulated curve. */
export function usePlayerPercentile(publicId: string) {
  return useQuery({
    queryKey: keys.playerPercentile(publicId),
    queryFn: async () => {
      const { data, error } = await createClient().rpc('get_player_percentile', { p_public_id: publicId })
      if (error) throw error
      return data as number | null
    },
    enabled: !!publicId,
    staleTime: STALE.LONG,
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

export type TeamRole = 'player' | 'captain' | 'lagledare' | 'reserv'
export type TeamClaimState = { status: 'verified' | 'pending' | 'rejected'; role: TeamRole; vouched: boolean } | null

/** This user's membership of a BITS team — status + their private role.
 * `vouched` means the claim arrived via a team-scoped invite code (from an
 * already-verified teammate, or an admin bootstrap code) rather than just a
 * license-number match — see submit_team_claim / invite_scoped_claims.sql. */
export function useTeamClaim(bitsTeamId: number) {
  return useQuery({
    queryKey: keys.teamClaim(bitsTeamId),
    queryFn: async (): Promise<TeamClaimState> => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null
      const { data } = await supabase
        .from('team_claims')
        .select('status, role, vouched')
        .eq('user_id', session.user.id)
        .eq('bits_team_id', bitsTeamId)
        .maybeSingle()
      if (!data) return null
      return {
        status: data.status as 'verified' | 'pending' | 'rejected',
        role: (data.role ?? 'player') as TeamRole,
        vouched: data.vouched,
      }
    },
    enabled: !!bitsTeamId,
    staleTime: STALE.MEDIUM,
  })
}

/** Claim your spot in a team (license → auto-verify adult, else pending review).
 * Membership only — role starts as 'player'; captaincy is chosen afterwards.
 * An invite code (from a teammate's share link, or an admin bootstrap link)
 * marks the claim vouched and, for a bootstrap code, grants captain instantly. */
export function useSubmitTeamClaim(bitsTeamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ licNbr, inviteCode }: { licNbr: string; inviteCode?: string }): Promise<'verified' | 'pending'> => {
      const { data, error } = await createClient()
        .rpc('submit_team_claim', { p_bits_team_id: bitsTeamId, p_lic_nbr: licNbr, p_invite_code: inviteCode })
      if (error) throw error
      const res = data as { status: 'verified' | 'pending' }
      return res.status
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.teamClaim(bitsTeamId) }) },
  })
}

/** A verified member sets their own (private) role. 'captain' is gated —
 * only succeeds for a bootstrap-vouched founding claim; anyone else gets
 * 'captain_exists_use_transfer' or 'captain_needs_request' back, which the UI
 * should catch and redirect to useTransferCaptain / useRequestCaptain. */
export function useSetTeamRole(bitsTeamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (role: TeamRole) => {
      const { error } = await createClient()
        .rpc('set_team_role', { p_bits_team_id: bitsTeamId, p_role: role })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.teamClaim(bitsTeamId) }) },
  })
}

/** Mint a shareable team_claim invite code — any verified member can invite a
 * teammate. Sharing the link is the vouch; no separate confirm/deny UI. */
export function useCreateTeamInviteCode(bitsTeamId: number) {
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const { data, error } = await createClient()
        .rpc('create_team_invite_code', { p_bits_team_id: bitsTeamId })
      if (error) throw error
      return data as string
    },
  })
}

/** A verified member with no captain yet asks for the role — surfaces in the
 * admin's get_pending_captain_requests queue. */
export function useRequestCaptain(bitsTeamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await createClient().rpc('request_captain', { p_bits_team_id: bitsTeamId })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.teamClaim(bitsTeamId) }) },
  })
}

/** The current captain hands the role directly to another verified member —
 * the only way captaincy changes hands after the founding claim. */
export function useTransferCaptain(bitsTeamId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (toUserId: string) => {
      const { error } = await createClient()
        .rpc('transfer_captain', { p_bits_team_id: bitsTeamId, p_to_user_id: toUserId })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.teamClaim(bitsTeamId) }) },
  })
}

export type VerifiedTeamMember = { userId: string; role: TeamRole; displayName: string; publicId: string | null }

/** Verified members of a team — team-private, used by the captain-transfer
 * picker. Only callable by another verified member of the same team. */
export function useVerifiedTeamMembers(bitsTeamId: number) {
  return useQuery({
    queryKey: ['team-members', bitsTeamId] as const,
    queryFn: async (): Promise<VerifiedTeamMember[]> => {
      const { data, error } = await createClient()
        .rpc('get_verified_team_members', { p_bits_team_id: bitsTeamId })
      if (error) throw error
      return (data ?? []).map(r => ({
        userId: r.user_id, role: r.role as TeamRole, displayName: r.display_name, publicId: r.public_id,
      }))
    },
    enabled: !!bitsTeamId,
    staleTime: STALE.SHORT,
  })
}

export type InviteScope = { codeType: 'site_access' | 'team_claim' | 'new_team_bootstrap'; bitsTeamId: number | null; teamName: string | null }

/** Read-only peek at what a code unlocks — used to pre-fill onboarding when
 * someone arrives via a team-scoped link. No side effect (unlike redeeming). */
export function useInviteScope(code: string | null) {
  return useQuery({
    queryKey: ['invite-scope', code] as const,
    queryFn: async (): Promise<InviteScope | null> => {
      const { data, error } = await createClient().rpc('get_invite_scope', { p_code: code! })
      if (error) throw error
      const row = data?.[0]
      if (!row) return null
      return { codeType: row.code_type as InviteScope['codeType'], bitsTeamId: row.scope_bits_team_id, teamName: row.team_name }
    },
    enabled: !!code,
    staleTime: STALE.LONG,
  })
}

/** Admin: mint the Tier-1 founding code for a brand-new team with no
 * verified members yet. Bounded by number of teams, not players. */
export function useCreateBootstrapCode() {
  return useMutation({
    mutationFn: async (bitsTeamId: number): Promise<string> => {
      const { data, error } = await createClient()
        .rpc('admin_create_bootstrap_code', { p_bits_team_id: bitsTeamId })
      if (error) throw error
      return data as string
    },
  })
}

export type PendingCaptainRequest = {
  claimId: string; bitsTeamId: number; teamName: string | null; clubName: string | null
  userEmail: string | null; captainRequestedAt: string
}

/** Admin review queue for request_captain — bounded by number of teams
 * asking, not number of players. */
export function usePendingCaptainRequests() {
  return useQuery<PendingCaptainRequest[]>({
    queryKey: ['admin', 'pending-captain-requests'],
    queryFn: async () => {
      const { data, error } = await createClient().rpc('get_pending_captain_requests')
      if (error) throw error
      return (data ?? []).map(r => ({
        claimId: r.claim_id, bitsTeamId: r.bits_team_id, teamName: r.team_name, clubName: r.club_name,
        userEmail: r.user_email, captainRequestedAt: r.captain_requested_at,
      }))
    },
  })
}

/** Admin action on a captain request — approves by setting the requester as
 * captain directly. */
export function useAdminBootstrapCaptain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (claimId: string) => {
      const { error } = await createClient().rpc('admin_bootstrap_captain', { p_claim_id: claimId })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'pending-captain-requests'] }),
  })
}

/** One match's header info (opponent, date, venue) — used by the captain
 * availability/lineup pages, which are fully client-rendered (session-gated,
 * not the public SEO page) so this fetches client-side rather than prefetching
 * server-side like /matcher/[id] does. */
export function useBitsMatch(bitsMatchId: number) {
  return useQuery({
    queryKey: keys.bitsMatch(bitsMatchId),
    queryFn: async (): Promise<BitsMatchDetail | null> => {
      const { data, error } = await createClient()
        .from('bits_matches')
        .select('bits_match_id,match_date,division_name,bits_division_id,season_id,home_team_name,away_team_name,home_bits_team_id,away_bits_team_id,home_result,away_result,home_score,away_score,is_finished,hall_name,hall_city,oil_pattern,round_id,scores_synced')
        .eq('bits_match_id', bitsMatchId)
        .maybeSingle()
      if (error) throw error
      return data as BitsMatchDetail | null
    },
    enabled: !!bitsMatchId,
    staleTime: STALE.MEDIUM,
  })
}

export type RosterPlayer = { publicId: string; name: string; licenceAverage: number | null; appearances: number }

/** A team's roster — the same source /lag's Trupp section and the lineup
 * picker both draw from, so "who's on the team" never drifts between them. */
export function useTeamRoster(bitsTeamId: number, limit = 30) {
  return useQuery({
    queryKey: ['team-roster', bitsTeamId, limit] as const,
    queryFn: async (): Promise<RosterPlayer[]> => {
      const { data, error } = await createClient()
        .rpc('get_team_roster', { p_bits_team_id: bitsTeamId, p_limit: limit })
      if (error) throw error
      return (data ?? []).map(p => ({
        publicId: p.public_id, name: p.name, licenceAverage: p.licence_average, appearances: p.appearances,
      }))
    },
    enabled: !!bitsTeamId,
    staleTime: STALE.MEDIUM,
  })
}

export type AvailabilityResponseValue = 'yes' | 'maybe' | 'no'
export type TeamAvailabilityRow = {
  userId: string; response: AvailabilityResponseValue; note: string | null
  respondedAt: string; displayName: string; publicId: string | null; vouched: boolean
}

/** The team's answers to "Kan du spela?" for one match — team-private
 * (get_team_availability only returns rows to a verified teammate). */
export function useTeamAvailability(bitsTeamId: number, bitsMatchId: number) {
  return useQuery({
    queryKey: keys.teamAvailability(bitsTeamId, bitsMatchId),
    queryFn: async (): Promise<TeamAvailabilityRow[]> => {
      const { data, error } = await createClient()
        .rpc('get_team_availability', { p_bits_team_id: bitsTeamId, p_bits_match_id: bitsMatchId })
      if (error) throw error
      return (data ?? []).map(r => ({
        userId: r.user_id, response: r.response as AvailabilityResponseValue, note: r.note,
        respondedAt: r.responded_at, displayName: r.display_name, publicId: r.public_id, vouched: r.vouched,
      }))
    },
    enabled: !!bitsTeamId && !!bitsMatchId,
    staleTime: STALE.SHORT,
  })
}

/** Respond "Kan du spela?" — only a verified member can (enforced server-side
 * by submit_availability_response). */
export function useSubmitAvailability(bitsTeamId: number, bitsMatchId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ response, note }: { response: AvailabilityResponseValue; note?: string }) => {
      const { error } = await createClient().rpc('submit_availability_response', {
        p_bits_team_id: bitsTeamId, p_bits_match_id: bitsMatchId, p_response: response, p_note: note,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.teamAvailability(bitsTeamId, bitsMatchId) }),
  })
}

export type LineupSlot = { publicId: string; playerName: string; bord: number; pos: number; isReserve: boolean }
export type TeamLineup = { status: 'draft' | 'published'; slots: LineupSlot[] } | null

/** The lineup for one match — published is public (visible on /lag), a
 * draft is visible only to verified teammates (enforced by get_team_lineup). */
export function useTeamLineup(bitsTeamId: number, bitsMatchId: number) {
  return useQuery({
    queryKey: keys.teamLineup(bitsTeamId, bitsMatchId),
    queryFn: async (): Promise<TeamLineup> => {
      const { data, error } = await createClient()
        .rpc('get_team_lineup', { p_bits_team_id: bitsTeamId, p_bits_match_id: bitsMatchId })
      if (error) throw error
      if (!data || data.length === 0) return null
      return {
        status: data[0].status as 'draft' | 'published',
        slots: data.map(r => ({
          publicId: r.public_id, playerName: r.player_name, bord: r.bord, pos: r.pos, isReserve: r.is_reserve,
        })),
      }
    },
    enabled: !!bitsTeamId && !!bitsMatchId,
    staleTime: STALE.SHORT,
  })
}

/** Captain-only save/publish — save_team_lineup rejects non-captains and
 * blocks publishing an incomplete lineup server-side. */
export function useSaveTeamLineup(bitsTeamId: number, bitsMatchId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ slots, publish }: { slots: LineupSlot[]; publish: boolean }) => {
      const payload = slots.map(s => ({ public_id: s.publicId, bord: s.bord, pos: s.pos, is_reserve: s.isReserve }))
      const { data, error } = await createClient().rpc('save_team_lineup', {
        p_bits_team_id: bitsTeamId, p_bits_match_id: bitsMatchId, p_slots: payload, p_publish: publish,
      })
      if (error) throw error
      return data as { lineup_id: string; status: 'draft' | 'published' }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.teamLineup(bitsTeamId, bitsMatchId) }),
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

/** Home feed: team_events for all followed teams, newest first. */
export function useHomeFeed(teamIds: string[]) {
  return useQuery<TeamEvent[]>({
    queryKey: ['feed', 'home', teamIds.slice().sort().join(',')],
    queryFn: async () => {
      if (!teamIds.length) return []
      const { data, error } = await createClient()
        .from('team_events')
        .select('*, team:teams(id,name), reactions:team_event_reactions(id, user_id, reaction)')
        .in('team_id', teamIds)
        .eq('is_hidden', false)
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(40)
      if (error) throw error
      return (data ?? []) as TeamEvent[]
    },
    enabled: teamIds.length > 0,
    staleTime: STALE.SHORT,
  })
}

/**
 * Returns the team_id of the user's claimed player, or null if
 * unclaimed/unauthenticated. player_claims.player_id now points at
 * bits_players.public_id (real identity), which has no local team_id —
 * bridging real BITS players to the local `teams`/team_events feed model is
 * unscoped follow-up work, so this resolves to null until that bridge
 * exists (the feed simply stops highlighting "my team" in the meantime).
 */
export function useMyTeamId() {
  return useQuery<string | null>({
    queryKey: keys.myTeamId,
    queryFn: async () => null,
    enabled: false,
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

/** Aggregate vote counts for a match — public, no auth required. */
export function useMatchPredictions(matchId: string) {
  return useQuery({
    queryKey: keys.matchPredictions(matchId),
    queryFn: async () => {
      const { data } = await createClient()
        .from('match_predictions')
        .select('prediction')
        .eq('match_id', matchId)
      const W = data?.filter(p => p.prediction === 'W').length ?? 0
      const L = data?.filter(p => p.prediction === 'L').length ?? 0
      return { W, L, total: W + L }
    },
    staleTime: STALE.SHORT,
  })
}

/** The signed-in user's own prediction for a match. */
export function useMyPrediction(matchId: string, userId: string | null) {
  return useQuery({
    queryKey: userId ? keys.myPrediction(matchId, userId) : (['noop'] as const),
    queryFn: async (): Promise<'W' | 'L' | null> => {
      if (!userId) return null
      const { data } = await createClient()
        .from('match_predictions')
        .select('prediction')
        .eq('match_id', matchId)
        .eq('user_id', userId)
        .maybeSingle()
      const p = data?.prediction
      return p === 'W' || p === 'L' ? p : null
    },
    staleTime: STALE.LONG,
    enabled: !!userId,
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

// ── Follow system ─────────────────────────────────────────────────────────────

/** All follows for the signed-in user. Returns [] when logged out. */
export function useFollows() {
  return useQuery({
    queryKey: keys.follows,
    queryFn: async (): Promise<Follow[]> => {
      const { data: { session } } = await createClient().auth.getSession()
      if (!session) return []
      const { data, error } = await createClient()
        .from('follows')
        .select('id,user_id,entity_type,entity_id,created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Follow[]
    },
    staleTime: STALE.MEDIUM,
  })
}

/** True when the signed-in user follows the given entity. */
export function useIsFollowing(entityType: FollowEntityType, entityId: string) {
  const { data: follows = [] } = useFollows()
  return follows.some(f => f.entity_type === entityType && f.entity_id === entityId)
}

/** Personalized feed: match results for followed players + matches for followed teams. */
export function usePersonalizedFeed(playerIds: string[], teamIds: string[]) {
  return useQuery<FeedItem[]>({
    queryKey: ['feed', 'personal', playerIds.slice().sort().join(','), teamIds.slice().sort().join(',')],
    queryFn: async () => {
      const supabase = createClient()
      const items: FeedItem[] = []

      await Promise.all([
        playerIds.length
          ? supabase
              .from('match_results')
              .select('player_id,match_id,games,player:players!player_id(id,name),match:matches!match_id(id,date,division)')
              .in('player_id', playerIds)
              .limit(30)
              .then(({ data }) => {
                for (const r of (data ?? []) as unknown as Array<{
                  player_id: string; match_id: string; games: number[]
                  player: { name: string } | { name: string }[]
                  match: { date: string; division: string | null } | { date: string; division: string | null }[]
                }>) {
                  const player = Array.isArray(r.player) ? r.player[0] : r.player
                  const match  = Array.isArray(r.match)  ? r.match[0]  : r.match
                  if (!player || !match) return
                  const games = r.games ?? []
                  items.push({
                    kind: 'player_result',
                    playerId:   r.player_id,
                    playerName: player.name,
                    matchId:    r.match_id,
                    date:       match.date,
                    total:      games.reduce((s, g) => s + g, 0),
                    games,
                    division:   match.division ?? '',
                  })
                }
              })
          : Promise.resolve(),
        teamIds.length
          ? supabase
              .from('matches')
              .select('id,date,status,division,home_score,away_score,home:teams!home_team_id(id,name),away:teams!away_team_id(id,name)')
              .or(teamIds.flatMap(id => [`home_team_id.eq.${id}`, `away_team_id.eq.${id}`]).join(','))
              .order('date', { ascending: false })
              .limit(20)
              .then(({ data }) => {
                for (const m of (data ?? []) as unknown as Array<{
                  id: string; date: string; status: string; division: string | null
                  home_score: number | null; away_score: number | null
                  home: { id: string; name: string } | { id: string; name: string }[]
                  away: { id: string; name: string } | { id: string; name: string }[]
                }>) {
                  const home = Array.isArray(m.home) ? m.home[0] : m.home
                  const away = Array.isArray(m.away) ? m.away[0] : m.away
                  if (!home || !away) return
                  items.push({
                    kind:      'team_match',
                    matchId:   m.id,
                    date:      m.date,
                    status:    m.status,
                    division:  m.division ?? '',
                    homeId:    home.id,
                    homeName:  home.name,
                    awayId:    away.id,
                    awayName:  away.name,
                    homeScore: m.home_score,
                    awayScore: m.away_score,
                  })
                }
              })
          : Promise.resolve(),
      ])

      return items.sort((a, b) => b.date.localeCompare(a.date))
    },
    staleTime: STALE.SHORT,
    enabled: playerIds.length > 0 || teamIds.length > 0,
  })
}

/** Toggle follow/unfollow. Returns the new following state. */
export function useToggleFollow(entityType: FollowEntityType, entityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('not_authenticated')
      const uid = session.user.id

      // Check current state
      const { data: existing } = await supabase
        .from('follows')
        .select('id')
        .eq('user_id', uid)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .maybeSingle()

      if (existing) {
        await supabase.from('follows').delete().eq('id', existing.id)
        return false  // now unfollowed
      } else {
        const { error } = await supabase.from('follows').insert({ user_id: uid, entity_type: entityType, entity_id: entityId })
        if (error) {
          // Server-enforced junior guardrail (see enforce_junior_follow_guard
          // trigger) — surface a recognizable error so the UI can show a
          // friendly message instead of failing silently.
          if (error.message.includes('junior_unclaimed')) throw new Error('JUNIOR_UNCLAIMED')
          throw error
        }
        return true   // now following
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.follows })
    },
  })
}

export function useAnonViewSuggestions(anonId: string | null) {
  return useQuery<AnonViewSuggestion[]>({
    queryKey: anonId ? keys.anonViewSuggestions(anonId) : ['onboarding', 'anon-views', 'none'],
    enabled: !!anonId,
    queryFn: async () => {
      const { data, error } = await createClient().rpc('get_anon_view_suggestions', { p_anon_id: anonId! })
      if (error) throw error
      return (data ?? []).map(r => ({ entityType: r.entity_type as FollowEntityType, entityId: r.entity_id, viewedAt: r.viewed_at }))
    },
    staleTime: STALE.DEFAULT,
  })
}

export function useDeleteAnonViews() {
  return useMutation({
    mutationFn: async (anonId: string) => {
      await createClient().rpc('delete_anon_views', { p_anon_id: anonId })
    },
  })
}

// ── Onboarding: team-pick suggestions ─────────────────────────────────────

/**
 * Tiered follow suggestions once a user picks their own team: nearby teams
 * (division/county) to follow directly, plus players ordered teammates →
 * regional Elitserien → division rivals. See composePlayerSuggestions in
 * src/lib/onboarding-suggestions.ts for the player-tier merge logic.
 */
export function useOnboardingSuggestions(bitsTeamId: number | null) {
  return useQuery<OnboardingSuggestions>({
    queryKey: bitsTeamId != null ? keys.onboardingSuggestions(bitsTeamId) : ['onboarding', 'suggestions', 'none'],
    enabled: bitsTeamId != null,
    queryFn: async () => {
      const supabase = createClient()
      const id = bitsTeamId!

      const [{ data: nearby }, { data: teammates }, { data: elitserienTeams }, { data: rivalTeams }] = await Promise.all([
        supabase.rpc('get_nearby_teams', { p_bits_team_id: id }),
        supabase.rpc('get_team_roster', { p_bits_team_id: id }),
        supabase.rpc('get_regional_elitserien_teams', { p_bits_team_id: id }),
        supabase.rpc('get_division_rivals', { p_bits_team_id: id }),
      ])

      const [elitserienRosters, rivalRosters] = await Promise.all([
        Promise.all((elitserienTeams ?? []).map(t =>
          supabase.rpc('get_team_roster', { p_bits_team_id: t.bits_team_id, p_limit: 4 }).then(r => r.data ?? [])
        )),
        Promise.all((rivalTeams ?? []).map(t =>
          supabase.rpc('get_team_roster', { p_bits_team_id: t.bits_team_id, p_limit: 3 }).then(r => r.data ?? [])
        )),
      ])

      const teams: TeamSuggestion[] = (nearby ?? []).map(t => ({
        bitsTeamId: t.bits_team_id, name: t.name, clubName: t.club_name, reason: t.reason as 'division' | 'county',
      }))

      const players: PlayerSuggestion[] = composePlayerSuggestions(
        teammates ?? [],
        elitserienRosters.flat(),
        rivalRosters.flat(),
      )

      return { teams, players }
    },
    staleTime: STALE.LONG,
  })
}

export function useToggleReaction(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reaction: ReactionType) => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('not_authenticated')
      const uid = session.user.id

      const { data: existing } = await supabase
        .from('team_event_reactions')
        .select('id, reaction')
        .eq('event_id', eventId)
        .eq('user_id', uid)
        .maybeSingle()

      const ex = existing as { id: string; reaction: string } | null
      if (ex) {
        if (ex.reaction === reaction) {
          await supabase.from('team_event_reactions').delete().eq('id', ex.id)
        } else {
          await supabase.from('team_event_reactions').update({ reaction }).eq('id', ex.id)
        }
      } else {
        await supabase.from('team_event_reactions').insert({ event_id: eventId, user_id: uid, reaction })
      }
    },

    onMutate: async (reaction: ReactionType) => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const uid = session.user.id

      // Pause any in-flight feed refetches so they don't overwrite the optimistic state
      await qc.cancelQueries({ queryKey: ['feed', 'home'] })

      // Snapshot every matching cache entry (the key includes the teamIds string)
      const snapshot = qc.getQueriesData<TeamEvent[]>({ queryKey: ['feed', 'home'] })

      qc.setQueriesData<TeamEvent[]>({ queryKey: ['feed', 'home'] }, old => {
        if (!old) return old
        return old.map(event => {
          if (event.id !== eventId) return event
          const reactions = event.reactions ?? []
          const mine = reactions.find(r => r.user_id === uid)

          if (mine) {
            if (mine.reaction === reaction) {
              // Same reaction tapped again — remove it
              return { ...event, reactions: reactions.filter(r => r.user_id !== uid) }
            }
            // Different reaction — swap it
            return { ...event, reactions: reactions.map(r => r.user_id === uid ? { ...r, reaction } : r) }
          }
          // New reaction
          const optimistic: TeamEventReaction = {
            id:         `opt_${Date.now()}`,
            event_id:   eventId,
            user_id:    uid,
            reaction,
            created_at: new Date().toISOString(),
          }
          return { ...event, reactions: [...reactions, optimistic] }
        })
      })

      return { snapshot }
    },

    onError: (_err, _reaction, context) => {
      // Roll back to the snapshot on failure
      const ctx = context as { snapshot: [unknown, TeamEvent[] | undefined][] } | undefined
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key as string[], data))
    },

    onSettled: () => {
      // Background sync to confirm server state
      qc.invalidateQueries({ queryKey: ['feed', 'home'] })
    },
  })
}

// ── BITS national match feed ──────────────────────────────────────────────────

const BITS_FEED_COLS = 'bits_match_id,match_date,division_name,bits_division_id,home_team_name,away_team_name,home_bits_team_id,away_bits_team_id,home_result,away_result,is_finished,hall_name,hall_city'

export function useBitsMatchFeed() {
  // Look back a full season so the feed always has Elitserien–Div 3 history
  // even in off-season. Limit 300 before client-side tier filtering.
  const oneYearAgo   = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)
  const sixtyDaysOut = new Date(Date.now() +  60 * 86400000).toISOString().slice(0, 10)
  const today        = new Date().toISOString().slice(0, 10)

  return useQuery<{ recent: BitsMatchFeed[]; upcoming: BitsMatchFeed[] }>({
    queryKey: ['bits', 'match-feed', today],
    queryFn: async () => {
      const db = createClient()
      const [{ data: recent }, { data: upcoming }] = await Promise.all([
        db.from('bits_matches')
          .select(BITS_FEED_COLS)
          .eq('is_finished', true)
          .gte('match_date', oneYearAgo)
          .lte('match_date', today)
          .order('match_date', { ascending: false })
          .limit(500),
        db.from('bits_matches')
          .select(BITS_FEED_COLS)
          .eq('is_finished', false)
          .gte('match_date', today)
          .lte('match_date', sixtyDaysOut)
          .order('match_date', { ascending: true })
          .limit(120),
      ])
      return {
        recent:   (recent   ?? []) as BitsMatchFeed[],
        upcoming: (upcoming ?? []) as BitsMatchFeed[],
      }
    },
    staleTime: STALE.DEFAULT,
  })
}

export function useBitsTopScores() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)
  const today         = new Date().toISOString().slice(0, 10)

  return useQuery<BitsTopScore[]>({
    queryKey: ['bits', 'top-scores', today],
    queryFn: async () => {
      const db = createClient()

      // Step 1: top-tier finished matches with exact results synced, last 90 days
      const { data: matches } = await db
        .from('bits_matches')
        .select('bits_match_id,division_name,home_team_name,away_team_name,match_date')
        .eq('is_finished', true)
        .eq('exact_results_synced', true)
        .gte('match_date', ninetyDaysAgo)
        .or('division_name.ilike.%Elitserien%,division_name.ilike.%Allsvenskan%')
        .order('match_date', { ascending: false })
        .limit(40)

      if (!matches?.length) return []

      const matchIds = matches.map(m => m.bits_match_id)
      const matchMap = new Map(matches.map(m => [m.bits_match_id, m]))

      // Step 2: exact per-player results for those matches, straight from
      // BITS' own authoritative source — full name + license number, zero
      // ambiguity, already pre-sorted by score.
      const { data: results } = await db
        .from('bits_match_player_results')
        .select('bits_match_id,lic_nbr,player_name,is_home_team,series,total_result')
        .in('bits_match_id', matchIds)
        .order('total_result', { ascending: false })
        .limit(100)

      if (!results?.length) return []

      // Step 3: resolve registered averages + public profile id (only extra
      // data not on this row)
      const licNbrs = [...new Set(results.map(r => r.lic_nbr))]
      const avgByLic = new Map<string, number | null>()
      const publicIdByLic = new Map<string, string>()
      if (licNbrs.length > 0) {
        const { data: players } = await db
          .from('bits_players')
          .select('lic_nbr,licence_average,public_id')
          .in('lic_nbr', licNbrs)
        for (const p of players ?? []) {
          avgByLic.set(p.lic_nbr, p.licence_average ?? null)
          publicIdByLic.set(p.lic_nbr, p.public_id)
        }
      }

      const entries = (results as unknown as Array<{
        bits_match_id: number; lic_nbr: string; player_name: string
        is_home_team: boolean; series: number[]; total_result: number
      }>)
        .map(r => {
          const match = matchMap.get(r.bits_match_id)!
          return {
            matchId:    r.bits_match_id,
            playerName: r.player_name,
            average:    avgByLic.get(r.lic_nbr) ?? null,
            publicId:   publicIdByLic.get(r.lic_nbr) ?? null,
            total:      r.total_result,
            series:     r.series,
            isHome:     r.is_home_team,
            division:   match.division_name ?? '',
            opponent:   r.is_home_team ? match.away_team_name : match.home_team_name,
            date:       match.match_date,
            // carried through for de-dup below, stripped before return
            _dedupKey:  r.lic_nbr,
          }
        })
        .filter(e => e.total <= 1200 && e.total > 0)  // guard: max 4 × 300 = 1200

      // De-duplicate per player — keeps only their best match performance
      // within the window (the query above is already sorted by total desc).
      const seen = new Set<string>()
      return entries
        .filter(e => {
          if (seen.has(e._dedupKey)) return false
          seen.add(e._dedupKey)
          return true
        })
        .slice(0, 15)
        .map(({ _dedupKey, ...rest }) => { void _dedupKey; return rest satisfies BitsTopScore })
    },
    staleTime: STALE.MEDIUM,
  })
}
