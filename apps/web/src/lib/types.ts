// ── Core domain types — single source of truth; all pages/components import here ─

export type MatchStatus = 'live' | 'completed' | 'upcoming'

// Lightweight reference used in joined queries
export type TeamRef = { id: string; name: string }
export type PlayerRef = { id: string; name: string; team_id?: string | null }

export type Team = {
  id: string
  name: string
  club: string
  city: string | null
  slug: string | null
  club_slug: string | null
  division: string | null
  description: string | null
  contact_email: string | null
  contact_phone: string | null
  home_hall: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  logo_url: string | null
}

export type Player = {
  id: string
  name: string
  team_id: string | null
  bio: string | null
  hand: string | null
  style: string | null
  hometown: string | null
  ball_brand: string | null
  avatar_url: string | null
  instagram: string | null
  facebook: string | null
  youtube: string | null
  favorite_center: string | null
  achievements: string[] | null
}

export type Match = {
  id: string
  date: string
  status: MatchStatus
  division: string
  home_score: number | null
  away_score: number | null
  home_team_id?: string
  away_team_id?: string
  round?: number | null
  venue?: string | null
  home: TeamRef
  away: TeamRef
  // Optional enrichment (live/detailed view) — camelCase intentional, these are UI-layer fields
  streams?: { url: string }[]
  oilProfile?: string | null
  gameNumber?: number | null
  totalGames?: number | null
  individualGames?: { home: number[]; away: number[] }
  highSeries?: { playerName: string; score: number; team: 'home' | 'away' }[]
}

// ── BITS (national SvBF data) ─────────────────────────────────────────────────

export type BitsMatchFeed = {
  bits_match_id:     number
  match_date:        string          // 'YYYY-MM-DD'
  division_name:     string | null
  bits_division_id:  number | null
  home_team_name:    string
  away_team_name:    string
  home_bits_team_id: number
  away_bits_team_id: number
  home_result:       number | null   // board points won (0-8)
  away_result:       number | null
  home_score:        number | null   // total pinfall
  away_score:        number | null
  is_finished:       boolean
  hall_name:         string | null
  hall_city:         string | null
}

export type BitsMatchDetail = BitsMatchFeed & {
  season_id:      number
  match_datetime: string | null   // real kickoff wall-clock (naive Swedish local)
  oil_pattern:  string | null
  round_id:     number | null
  scores_synced: boolean
}

export type BitsPlayerScore = {
  id:            number
  bits_match_id: number
  player_name:   string   // full name when resolved server-side, else BITS abbreviation
  serie:         number
  board:         number
  score:         number
  order_index:   number
  is_home_team:  boolean | null
}

// Exact per-player match result from BITS' own authoritative source
// (matchResult/GetMatchResults) — full name + licence, zero ambiguity.
export type BitsMatchPlayerResult = {
  id:            number
  bits_match_id: number
  lic_nbr:       string   // BITS internal identity key — never shown in UI
  player_name:   string   // full name, exact
  is_home_team:  boolean
  series:        number[]
  total_result:  number
  public_id?:    string | null  // bits_players.public_id, joined in for profile links
  season_avg?:   number | null  // player's season serie-average, for snitt-deltas (Pro)
}

export type BitsTopScore = {
  matchId:    number
  playerName: string         // full name when resolved via bits_lic_nbr, else BITS abbreviation
  average:    number | null  // registered SvBF average, when resolved — never the license number itself
  total:      number
  series:     number[]   // per-serie totals, length 1-4
  isHome:     boolean
  division:   string
  opponent:   string
  date:       string
  publicId:   string | null  // bits_players.public_id, for linking to the profile page
}

// Public, non-PII player identity — result of get_player_identity(), which
// joins on lic_nbr server-side. lic_nbr itself never appears in this shape.
export type BitsPlayerIdentity = {
  publicId:        string
  name:            string
  clubName:        string | null
  licenceAverage:  number | null
  licenceSkillLvl: number | null
  isJunior:        boolean
  isClaimed:       boolean
}

// One real match result for a player, from get_player_match_history().
// homePoints/awayPoints are board points (0-8), not raw pin totals.
export type BitsPlayerMatchRow = {
  matchDate:     string
  divisionName:  string | null
  opponentName:  string
  isHomeTeam:    boolean
  series:        number[]
  totalResult:   number
  homePoints:    number | null
  awayPoints:    number | null
  seasonId:      number
}

// One real match from get_user_season_matches() — scoped to the divisions
// the logged-in user's followed players/teams (or own verified claim)
// appear in. Falls back to Elitserien (isPersonalized: false) when none
// of those exist yet, rather than showing nothing.
export type SeasonMatch = {
  bitsMatchId:     number
  matchDate:       string
  roundId:         number | null
  homeTeamName:    string
  awayTeamName:    string
  homeScore:       number | null
  awayScore:       number | null
  divisionName:    string | null
  isFinished:      boolean
  hallName:        string | null
  isPersonalized:  boolean
}

export type MatchResult = {
  id: string
  player_id: string
  match_id: string
  team_id?: string | null
  bord?: number | null
  position?: number | null
  games: number[]
  player?: PlayerRef | null
  matches?: {
    id: string
    date: string
    division: string
    home_team_id: string
    away_team_id: string
    home_score: number | null
    away_score: number | null
    home: { name: string }
    away: { name: string }
  } | null
}

export type Lineup = {
  id: string
  team_id: string
  player_name: string
  bord: number
  position: number
}

export type Post = {
  id: string
  team_id: string
  user_id: string
  type: 'news' | 'lineup' | 'general'
  content: string
  created_at: string
  author?: string | null
}

// ── Computed / view types ─────────────────────────────────────────────────────

export type HonorEntry = {
  playerName: string
  score: number
  matchId: string
  seriesTotal?: number
}

export type FormResult = 'W' | 'D' | 'L'

export type TableRow = {
  rank: number
  teamId: string
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  points: number
  form: FormResult[]   // last 5 results, most recent first
}

export type StandingsMatch = {
  home_team_id: string
  away_team_id: string
  home_score: number | null
  away_score: number | null
  division: string
  date?: string        // used for last-5 form calculation
  home: TeamRef
  away: TeamRef
}

export type TierInfo = {
  label: string
  accent: string
  glow: string
  bg: string
  border: string
}

// ── Momentum types ────────────────────────────────────────────────────────────

export type MomentumLevel = 'rising' | 'stable' | 'slumping'

export type PlayerMomentum = {
  seasonAvg: number
  recentAvg: number   // avg over last 3 team matches
  delta:     number   // recentAvg - seasonAvg
  level:     MomentumLevel
}

// ── Sponsor types ──────────────────────────────────────────────────────────────

export type SponsorTier = 'main' | 'gold' | 'silver' | 'partner'

export type Sponsor = {
  id: string
  team_id: string
  name: string
  logo_url: string | null
  website: string | null
  tagline: string | null
  tier: SponsorTier
  display_order: number
}

// ── Auto-Story Engine types ───────────────────────────────────────────────────

export type TeamEventType =
  | 'match_result'
  | 'win_streak'
  | 'unbeaten_run'
  | 'personal_best'
  | 'player_milestone'
  | 'form_rising'
  | 'division_climbed'
  | 'match_preview'
  | 'lineup_announced'
  | 'comeback_win'
  | 'revenge_win'
  | 'giant_killer'
  | 'rivalry_match'
  | 'promotion_clinched'
  | 'captain_post'

export type ReactionType = 'fire' | 'heart' | 'clap' | 'sad'

// payload shapes per event type
export type MatchResultPayload = {
  opponent_id: string
  opponent_name: string
  my_score: number
  opp_score: number
  is_home: boolean
  division: string
  result: 'W' | 'D' | 'L'
  top_scorer: { player_id: string; name: string; high_game: number } | null
  my_series?: number[]; my_pins?: number | null; opp_pins?: number | null   // serie bars + total-pinfall context for a banpoäng sweep
}

export type StreakPayload = {
  streak_length: number
  previous_best: number
  is_season_best: boolean
}

export type PersonalBestPayload = {
  player_id: string
  player_name: string
  new_best: number
  previous_best: number
  match_id: string
}

export type PlayerMilestonePayload = {
  player_id: string
  player_name: string
  milestone: 10 | 25 | 50 | 100
  total_matches: number
}

export type FormRisingPayload = {
  player_id: string
  player_name: string
  delta: number
  recent_avg: number
  season_avg: number
  match_avgs?: number[]   // per-match averages (oldest → newest) for the sparkline
}

export type DivisionClimbedPayload = {
  new_position: number
  old_position: number
  total_teams: number
  division: string
  points: number
}

export type MatchPreviewPayload = {
  opponent_id: string
  opponent_name: string
  match_date: string
  is_home: boolean
  venue: string | null
  h2h_wins: number
  h2h_losses: number
  h2h_draws: number
  opponent_form: ('W' | 'D' | 'L')[]
}

export type LineupAnnouncedPayload = {
  match_id: string
  match_date: string
  opponent_name: string
  is_home: boolean
  players: { id: string; name: string; position: number }[]
}

export type CaptainPostPayload = {
  text: string
}

export type TeamEventPayload =
  | MatchResultPayload
  | StreakPayload
  | PersonalBestPayload
  | PlayerMilestonePayload
  | FormRisingPayload
  | DivisionClimbedPayload
  | MatchPreviewPayload
  | LineupAnnouncedPayload
  | CaptainPostPayload
  | Record<string, unknown>  // fallback for future event types

export type TeamEventReaction = {
  id: string
  event_id: string
  user_id: string
  reaction: ReactionType
  created_at: string
}

export type TeamEvent = {
  id: string
  team_id: string
  bits_team_id?: number | null
  team?: { id: string; name: string }
  event_type: TeamEventType
  event_date: string        // ISO date string
  title: string
  body: string | null
  payload: TeamEventPayload
  featured_player_id: string | null
  match_id: string | null
  captain_note: string | null
  is_pinned: boolean
  is_hidden: boolean
  created_at: string
  reactions?: TeamEventReaction[]
}

// ── Narrative Layer types ─────────────────────────────────────────────────────

export type NarrativeArchetype =
  | 'promotion_chase'
  | 'playoff_push'
  | 'dominant_form'
  | 'comeback_run'
  | 'relegation_battle'
  | 'survival_confirmed'
  | 'rivalry_match'
  | 'revenge_opportunity'
  | 'midseason'

export type TeamNarrative = {
  archetype: NarrativeArchetype
  headline: string   // e.g. "2 poäng från seriesegern — 3 matcher kvar"
  subtext: string    // secondary context line
}

// ── BK Rating ─────────────────────────────────────────────────────────────────

/** Where a rated game came from — controls its confidence weight. */
export type GameSource = 'sanctioned' | 'verified' | 'self_reported'

/** One game as the BK Rating engine sees it. */
export type RatedGame = {
  score: number
  /** Field average for the same hall, same oil, same night. */
  fieldAvg: number
  /** Chronological order, 0 = oldest. */
  seq: number
  /** True when this game could decide the match (e.g. S4 with the match level). */
  decider?: boolean
  source?: GameSource
}

export type BkPillars = {
  grund: number       // 0-100 percentile
  form: number        // 0-100 percentile
  tryck: number       // 0-100 percentile
  stabilitet: number  // 0-100 percentile
}

export type BkRatingResult = {
  total: number          // 0-100
  pillars: BkPillars
  /** Season "mot fältet" — average pins above/below the field. */
  motFaltet: number
}

// ── Follow system ─────────────────────────────────────────────────────────────

export type FollowEntityType = 'player' | 'team' | 'division'

export type Follow = {
  id: string
  user_id: string
  entity_type: FollowEntityType
  entity_id: string
  created_at: string
}

/** Enriched follow row — entity name resolved from the relevant table */
export type FollowWithName = Follow & {
  name: string
}

// ── Onboarding suggestions ──────────────────────────────────────────────────

export type AnonViewSuggestion = {
  entityType: FollowEntityType
  entityId:   string
  viewedAt:   string
}

export type TeamSuggestion = {
  bitsTeamId: number
  name:       string
  clubName:   string | null
  reason:     'division' | 'county'
}

export type PlayerSuggestionTier = 'teammate' | 'elitserien_regional' | 'division_rival'

export type PlayerSuggestion = {
  publicId:        string
  name:            string
  licenceAverage:  number | null
  tier:            PlayerSuggestionTier
}

export type OnboardingSuggestions = {
  teams:   TeamSuggestion[]
  players: PlayerSuggestion[]
}

// ── Personalized feed ─────────────────────────────────────────────────────────

export type FeedPlayerResult = {
  kind: 'player_result'
  playerId: string
  playerName: string
  matchId: string
  date: string
  total: number
  games: number[]
  division: string
  opponent?: string
}

export type FeedTeamMatch = {
  kind: 'team_match'
  matchId: string
  date: string
  status: string
  division: string
  homeId: string
  homeName: string
  awayId: string
  awayName: string
  homeScore: number | null
  awayScore: number | null
}

export type FeedItem = FeedPlayerResult | FeedTeamMatch
