import type { MatchResult, TierInfo } from '@/lib/types'
export type { MatchResult, TierInfo }
import { SEASON } from '@/lib/constants'

// Legacy aliases — existing code compiles unchanged.
export const SEASON_CURRENT = SEASON.CURRENT
export const SEASON_PREV    = SEASON.PREV

export function seasonResults(results: MatchResult[], season: 'current' | 'prev') {
  if (season === 'current')
    return results.filter(r => (r.matches?.date ?? '') >= SEASON_CURRENT)
  return results.filter(r => {
    const d = r.matches?.date ?? ''
    return d >= SEASON_PREV && d < SEASON_CURRENT
  })
}

// ── Core stat helpers ─────────────────────────────────────────────────────────
export function validGames(results: MatchResult[]) {
  return results.flatMap(r => (r.games ?? []).filter(g => g > 0))
}

export function matchAvgs(results: MatchResult[]) {
  return results
    .map(r => {
      const g = (r.games ?? []).filter(g => g > 0)
      return g.length ? Math.round(g.reduce((a, b) => a + b) / g.length) : null
    })
    .filter((v): v is number => v !== null)
}

export function gamePositionAvgs(results: MatchResult[]): number[] {
  const valid = results.filter(r => (r.games ?? []).filter(g => g > 0).length >= 4)
  if (!valid.length) return []
  return Array.from({ length: 4 }, (_, i) =>
    Math.round(valid.reduce((s, r) => s + ((r.games ?? [])[i] || 0), 0) / valid.length)
  )
}

export function stdDev(arr: number[]): number {
  if (!arr.length) return 0
  const m = arr.reduce((a, b) => a + b, 0) / arr.length
  return Math.round(Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length))
}

export function streaks(games: number[], t: number) {
  let best = 0, run = 0
  for (const g of games) { g >= t ? (run++, best = Math.max(best, run)) : (run = 0) }
  let current = 0
  for (let i = games.length - 1; i >= 0; i--) { if (games[i] >= t) current++; else break }
  return { current, best }
}

// ── Rating + tier ─────────────────────────────────────────────────────────────
export function calcRating(avg: number, best: number, over200: number, hasData: boolean) {
  if (!hasData) return Math.min(55, Math.round(avg * 0.3))
  return Math.min(99, Math.round(avg * 0.4 + (best / 40) * 0.4 + over200 * 1.5))
}

export function getTier(rating: number): TierInfo {
  if (rating >= 95) return { label: 'LEGEND',  accent: '#f5c200', glow: 'rgba(245,194,0,0.40)',   bg: 'rgba(245,194,0,0.10)',   border: 'rgba(245,194,0,0.55)' }
  if (rating >= 85) return { label: 'ELITE',   accent: '#b8a9f0', glow: 'rgba(127,119,221,0.35)', bg: 'rgba(127,119,221,0.10)', border: 'rgba(127,119,221,0.50)' }
  if (rating >= 75) return { label: 'PRO',     accent: '#5dcaa5', glow: 'rgba(29,158,117,0.30)',  bg: 'rgba(29,158,117,0.10)',  border: 'rgba(29,158,117,0.45)' }
  if (rating >= 60) return { label: 'VETERAN', accent: '#ef9f27', glow: 'rgba(186,117,23,0.28)',  bg: 'rgba(186,117,23,0.10)',  border: 'rgba(186,117,23,0.45)' }
  return               { label: 'ROOKIE',  accent: '#8899aa', glow: 'rgba(100,120,160,0.20)',  bg: 'rgba(100,120,160,0.08)', border: 'rgba(100,120,160,0.35)' }
}

// ── BK Rating percentile (simulated distribution — replace with real data later) ──
const RATING_DIST = [45,48,50,52,54,55,57,58,59,60,61,62,63,63,64,65,65,66,67,67,68,68,69,70,70,71,71,72,73,73,74,74,75,75,76,77,78,79,80,82]

export function bkTopPercent(rating: number) {
  return Math.round((1 - RATING_DIST.filter(r => r < rating).length / RATING_DIST.length) * 100)
}
export function bkBarPercent(rating: number) {
  return Math.round(RATING_DIST.filter(r => r < rating).length / RATING_DIST.length * 100)
}

// ── Rhythm ────────────────────────────────────────────────────────────────────
export function rhythmLabel(avgs: number[]): { label: string; detail: string } {
  if (avgs.length < 2) return { label: '—', detail: '' }
  const first = avgs[0], last = avgs[avgs.length - 1], max = Math.max(...avgs)
  const diff = last - first, spread = max - Math.min(...avgs)
  if (diff >= 12)    return { label: 'Stark avslutare',  detail: `+${diff}p från spel 1 till ${avgs.length}` }
  if (diff <= -12)   return { label: 'Snabbstartare',    detail: `tappar ${Math.abs(diff)}p mot slutet` }
  if (spread <= 8)   return { label: 'Järnkonsekvent',   detail: `bara ${spread}p skillnad spel 1–${avgs.length}` }
  if (avgs.indexOf(max) === 1) return { label: 'Snabbt inne', detail: 'peakar i spel 2, håller nivån' }
  return             { label: 'Varierad rytm',           detail: `spridning ${spread}p spel 1–${avgs.length}` }
}

// ── Character sentence ────────────────────────────────────────────────────────
export function characterSentence(s: {
  hitRate: number; formDiff: number; consistency: string; seasonAvg: number; bestSeries: number
}): string {
  const lead = s.hitRate >= 68 ? 'Dominant 200+-spjutspets'
    : s.hitRate >= 52 ? 'Pålitlig 200+-spjutspets'
    : s.hitRate >= 38 ? 'Allround bowlare'
    : 'Offensiv risktagare'
  const mod = s.formDiff >= 20 ? `i tydligt uppgång (+${s.formDiff} i form)`
    : s.formDiff <= -15 ? `som söker formen — bästa serie ${s.bestSeries} visar kapaciteten`
    : s.hitRate >= 60   ? `med ${s.consistency.toLowerCase()} spel och ${s.hitRate}% träffrate`
    : `med ${s.consistency.toLowerCase()} prestationer kring ${s.seasonAvg}`
  return `${lead} ${mod}.`
}

// ── Season narrative (4 sentences) ───────────────────────────────────────────
export function narrativeParagraph(s: {
  firstName: string; seasonAvg: number; lastSeasonAvg: number
  formDiff: number; hitRate: number; consistency: string
  rhythmLabel: string; bestSeries: number; games200Plus: number; totalGames: number
}): string[] {
  const diff = s.seasonAvg - s.lastSeasonAvg
  return [
    diff >= 8  ? `${s.firstName} har haft sin bästa säsong hittills — ett snitt på ${s.seasonAvg} är ${diff}p bättre än förra säsongens ${s.lastSeasonAvg}.`
    : diff >= 3 ? `${s.firstName} fortsätter att förbättra sig med ett snitt på ${s.seasonAvg}, upp ${diff}p från förra säsongens ${s.lastSeasonAvg}.`
    : diff >= -3 ? `${s.firstName} levererar en stabil säsong med ett snitt på ${s.seasonAvg} — i linje med förra säsongens ${s.lastSeasonAvg}.`
    : `${s.firstName} snittar ${s.seasonAvg} denna säsong, något under förra årets ${s.lastSeasonAvg}, men med tydlig uppgång de senaste matcherna.`,

    s.formDiff >= 20 ? `Formen pekar tydligt uppåt — snittet de senaste matcherna ligger ${s.formDiff}p över säsongssnittet.`
    : s.formDiff >= 10 ? `Kurvan pekar uppåt med ett formsnitt ${s.formDiff}p över säsongssnittet.`
    : s.formDiff <= -15 ? `Formen är inte på topp just nu, men grunden är stark med ${s.hitRate}% träffrate.`
    : `Med ${s.hitRate}% träffrate och ${s.games200Plus} av ${s.totalGames} spel över 200 är grundstabiliteten hög.`,

    `Som ${s.rhythmLabel.toLowerCase()} tar ${s.firstName} regelbundet ett kliv mot slutet — ${s.consistency.toLowerCase()} prestationer gör spelaren svår att räkna bort.`,

    `Säsongens höjdpunkt är en serie på ${s.bestSeries} — ett bevis på att toppresultaten finns när det verkligen gäller.`,
  ]
}
