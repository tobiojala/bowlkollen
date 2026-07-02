import { describe, it, expect } from 'vitest'
import { resultsToProfileMatches, buildProfileFromResults, bitsRowsToProfileMatches, buildProfileFromBitsRows } from '@/lib/profile-adapter'
import type { MatchResult, BitsPlayerMatchRow } from '@/lib/types'

const TEAM = 'team-home'
const OPP = 'team-away'

// Helper to build a raw match_results row joined with its match.
function row(opts: {
  id: string
  date: string
  games: number[]
  home?: boolean          // is the player's team the home side?
  homeScore?: number | null
  awayScore?: number | null
  homeName?: string
  awayName?: string
}): MatchResult {
  const home = opts.home ?? true
  return {
    id: opts.id,
    player_id: 'p1',
    match_id: 'm-' + opts.id,
    games: opts.games,
    matches: {
      id: 'm-' + opts.id,
      date: opts.date,
      division: 'Elitserien Damer',
      home_team_id: home ? TEAM : OPP,
      away_team_id: home ? OPP : TEAM,
      home_score: opts.homeScore ?? null,
      away_score: opts.awayScore ?? null,
      home: { name: opts.homeName ?? (home ? 'Vårt lag' : 'Motståndare') },
      away: { name: opts.awayName ?? (home ? 'Motståndare' : 'Vårt lag') },
    },
  }
}

describe('resultsToProfileMatches', () => {
  it('sorts chronologically oldest-first regardless of input order', () => {
    const results = [
      row({ id: 'b', date: '2025-10-12', games: [200, 210, 220, 230] }),
      row({ id: 'a', date: '2025-09-14', games: [180, 190, 200, 185] }),
      row({ id: 'c', date: '2025-11-02', games: [210, 215, 205, 225] }),
    ]
    const pm = resultsToProfileMatches(results, TEAM)
    expect(pm.map(m => m.games[0])).toEqual([180, 200, 210])
  })

  it('derives opponent from the side the player is NOT on', () => {
    const homeRow = row({ id: '1', date: '2025-09-14', games: [200, 200, 200, 200], home: true, homeName: 'Örebro', awayName: 'Malmö' })
    const awayRow = row({ id: '2', date: '2025-09-21', games: [200, 200, 200, 200], home: false, homeName: 'Malmö', awayName: 'Örebro' })
    const pm = resultsToProfileMatches([homeRow, awayRow], TEAM)
    expect(pm[0].opp).toBe('Malmö')   // player home → opponent is away team
    expect(pm[0].home).toBe(true)
    expect(pm[1].opp).toBe('Malmö')   // player away → opponent is home team
    expect(pm[1].home).toBe(false)
  })

  it('computes W/L/D relative to the player team, both home and away', () => {
    const win  = row({ id: 'w', date: '2025-09-14', games: [200, 200, 200, 200], home: true,  homeScore: 6, awayScore: 2 })
    const loss = row({ id: 'l', date: '2025-09-21', games: [200, 200, 200, 200], home: false, homeScore: 5, awayScore: 3 }) // player is away → 3
    const draw = row({ id: 'd', date: '2025-09-28', games: [200, 200, 200, 200], home: true,  homeScore: 4, awayScore: 4 })
    const pm = resultsToProfileMatches([win, loss, draw], TEAM)
    expect(pm[0].result).toBe('W 6–2')
    expect(pm[1].result).toBe('L 3–5')   // away player's score listed first
    expect(pm[2].result).toBe('D 4–4')
  })

  it('leaves result empty when scores are missing', () => {
    const pm = resultsToProfileMatches([row({ id: '1', date: '2025-09-14', games: [200, 200, 200, 200] })], TEAM)
    expect(pm[0].result).toBe('')
  })

  it('drops rows with no real games and strips zero-padding', () => {
    const results = [
      row({ id: 'empty', date: '2025-09-14', games: [0, 0, 0, 0] }),
      row({ id: 'partial', date: '2025-09-21', games: [200, 210, 0, 0] }),
    ]
    const pm = resultsToProfileMatches(results, TEAM)
    expect(pm).toHaveLength(1)
    expect(pm[0].games).toEqual([200, 210])
  })

  it('produces a non-empty display date', () => {
    const pm = resultsToProfileMatches([row({ id: '1', date: '2025-09-14', games: [200, 200, 200, 200] })], TEAM)
    expect(pm[0].date.length).toBeGreaterThan(0)
  })
})

describe('buildProfileFromResults', () => {
  it('feeds the adapted matches into buildProfileData', () => {
    const results = [
      row({ id: 'a', date: '2025-09-14', games: [180, 190, 200, 185] }),
      row({ id: 'b', date: '2025-10-12', games: [256, 234, 212, 245] }),
    ]
    const d = buildProfileFromResults(results, TEAM, { lastSeasonAvg: 200 })
    expect(d.hasData).toBe(true)
    expect(d.matchAvgs).toHaveLength(2)
    expect(d.bestSeries).toBe(256 + 234 + 212 + 245)
    expect(d.bestSeriesIdx).toBe(1)   // newest match is the best, and it sorts last
  })

  it('handles a player with no results', () => {
    const d = buildProfileFromResults([], TEAM)
    expect(d.hasData).toBe(false)
    expect(d.matchAvgs).toEqual([])
  })
})

// Helper to build a get_player_match_history() row.
function bitsRow(opts: {
  date: string
  games: number[]
  home?: boolean   // is the player's team the home side?
  homePoints?: number | null
  awayPoints?: number | null
  opponentName?: string
}): BitsPlayerMatchRow {
  return {
    matchDate: opts.date,
    divisionName: 'Elitserien Damer',
    opponentName: opts.opponentName ?? 'Motståndare',
    isHomeTeam: opts.home ?? true,
    series: opts.games,
    totalResult: opts.games.reduce((a, b) => a + b, 0),
    homePoints: opts.homePoints ?? null,
    awayPoints: opts.awayPoints ?? null,
    seasonId: 2025,
  }
}

describe('bitsRowsToProfileMatches', () => {
  it('sorts chronologically oldest-first regardless of input order', () => {
    const rows = [
      bitsRow({ date: '2025-10-12', games: [200, 210, 220, 230] }),
      bitsRow({ date: '2025-09-14', games: [180, 190, 200, 185] }),
      bitsRow({ date: '2025-11-02', games: [210, 215, 205, 225] }),
    ]
    const pm = bitsRowsToProfileMatches(rows)
    expect(pm.map(m => m.games[0])).toEqual([180, 200, 210])
  })

  it('computes W/L/D from board points (homePoints/awayPoints), not raw pin totals', () => {
    const win  = bitsRow({ date: '2025-09-14', games: [200, 200, 200, 200], home: true,  homePoints: 6, awayPoints: 2 })
    const loss = bitsRow({ date: '2025-09-21', games: [200, 200, 200, 200], home: false, homePoints: 5, awayPoints: 3 })
    const draw = bitsRow({ date: '2025-09-28', games: [200, 200, 200, 200], home: true,  homePoints: 4, awayPoints: 4 })
    const pm = bitsRowsToProfileMatches([win, loss, draw])
    expect(pm[0].result).toBe('W 6–2')
    expect(pm[1].result).toBe('L 3–5')   // away player's points listed first
    expect(pm[2].result).toBe('D 4–4')
  })

  it('leaves result empty when board points are missing', () => {
    const pm = bitsRowsToProfileMatches([bitsRow({ date: '2025-09-14', games: [200, 200, 200, 200] })])
    expect(pm[0].result).toBe('')
  })

  it('carries the opponent name straight through', () => {
    const pm = bitsRowsToProfileMatches([bitsRow({ date: '2025-09-14', games: [200, 200, 200, 200], opponentName: 'Örebro' })])
    expect(pm[0].opp).toBe('Örebro')
  })

  it('drops rows with no real games and strips zero-padding', () => {
    const rows = [
      bitsRow({ date: '2025-09-14', games: [0, 0, 0, 0] }),
      bitsRow({ date: '2025-09-21', games: [200, 210, 0, 0] }),
    ]
    const pm = bitsRowsToProfileMatches(rows)
    expect(pm).toHaveLength(1)
    expect(pm[0].games).toEqual([200, 210])
  })
})

describe('buildProfileFromBitsRows', () => {
  it('feeds adapted BITS rows into buildProfileData', () => {
    const rows = [
      bitsRow({ date: '2025-09-14', games: [180, 190, 200, 185] }),
      bitsRow({ date: '2025-10-12', games: [256, 234, 212, 245] }),
    ]
    const d = buildProfileFromBitsRows(rows, { lastSeasonAvg: 200 })
    expect(d.hasData).toBe(true)
    expect(d.matchAvgs).toHaveLength(2)
    expect(d.bestSeries).toBe(256 + 234 + 212 + 245)
    expect(d.bestSeriesIdx).toBe(1)
  })

  it('handles a player with zero match history (unclaimed, no synced results)', () => {
    const d = buildProfileFromBitsRows([])
    expect(d.hasData).toBe(false)
    expect(d.matchAvgs).toEqual([])
  })
})
