// BK Rating engine — Bowlkollen's own performance metric.
//
// Core idea: measure every game against the field that bowled the same
// hall, same oil, same night ("mot fältet") instead of raw pins, then
// express a player as a 0-100 percentile within their league across four
// pillars: Grund, Form, Tryck, Stabilitet.
//
// Full design + worked example: BK_RATING_SPEC.md

import { BK_RATING } from '@/lib/constants'
import type { RatedGame, GameSource, BkPillars, BkRatingResult } from '@/lib/types'

const SOURCE_WEIGHT: Record<GameSource, number> = {
  sanctioned:    BK_RATING.SOURCE_WEIGHTS.SANCTIONED,
  verified:      BK_RATING.SOURCE_WEIGHTS.VERIFIED,
  self_reported: BK_RATING.SOURCE_WEIGHTS.SELF_REPORTED,
}

function sourceWeight(g: RatedGame): number {
  return SOURCE_WEIGHT[g.source ?? 'sanctioned']
}

/** Pins above/below the field for one game. */
function residual(g: RatedGame): number {
  return g.score - g.fieldAvg
}

function weightedMean(values: number[], weights: number[]): number {
  const wSum = weights.reduce((a, b) => a + b, 0)
  if (wSum === 0) return 0
  return values.reduce((acc, v, i) => acc + v * weights[i], 0) / wSum
}

/**
 * Season "mot fältet": confidence-weighted average of pins vs the field.
 * Self-reported games are excluded — they may only influence Form.
 */
export function motFaltet(games: RatedGame[]): number {
  const eligible = games.filter(g => (g.source ?? 'sanctioned') !== 'self_reported')
  if (eligible.length === 0) return 0
  return weightedMean(eligible.map(residual), eligible.map(sourceWeight))
}

/**
 * Form: recency-weighted "mot fältet". A game `FORM_HALF_LIFE_GAMES` back
 * counts half as much as the latest one. All sources allowed (downweighted).
 */
export function formMotFaltet(games: RatedGame[]): number {
  if (games.length === 0) return 0
  const latest = Math.max(...games.map(g => g.seq))
  const weights = games.map(g =>
    sourceWeight(g) * Math.pow(0.5, (latest - g.seq) / BK_RATING.FORM_HALF_LIFE_GAMES)
  )
  return weightedMean(games.map(residual), weights)
}

/**
 * Tryck: "mot fältet" in deciding games only. Players without any deciders
 * fall back to their season value — no data is not a weakness.
 */
export function tryckMotFaltet(games: RatedGame[]): number {
  const deciders = games.filter(g => g.decider && (g.source ?? 'sanctioned') !== 'self_reported')
  if (deciders.length === 0) return motFaltet(games)
  return weightedMean(deciders.map(residual), deciders.map(sourceWeight))
}

/**
 * Stabilitet: negated standard deviation of the field residuals — a tight
 * spread scores high. Uses residuals (not raw scores) so a player who is
 * consistent relative to conditions is rewarded even across hard nights.
 */
export function stabilitet(games: RatedGame[]): number {
  const eligible = games.filter(g => (g.source ?? 'sanctioned') !== 'self_reported')
  if (eligible.length < 2) return 0
  const res  = eligible.map(residual)
  const mean = res.reduce((a, b) => a + b, 0) / res.length
  const sd   = Math.sqrt(res.reduce((a, v) => a + (v - mean) ** 2, 0) / res.length)
  return -sd
}

/**
 * Percentile (0-100) of `value` within `population`.
 * 100 = better than everyone, 50 = middle of the league.
 */
export function percentile(value: number, population: number[]): number {
  if (population.length === 0) return 50
  const below = population.filter(v => v < value).length
  const equal = population.filter(v => v === value).length
  // Midpoint treatment of ties keeps a lone player at 50, not 0 or 100.
  return Math.round(((below + equal / 2) / population.length) * 100)
}

/**
 * Full BK Rating for one player within a league.
 *
 * `league` is every player's games (including this player's) — the
 * population each pillar is percentiled against.
 */
export function calcBkRating(playerGames: RatedGame[], league: RatedGame[][]): BkRatingResult {
  const metrics = (gs: RatedGame[]) => ({
    grund:      motFaltet(gs),
    form:       formMotFaltet(gs),
    tryck:      tryckMotFaltet(gs),
    stabilitet: stabilitet(gs),
  })

  const player = metrics(playerGames)
  const pop    = league.map(metrics)

  const pillars: BkPillars = {
    grund:      percentile(player.grund,      pop.map(p => p.grund)),
    form:       percentile(player.form,       pop.map(p => p.form)),
    tryck:      percentile(player.tryck,      pop.map(p => p.tryck)),
    stabilitet: percentile(player.stabilitet, pop.map(p => p.stabilitet)),
  }

  const { GRUND, FORM, TRYCK, STABILITET } = BK_RATING.WEIGHTS
  const total = Math.round(
    pillars.grund * GRUND + pillars.form * FORM +
    pillars.tryck * TRYCK + pillars.stabilitet * STABILITET
  )

  return { total, pillars, motFaltet: Math.round(motFaltet(playerGames) * 10) / 10 }
}
