// Pure functions — no DB access, fully testable

import { hexToHsl, hslToHex, hashStr } from './color'

export type MatchRow = {
  bits_match_id:     number
  home_bits_team_id: number
  away_bits_team_id: number
  home_team_name:    string
  away_team_name:    string
  home_result:       number | null
  away_result:       number | null
  is_finished:       boolean | null
  match_date:        string
  round_id:          number | null
  hall_name:         string | null
}

export type TeamStanding = {
  teamId:      number
  teamName:    string
  played:      number
  won:         number
  drawn:       number
  lost:        number
  boardWins:   number
  boardLosses: number
  points:      number
}

export function computeStandings(matches: MatchRow[]): TeamStanding[] {
  const map = new Map<number, TeamStanding>()

  function getOrCreate(id: number, name: string): TeamStanding {
    if (!map.has(id)) {
      map.set(id, { teamId: id, teamName: name, played: 0, won: 0, drawn: 0, lost: 0, boardWins: 0, boardLosses: 0, points: 0 })
    }
    return map.get(id)!
  }

  for (const m of matches) {
    if (!m.is_finished || m.home_result == null || m.away_result == null) continue

    const home = getOrCreate(m.home_bits_team_id, m.home_team_name)
    const away = getOrCreate(m.away_bits_team_id, m.away_team_name)

    home.played++; away.played++
    home.boardWins   += m.home_result; home.boardLosses += m.away_result
    away.boardWins   += m.away_result; away.boardLosses += m.home_result

    if (m.home_result > m.away_result) {
      home.won++;  home.points  += 2; away.lost++
    } else if (m.home_result === m.away_result) {
      home.drawn++; home.points += 1; away.drawn++; away.points += 1
    } else {
      away.won++;  away.points  += 2; home.lost++
    }
  }

  return [...map.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const netB = b.boardWins - b.boardLosses
    const netA = a.boardWins - a.boardLosses
    if (netB !== netA) return netB - netA
    return b.boardWins - a.boardWins
  })
}

// ── Tier detection ────────────────────────────────────────────────────────────

const TIER_ORDER = [
  'Elitserien',
  'Allsvenskan',
  'Division 1',
  'Division 2',
  'Division 3',
  'Division 4',
  'Division 5',
  'Övrigt',
]

export function divisionTier(name: string): string {
  // Case-insensitive: the men's leagues are one word ("Sydallsvenskan",
  // "Nordallsvenskan", "Mellanallsvenskan") with a lowercase 'a', while the
  // women's are spaced ("Norra Allsvenskan"). All belong to the same tier.
  const n = name.toLowerCase()
  if (n.includes('elitserien'))  return 'Elitserien'
  if (n.includes('allsvensk'))   return 'Allsvenskan'
  // Anchored at the start — regional district leagues like "Värmlands P4
  // Div 4" also contain "Div 4" as a substring but aren't the national tier.
  for (let i = 5; i >= 1; i--) {
    if (name.startsWith(`Division ${i}`) || name.startsWith(`Div ${i}`)) return `Division ${i}`
  }
  return 'Övrigt'
}

export function groupDivisionsByTier<T extends { name: string }>(divs: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>(TIER_ORDER.map(t => [t, []]))
  for (const d of divs) {
    const tier = divisionTier(d.name)
    const bucket = groups.get(tier) ?? groups.get('Övrigt')!
    bucket.push(d)
  }
  // Remove empty tiers to keep render clean
  for (const [k, v] of groups) {
    if (v.length === 0) groups.delete(k)
  }
  return groups
}

// Higher = show first in feed. Elitserien always tops the card stack.
export const TIER_RANK: Record<string, number> = {
  'Elitserien':        6,
  'Allsvenskan':       5,
  'Mellanallsvenskan': 4,
  'Division 1':        3,
  'Division 2':        2,
  'Division 3':        1,
  'Division 4':        1,
  'Division 5':        1,
  'Övrigt':            0,
}

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
