// ── Core domain types ─────────────────────────────────────────────────────────
// Single source of truth. All pages and components import from here.

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
