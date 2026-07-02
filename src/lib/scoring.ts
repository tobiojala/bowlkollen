// Banpoäng calculation per Blåboken Kap D §D 202 (8-man national series).
import { MATCH_FORMAT } from '@/lib/constants'

export type ScoringResult = {
  team_id: string
  bord: number       // 1–4
  position: number   // 1–2
  games: number[]    // per-serie scores, index 0–3
}

/**
 * Calculates banpoäng for both teams.
 *
 * §D 202 p1.3–1.4:
 *   Delmatch (per bord per serie): team with higher COMBINED 2-player score → 1 banpoäng.
 *   Kägelpoäng (per serie): team with higher total pins of all players → +1 banpoäng.
 *   Tie in either → 0 to both teams.
 *
 * Returns [homeScore, awayScore]. Maximum is 20 each
 * (4 bords × 4 serier + 1 kägelpoäng × 4 serier).
 */
export function calcBanpoang(
  homeTeamId: string,
  awayTeamId: string,
  results: ScoringResult[],
): [number, number] {
  let home = 0, away = 0

  const gameScore = (teamId: string, bord: number, pos: number, gi: number): number =>
    results.find(r => r.team_id === teamId && r.bord === bord && r.position === pos)?.games[gi] ?? 0

  // Delmatch banpoäng — one per bord per serie
  for (let bord = 1; bord <= MATCH_FORMAT.BANPAR; bord++) {
    for (let gi = 0; gi < MATCH_FORMAT.SERIES_PER_PLAYER; gi++) {
      const hc = gameScore(homeTeamId, bord, 1, gi) + gameScore(homeTeamId, bord, 2, gi)
      const ac = gameScore(awayTeamId, bord, 1, gi) + gameScore(awayTeamId, bord, 2, gi)
      if (hc === 0 && ac === 0) continue
      if (hc > ac) home++
      else if (ac > hc) away++
    }
  }

  // Kägelpoäng bonus — one per serie to team with most combined pins
  for (let gi = 0; gi < MATCH_FORMAT.SERIES_PER_PLAYER; gi++) {
    const ht = results.filter(r => r.team_id === homeTeamId).reduce((s, r) => s + (r.games[gi] ?? 0), 0)
    const at = results.filter(r => r.team_id === awayTeamId).reduce((s, r) => s + (r.games[gi] ?? 0), 0)
    if (ht === 0 && at === 0) continue
    if (ht > at) home++
    else if (at > ht) away++
  }

  return [home, away]
}

/**
 * Derives matchpoäng from banpoäng per §D 202 p1.5.
 * Most banpoäng → 2 matchpoäng. Equal → 1 each.
 */
export function calcMatchpoang(homeScore: number, awayScore: number): [number, number] {
  if (homeScore > awayScore) return [MATCH_FORMAT.MATCHPOANG_WIN, 0]
  if (awayScore > homeScore) return [0, MATCH_FORMAT.MATCHPOANG_WIN]
  return [MATCH_FORMAT.MATCHPOANG_TIE, MATCH_FORMAT.MATCHPOANG_TIE]
}
