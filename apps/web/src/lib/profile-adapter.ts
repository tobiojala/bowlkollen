// Real-data adapter — turns Supabase `match_results` into the canonical
// `ProfileData` the redesigned profile sections render from.
//
// This is the bridge that lets the real /players/[id] route reuse the exact
// same components as the /mockup design: map rows → ProfileMatch[], then hand
// off to buildProfileData() for the stat math. W/L, opponent and home/away are
// derived the same way the old PlayerMatchLog did, so nothing drifts.

import type { MatchResult, BitsPlayerMatchRow } from '@/lib/types'
import { buildProfileData, type ProfileData, type ProfileMatch } from '@/lib/profile'

/** Swedish short display date, e.g. "14 sep". */
function displayDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

/**
 * Map raw match results (any order) to ProfileMatch[], oldest first.
 * Only results with at least one real game (> 0) are kept. Opponent, result
 * and home/away are computed relative to the player's `teamId`.
 */
export function resultsToProfileMatches(
  results: MatchResult[],
  teamId: string | null | undefined,
): ProfileMatch[] {
  return results
    .map(r => {
      const games = (r.games ?? []).filter(g => g > 0)
      const m = r.matches
      const isHome = !!m && m.home_team_id === teamId
      const opp = m ? (isHome ? m.away?.name : m.home?.name) ?? '—' : '—'

      // Result relative to the player's team: "W 6–2" | "L 3–5" | "D 4–4".
      const hs = m?.home_score, as = m?.away_score
      let result = ''
      if (hs != null && as != null) {
        const mine = isHome ? hs : as
        const theirs = isHome ? as : hs
        const letter = mine === theirs ? 'D' : mine > theirs ? 'W' : 'L'
        result = `${letter} ${mine}–${theirs}`
      }

      const pm: ProfileMatch = { date: displayDate(m?.date), opp, result, games, home: isHome }
      return { iso: m?.date ?? '', pm }
    })
    .filter(x => x.pm.games.length > 0)
    .sort((a, b) => a.iso.localeCompare(b.iso))   // chronological, oldest first
    .map(x => x.pm)
}

/**
 * Build canonical ProfileData straight from raw match results.
 * `lastSeasonAvg` (computed by the caller from the previous season) flows
 * through to the season-projection and duel math.
 */
export function buildProfileFromResults(
  results: MatchResult[],
  teamId: string | null | undefined,
  opts: { lastSeasonAvg?: number } = {},
): ProfileData {
  return buildProfileData(resultsToProfileMatches(results, teamId), opts)
}

/**
 * Map real BITS match-history rows (get_player_match_history()) to
 * ProfileMatch[], oldest first. Result is "W 6–2" style from board points
 * (homePoints/awayPoints), matching resultsToProfileMatches()'s convention —
 * not the raw pin total.
 */
export function bitsRowsToProfileMatches(rows: BitsPlayerMatchRow[]): ProfileMatch[] {
  return rows
    .map(r => {
      const games = r.series.filter(g => g > 0)
      const hp = r.homePoints, ap = r.awayPoints
      let result = ''
      if (hp != null && ap != null) {
        const mine   = r.isHomeTeam ? hp : ap
        const theirs = r.isHomeTeam ? ap : hp
        const letter = mine === theirs ? 'D' : mine > theirs ? 'W' : 'L'
        result = `${letter} ${mine}–${theirs}`
      }
      const pm: ProfileMatch = { date: displayDate(r.matchDate), opp: r.opponentName, result, games, home: r.isHomeTeam }
      return { iso: r.matchDate, pm }
    })
    .filter(x => x.pm.games.length > 0)
    .sort((a, b) => a.iso.localeCompare(b.iso))
    .map(x => x.pm)
}

/** Build canonical ProfileData straight from real BITS match-history rows. */
export function buildProfileFromBitsRows(
  rows: BitsPlayerMatchRow[],
  opts: { lastSeasonAvg?: number } = {},
): ProfileData {
  return buildProfileData(bitsRowsToProfileMatches(rows), opts)
}
