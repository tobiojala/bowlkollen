// ── App ───────────────────────────────────────────────────────────────────────
export const APP_NAME        = 'Bowlkollen'
export const APP_DESCRIPTION = 'Live bowling — svenska ligan'
export const APP_LOCALE      = 'sv-SE'

// ── Scoring thresholds ────────────────────────────────────────────────────────
// A single place to change what counts as a "good", "great", or "perfect" game.
export const SCORE = {
  HONOR_ROLL:   220,   // minimum single-game score for honor roll
  GOOD:         200,   // green highlight (a positive game)
  GREAT:        220,   // share-worthy game
  ELITE:        250,   // gold milestone highlight
  PERFECT:      300,   // perfect game — 12 strikes in a serie (Blåboken Kap C, §C 1)
  MIN:            0,   // lowest possible game score
  SERIES_HIGH:   840,  // 4-serie match averaging 210/game — gold highlight in feed
  SERIES_STRONG: 720,  // 4-serie match averaging 180/game — green highlight in feed
} as const

// A bowling serie (game) is ten frames (Blåboken Kap C, §C 1)
export const FRAMES_PER_GAME = 10

// ── Age classes — by CALENDAR YEAR, not birth date (Blåboken Kap K, §K 8) ─────
// "till och med det kalenderår under vilket spelaren fyller X år" → a birth
// YEAR is sufficient to classify; full birth date isn't required. See BLABOKEN.md.
export const AGE_CLASS = {
  UNGDOM_MAX:  16,   // ungdom (youth): through the year the player turns 16
  JUNIOR_MAX:  21,   // junior: through the year they turn 21
  OLDBOYS_MIN: 55,   // oldboys/girls: from the year they turn 55
  VETERAN_MIN: 65,   // veteran: from the year they turn 65
} as const

// ── National series team match format (Blåboken Kap D, §D 201–202) ────────────
export const MATCH_FORMAT = {
  TEAM_SIZE:               8,   // start-åtta — eight players (8-man national series)
  SERIES_PER_PLAYER:       4,   // four serier per player
  BANPAR:                  4,   // four lane pairs
  MAX_BANPOANG_PER_SERIE:  5,   // 4 delmatcher + 1 for highest combined pins
  MAX_BANPOANG_PER_MATCH: 20,   // 4 serier × 5
  MATCHPOANG_WIN:          2,   // most banpoäng → 2 matchpoäng …
  MATCHPOANG_TIE:          1,   // … equal banpoäng → 1 each
} as const

// ── Player rating tier thresholds ─────────────────────────────────────────────
export const RATING = {
  LEGEND:  95,
  ELITE:   85,
  PRO:     75,
  VETERAN: 60,
  // < 60 = ROOKIE
} as const

// ── BK Rating engine ──────────────────────────────────────────────────────────
// Pillar weights must sum to 1. See BK_RATING_SPEC.md for the full design.
export const BK_RATING = {
  WEIGHTS: {
    GRUND:      0.50,  // percentile of season "mot fältet"
    FORM:       0.25,  // recency-weighted "mot fältet"
    TRYCK:      0.15,  // "mot fältet" in deciding games
    STABILITET: 0.10,  // consistency (low spread)
  },
  // Confidence weighting per data source. Self-reported scores only ever
  // influence the Form pillar — never Grund.
  SOURCE_WEIGHTS: {
    SANCTIONED:    1.0,   // BITS league play + sanctioned competitions
    VERIFIED:      0.5,   // non-sanctioned comps verified via hall / Bowlkollen live scoring
    SELF_REPORTED: 0.2,
  },
  FORM_HALF_LIFE_GAMES: 8,  // a game 8 games ago counts half as much toward Form
} as const

// ── Season boundaries (Swedish bowling year: 1 Jul – 30 Jun) ─────────────────
export const SEASON = {
  CURRENT: '2026-07-01',
  PREV:    '2025-07-01',
} as const

// ── Divisions shown in the main standings table ───────────────────────────────
export const STANDINGS_DIVISIONS = ['Elitserien Herrar', 'Elitserien Damer'] as const

// ── Query / pagination defaults ───────────────────────────────────────────────
export const QUERY = {
  HOME_MATCH_WINDOW_DAYS: 7,
  HOME_MATCHES_LIMIT:     40,
  HOME_UPCOMING_LIMIT:    15,
  TEAM_MATCHES_LIMIT:     40,
  HONOR_ROLL_LIMIT:       12,
  SEARCH_MIN_CHARS:       2,
} as const

// ── Stale times (ms) — how long React Query considers data fresh ──────────────
export const STALE = {
  LIVE:      20_000,   // match scores — refresh quickly
  SHORT:     30_000,   // home feed
  DEFAULT:   60_000,   // most lists
  MEDIUM:  5 * 60_000, // standings, session
  LONG:   10 * 60_000, // player claims, slow-moving data
} as const

// ── Protected routes — middleware redirects unauthenticated users ─────────────
export const PROTECTED_PATHS = [
  '/profile',
  '/admin',
  '/team',      // covers /team/[id]/intern, /team/[id]/laguttagning, etc.
] as const

// ── Soft-launch invite gate — reachable without an invite link or session ────
export const GATE_EXEMPT_PATHS = [
  '/landing',
  '/legal',
  '/login',
  '/reset-password',
  '/invite',
  '/api',
] as const

// ── Canonical site URL — the single source for metadata, OG, canonical + share ─
// links. Override per deploy with NEXT_PUBLIC_SITE_URL (preview builds); defaults
// to the production domain. SITE_HOST is the bare host for display copy.
export const SITE_URL  = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bowlkollen.se').replace(/\/+$/, '')
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '')

// ── Auto-Story Engine ─────────────────────────────────────────────────────────

export const TEAM_EVENT = {
  // How many events syncTeamEvents may INSERT in a single page-load call
  MAX_INSERT_PER_SYNC: 10,

  // Thresholds for win streak milestone events
  WIN_STREAK_MILESTONES: [3, 5, 7, 10] as const,

  // Thresholds for unbeaten run milestone events
  UNBEATEN_MILESTONES: [4, 6, 8, 10] as const,

  // Player match count milestones
  PLAYER_MATCH_MILESTONES: [10, 25, 50, 100] as const,

  // form_rising fires when recentAvg - seasonAvg exceeds this
  FORM_RISING_DELTA: 8,

  // giant_killer fires when opponent is this many table positions above the team
  GIANT_KILLER_GAP: 5,

  // match_preview is created when match is this many hours away
  MATCH_PREVIEW_HOURS: 48,

  // Captain has this many hours to set a match hero before auto-default kicks in
  HERO_TAP_WINDOW_HOURS: 24,

  // Captain note max length (enforced in DB too)
  CAPTAIN_NOTE_MAX_LENGTH: 140,
} as const

// Narrative archetype conditions (used in computeTeamNarrative)
export const NARRATIVE = {
  // Points gap within which playoff push archetype fires (team within N pts of top 2)
  PLAYOFF_PUSH_GAP: 4,
  PLAYOFF_PUSH_MIN_REMAINING: 3,

  // Matches remaining threshold for promotion/relegation archetypes
  ENDGAME_MATCHES_REMAINING: 5,

  // Win streak length to trigger dominant_form (if no promotion/playoff signal)
  DOMINANT_FORM_STREAK: 4,

  // Comeback: wins after a loss run
  COMEBACK_WIN_STREAK: 3,
  COMEBACK_LOSS_RUN: 3,
} as const
