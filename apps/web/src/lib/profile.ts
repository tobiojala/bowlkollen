// Profile data adapter — the single shape every profile section renders from.
//
// Both the design mockup (mock data) and the real /players/[id] route build a
// `ProfileData` and feed it to the same section components, so the two can
// never drift apart. Stat math lives here once.

export type ProfileMatch = {
  date: string        // display date, e.g. "14 sep"
  opp: string         // opponent display name
  result: string      // "W 6–2" | "L 3–5" | "D 4–4"
  games: number[]
  home: boolean
}

export type ProfileIdentity = {
  name: string
  initials: string
  teamLabel: string   // "Örebro BK · Elitserien"
  followers: number
  following: number
  isJunior: boolean
  isClaimed: boolean
}

// View-model types for the surrounding layers (match-data sheets, feed, DNA).
// Sections take these as props so they never import mock data directly.

/** An upcoming fixture (powers the prediction fan in the curve sheet). */
export type ProfileUpcoming = { date: string; opp: string }

/** A highlight marker on a DNA spoke / its match sheet. */
export type ProfileHighlight = {
  idx: number; label: string; sublabel: string; color: string; iconName: string
}

/** A gamification challenge shown in the feed. */
export type ProfileChallenge = {
  icon: string; title: string; desc: string; progress: number; cur: string; done: boolean
}

/** Social reactions keyed by match index. */
export type ProfileReactions = Record<number, { flame: number; heart: number }>

export type ProfileData = {
  matches: ProfileMatch[]          // chronological, oldest first
  matchAvgs: number[]
  seasonAvg: number
  recentAvg: number
  formDiff: number
  bestSeries: number
  bestSeriesIdx: number
  over200: number
  over250: number
  hitRate: number
  consistency: string
  sd: number
  streakAvg: { current: number; best: number }
  streak200: { current: number; best: number }
  gameAvgs: number[]
  lastSeasonAvg: number
  projSeasonAvg: number
  projDiff: number
  hasData: boolean
}

function mean(a: number[]) { return a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0 }

export function stdDev(a: number[]) {
  if (!a.length) return 0
  const m = a.reduce((x, y) => x + y, 0) / a.length
  return Math.round(Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length))
}

export function streaks(games: number[], t: number) {
  let best = 0, run = 0
  for (const g of games) { if (g >= t) { run++; best = Math.max(best, run) } else run = 0 }
  let current = 0
  for (let i = games.length - 1; i >= 0; i--) { if (games[i] >= t) current++; else break }
  return { current, best }
}

export function consistencyLabel(sd: number): string {
  return sd < 20 ? 'Konsekvent' : sd < 30 ? 'Stabil' : sd < 40 ? 'Varierad' : 'Explosiv'
}

/** Per game-position averages (S1..Sn) across matches that have a full series. */
export function gamePositionAvgs(matches: ProfileMatch[]): number[] {
  const n = matches[0]?.games.length ?? 0
  if (!n) return []
  const full = matches.filter(m => m.games.filter(g => g > 0).length >= n)
  if (!full.length) return []
  return Array.from({ length: n }, (_, i) => mean(full.map(m => m.games[i] || 0)))
}

/**
 * Build the canonical ProfileData from normalized matches (oldest first).
 * `lastSeasonAvg` is optional; falls back to a sensible value when absent.
 */
export function buildProfileData(
  matches: ProfileMatch[],
  opts: { lastSeasonAvg?: number } = {},
): ProfileData {
  const allGames  = matches.flatMap(m => m.games.filter(g => g > 0))
  const hasData   = allGames.length > 0
  const matchAvgs = matches.map(m => mean(m.games.filter(g => g > 0)))
  const seasonAvg = mean(allGames)

  const seriesTots   = matches.map(m => m.games.filter(g => g > 0).reduce((a, b) => a + b, 0))
  const bestSeries   = seriesTots.length ? Math.max(...seriesTots) : 0
  const bestSeriesIdx = seriesTots.indexOf(bestSeries)

  const over200 = allGames.filter(g => g >= 200).length
  const over250 = allGames.filter(g => g >= 250).length
  const hitRate = hasData ? Math.round((over200 / allGames.length) * 100) : 0

  const recent4   = matches.slice(-4).flatMap(m => m.games.filter(g => g > 0))
  const recentAvg = mean(recent4)
  const formDiff  = hasData ? recentAvg - seasonAvg : 0

  const sd          = stdDev(allGames)
  const consistency = consistencyLabel(sd)

  const lastSeasonAvg = opts.lastSeasonAvg ?? Math.max(0, seasonAvg - 5)

  // Project 3 future matches at current form (matches existing hero math).
  const projSeasonAvg = matchAvgs.length
    ? Math.round((matchAvgs.reduce((a, b) => a + b, 0) + recentAvg * 3) / (matchAvgs.length + 3))
    : seasonAvg
  const projDiff = projSeasonAvg - seasonAvg

  return {
    matches, matchAvgs, seasonAvg, recentAvg, formDiff,
    bestSeries, bestSeriesIdx, over200, over250, hitRate, consistency, sd,
    streakAvg: streaks(allGames, seasonAvg),
    streak200: streaks(allGames, 200),
    gameAvgs: gamePositionAvgs(matches),
    lastSeasonAvg, projSeasonAvg, projDiff, hasData,
  }
}

// ── Trend points for the ProfileTrend graph (mirror native) ───────────────────
import { calcRating } from './player-stats'

export type TrendPoint = { avg: number; date: string; label: string }

/** Running BITS-style average (total pins ÷ games after each match) — smooth. */
export function cumulativeAvgPoints(matches: ProfileMatch[]): TrendPoint[] {
  const games: number[] = []
  const out: TrendPoint[] = []
  for (const m of matches) {
    const g = m.games.filter((x) => x > 0)
    if (!g.length) continue
    games.push(...g)
    out.push({ avg: mean(games), date: m.date, label: m.opp })
  }
  return out
}

/** Rolling BK-rating recomputed after each match on all games so far (ours). */
export function rollingRatingPoints(matches: ProfileMatch[]): TrendPoint[] {
  const games: number[] = []
  const out: TrendPoint[] = []
  for (const m of matches) {
    const g = m.games.filter((x) => x > 0)
    if (!g.length) continue
    games.push(...g)
    out.push({ avg: calcRating(mean(games), Math.max(...games), games.filter((x) => x >= 200).length, true), date: m.date, label: m.opp })
  }
  return out
}

/** Raw per-match average (jagged) — the PROFIL-PULS line. */
export function matchTrendPoints(matches: ProfileMatch[]): TrendPoint[] {
  return matches
    .map((m) => { const g = m.games.filter((x) => x > 0); return { avg: g.length ? mean(g) : 0, date: m.date, label: m.opp } })
    .filter((p) => p.avg > 0)
}
