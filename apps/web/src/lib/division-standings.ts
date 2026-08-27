// Pure functions — no DB access, fully testable

import { hexToHsl, hslToHex, hashStr } from './color'
import type { TableRow, FormResult } from './types'
import { computeStandings, divisionTier, groupDivisionsByTier, TIER_ORDER, TIER_RANK, type MatchRow, type TeamStanding, type Tier } from '@bowlkollen/core'
// Tier taxonomy + grouping now live in @bowlkollen/core (shared with native), so
// the schema division list arranges identically on both. Re-exported here so
// existing `@/lib/division-standings` imports keep working.
export { divisionTier, groupDivisionsByTier, TIER_ORDER, TIER_RANK, type Tier }

// computeStandings + these types now live in @bowlkollen/core (shared with the
// mobile app). Re-exported here so existing web imports keep working unchanged.
export { computeStandings }
export type { MatchRow, TeamStanding }

/** The `n` teams above and below `teamId` in the standings (inclusive), window
 * clamped to stay in-bounds rather than shrinking near the top or bottom. */
export function standingsNeighbors(standings: TeamStanding[], teamId: number, radius = 2): TeamStanding[] {
  const idx = standings.findIndex(s => s.teamId === teamId)
  if (idx === -1) return []
  const windowSize = radius * 2 + 1
  const start = Math.max(0, Math.min(idx - radius, standings.length - windowSize))
  return standings.slice(start, start + windowSize)
}

/** Shapes this team's BITS season into the input the (data-source-agnostic)
 * narrative engine expects — see lib/team-narrative.ts. */
export function buildTeamNarrativeInput(teamId: number, matches: MatchRow[], standings: TeamStanding[]) {
  const table: TableRow[] = standings.map((s, i) => ({
    rank: i + 1, teamId: String(s.teamId), teamName: s.teamName,
    played: s.played, won: s.won, drawn: s.drawn, lost: s.lost, points: s.points, form: [],
  }))

  const played   = matches.filter(m => m.is_finished && m.home_result != null && m.away_result != null)
  const upcoming = matches.filter(m => !m.is_finished)

  // Most recent first — the opposite chronological order to the hero's form chips.
  const form: FormResult[] = played.slice(-5).reverse().map(m => {
    const home = m.home_bits_team_id === teamId
    const my   = home ? m.home_result! : m.away_result!
    const opp  = home ? m.away_result! : m.home_result!
    return my > opp ? 'W' : my < opp ? 'L' : 'D'
  })

  const opponentId = (m: MatchRow) => String(m.home_bits_team_id === teamId ? m.away_bits_team_id : m.home_bits_team_id)
  const lastMatch = played[played.length - 1] ?? null
  const nextMatch = upcoming[0] ?? null

  return {
    teamId:             String(teamId),
    table,
    totalMatches:       matches.length,
    playedMatches:      played.length,
    form,
    upcomingOpponentId: nextMatch ? opponentId(nextMatch) : null,
    lastOpponentId:     lastMatch ? opponentId(lastMatch) : null,
    lastMatchResult:    form[0] ?? null,
  }
}

// ── Tier grouping (taxonomy is imported from core) ────────────────────────────


// Scoped tier list for the Atlas mosaic — the active, watched divisions only.
// Division 4/5 and Övrigt (62 regional leagues) are excluded deliberately.
export const MOSAIC_TIERS = [
  'Elitserien', 'Allsvenskan', 'Mellanallsvenskan',
  'Division 1', 'Division 2', 'Division 3',
] as const

// Balanced analogous palette for the mosaic tiles — cool blue → teal → olive.
// All tiers get real color (no flat ink). Elitserien uses luminous silver-blue
// rather than gold so the heatmap's gold ("busiest cell") meaning stays intact.
export const MOSAIC_TIER_COLOR: Record<string, string> = {
  'Elitserien':        '#a8c8e0',
  'Allsvenskan':       '#6ab8a8',
  'Mellanallsvenskan': '#52a888',
  'Division 1':        '#62986a',
  'Division 2':        '#7a9858',
  'Division 3':        '#8a9055',
}

/** Deterministic per-division color within its tier's hue family. Two
 * divisions in the same tier (e.g. "Elitserien Herrar" and "Elitserien
 * Damer") share a tier base color, which made them indistinguishable in the
 * Atlas map view — this nudges hue/lightness per division name so the
 * mosaic stays cohesive (still reads as "Elitserien = blue family") while
 * every individual division is still tellable apart by color alone. */
export function divisionColor(tierBase: string, divisionName: string): string {
  const [h, s, l] = hexToHsl(tierBase)
  const hash       = hashStr(divisionName)
  const hueShift   = (hash % 31) - 15        // -15..+15 degrees
  const lightShift = ((hash >> 8) % 13) - 6  // -6..+6 % lightness
  return hslToHex(h + hueShift, s, Math.max(25, Math.min(78, l + lightShift)))
}

// Colors align with divisions.ts categorical system — separate from the semantic palette.
// Lower tiers use ink tones so the page doesn't become a rainbow.
export const TIER_COLOR: Record<string, string> = {
  'Elitserien':        '#f5c200',              // gold — the only tier that earns it
  'Allsvenskan':       '#5ba85a',              // from divisions.ts tier 2
  'Mellanallsvenskan': '#5ba85a',              // same tier 2 green
  'Division 1':        '#7a9e5a',              // from divisions.ts tier 3
  'Division 2':        'rgba(244,245,247,0.64)',  // ink2 — readable, no color noise
  'Division 3':        'rgba(244,245,247,0.40)',  // ink3
  'Division 4':        'rgba(244,245,247,0.40)',
  'Division 5':        'rgba(244,245,247,0.40)',
  'Övrigt':            'rgba(244,245,247,0.24)', // ink4
}
