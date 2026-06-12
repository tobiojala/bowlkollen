/**
 * Sport configuration layer.
 *
 * Every string a user sees that is sport-specific comes from here.
 * Components never hardcode sport names, units, or labels — they read
 * these values so the same code works for bowling, floorball, or anything else.
 *
 * Phase 1: bowling. Phase 2: swap config + redeploy.
 */
export type SportConfig = {
  /** Display name of the sport. */
  name: string
  /** Singular event label, lowercase. e.g. "match", "game", "race" */
  eventLabel: string
  /** Plural event label, lowercase. e.g. "matcher", "spel", "lopp" */
  eventsLabel: string
  /** Label shown when today has scheduled events. e.g. "Matchdag" */
  matchDayLabel: string
  /** Emoji used as a soft accent in greetings. */
  emoji: string
  /** Route to the full schedule / fixture list. */
  schedulePath: string
  /** Route to the standings / league table. */
  standingsPath: string
  /** Route to the club / team directory. */
  teamsPath: string
}

export const BOWLING_CONFIG: SportConfig = {
  name:          'Bowling',
  eventLabel:    'match',
  eventsLabel:   'matcher',
  matchDayLabel: 'Matchdag',
  emoji:         '🎳',
  schedulePath:  '/tavlingar',
  standingsPath: '/teams',
  teamsPath:     '/teams',
}

/** The sport this deployment serves. Swap this in Phase 2. */
export const APP_SPORT: SportConfig = BOWLING_CONFIG
