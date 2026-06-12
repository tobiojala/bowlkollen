import { describe, it, expect } from 'vitest'
import {
  validGames, matchAvgs, gamePositionAvgs, stdDev, streaks,
  calcRating, getTier, bkTopPercent, bkBarPercent,
  rhythmLabel, seasonResults, SEASON_CURRENT, SEASON_PREV,
} from '@/lib/player-stats'
import type { MatchResult } from '@/lib/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeResult(games: number[], date = '2025-10-01'): MatchResult {
  return {
    id: crypto.randomUUID(),
    player_id: 'p1',
    match_id: 'm1',
    games,
    matches: {
      id: 'm1', date, division: 'Elitserien Herrar',
      home_team_id: 't1', away_team_id: 't2',
      home_score: 4, away_score: 2,
      home: { name: 'Home BK' }, away: { name: 'Away BK' },
    },
  }
}

const STRONG_RESULTS = [
  makeResult([234, 198, 267, 210]),
  makeResult([220, 245, 221, 198]),
  makeResult([189, 203, 215, 199]),
]

const WEAK_RESULTS = [
  makeResult([155, 162, 170, 158]),
  makeResult([145, 180, 160, 150]),
]

// ── validGames ────────────────────────────────────────────────────────────────

describe('validGames', () => {
  it('flattens all positive game scores', () => {
    const games = validGames(STRONG_RESULTS)
    expect(games).toHaveLength(12)
    expect(games).toContain(267)
    expect(games).toContain(198)
  })

  it('excludes zero scores', () => {
    const r = makeResult([200, 0, 215, 0])
    expect(validGames([r])).toEqual([200, 215])
  })

  it('returns empty array for empty results', () => {
    expect(validGames([])).toEqual([])
  })
})

// ── matchAvgs ─────────────────────────────────────────────────────────────────

describe('matchAvgs', () => {
  it('computes per-match average rounded to nearest integer', () => {
    const r = makeResult([200, 200, 200, 200])
    expect(matchAvgs([r])).toEqual([200])
  })

  it('skips zero scores when averaging', () => {
    const r = makeResult([200, 0, 300, 0])
    expect(matchAvgs([r])).toEqual([250])
  })

  it('returns empty for results with no positive scores', () => {
    expect(matchAvgs([makeResult([0, 0, 0, 0])])).toEqual([])
  })
})

// ── gamePositionAvgs ──────────────────────────────────────────────────────────

describe('gamePositionAvgs', () => {
  it('returns average score per position across matches', () => {
    const results = [
      makeResult([200, 220, 180, 190]),
      makeResult([210, 230, 200, 210]),
    ]
    const avgs = gamePositionAvgs(results)
    expect(avgs).toHaveLength(4)
    expect(avgs[0]).toBe(205) // (200+210)/2
    expect(avgs[1]).toBe(225) // (220+230)/2
  })

  it('requires at least 4 positive scores per match', () => {
    expect(gamePositionAvgs([makeResult([0, 0, 0, 0])])).toEqual([])
  })

  it('returns empty for empty results', () => {
    expect(gamePositionAvgs([])).toEqual([])
  })
})

// ── stdDev ────────────────────────────────────────────────────────────────────

describe('stdDev', () => {
  it('returns 0 for empty array', () => {
    expect(stdDev([])).toBe(0)
  })

  it('returns 0 for all identical values', () => {
    expect(stdDev([200, 200, 200])).toBe(0)
  })

  it('computes population std dev rounded to integer', () => {
    // mean = 200, deviations: -10, 0, 10 → variance = 200/3 ≈ 66.67 → σ ≈ 8.16 → round to 8
    const result = stdDev([190, 200, 210])
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(15)
  })

  it('is higher for more variable data', () => {
    const low  = stdDev([198, 200, 202])
    const high = stdDev([150, 200, 250])
    expect(high).toBeGreaterThan(low)
  })
})

// ── streaks ───────────────────────────────────────────────────────────────────

describe('streaks', () => {
  it('counts current streak of games at or above threshold', () => {
    const games = [200, 210, 195, 220, 230, 225]
    const { current, best } = streaks(games, 200)
    // From the end: 225 ≥ 200 ✓, 230 ≥ 200 ✓, 220 ≥ 200 ✓ → current = 3
    expect(current).toBe(3)
  })

  it('resets current streak when below threshold', () => {
    const games = [200, 210, 150, 220, 230]
    const { current } = streaks(games, 200)
    // Trailing streak: 230 ≥ 200 ✓, 220 ≥ 200 ✓ → current = 2
    expect(current).toBe(2)
  })

  it('tracks best streak across the whole history', () => {
    const games = [200, 210, 220, 150, 200, 210]
    const { best } = streaks(games, 200)
    expect(best).toBe(3) // first three games
  })

  it('returns 0 for empty array', () => {
    const { current, best } = streaks([], 200)
    expect(current).toBe(0)
    expect(best).toBe(0)
  })

  it('returns full length when all games meet threshold', () => {
    const games = [210, 220, 230]
    const { current, best } = streaks(games, 200)
    expect(current).toBe(3)
    expect(best).toBe(3)
  })
})

// ── calcRating ────────────────────────────────────────────────────────────────

describe('calcRating', () => {
  it('returns a rating between 0 and 99', () => {
    const r = calcRating(200, 240, 10, true)
    expect(r).toBeGreaterThanOrEqual(0)
    expect(r).toBeLessThanOrEqual(99)
  })

  it('caps at 99', () => {
    expect(calcRating(250, 300, 50, true)).toBe(99)
  })

  it('returns lower rating with no data', () => {
    const withData    = calcRating(180, 220, 5, true)
    const withoutData = calcRating(180, 220, 5, false)
    expect(withoutData).toBeLessThan(withData)
  })

  it('higher avg produces higher rating', () => {
    const low  = calcRating(160, 200, 2, true)
    const high = calcRating(210, 260, 20, true)
    expect(high).toBeGreaterThan(low)
  })
})

// ── getTier ───────────────────────────────────────────────────────────────────

describe('getTier', () => {
  it('returns LEGEND for rating >= 95', () => {
    expect(getTier(95).label).toBe('LEGEND')
    expect(getTier(99).label).toBe('LEGEND')
  })

  it('returns ELITE for rating 85–94', () => {
    expect(getTier(85).label).toBe('ELITE')
    expect(getTier(94).label).toBe('ELITE')
  })

  it('returns PRO for rating 75–84', () => {
    expect(getTier(75).label).toBe('PRO')
    expect(getTier(84).label).toBe('PRO')
  })

  it('returns VETERAN for rating 60–74', () => {
    expect(getTier(60).label).toBe('VETERAN')
    expect(getTier(74).label).toBe('VETERAN')
  })

  it('returns ROOKIE for rating below 60', () => {
    expect(getTier(59).label).toBe('ROOKIE')
    expect(getTier(0).label).toBe('ROOKIE')
  })

  it('always returns all required tier fields', () => {
    const tier = getTier(80)
    expect(tier).toHaveProperty('label')
    expect(tier).toHaveProperty('accent')
    expect(tier).toHaveProperty('glow')
    expect(tier).toHaveProperty('bg')
    expect(tier).toHaveProperty('border')
  })
})

// ── bkTopPercent / bkBarPercent ───────────────────────────────────────────────

describe('bkTopPercent', () => {
  it('returns a number between 0 and 100', () => {
    const pct = bkTopPercent(75)
    expect(pct).toBeGreaterThanOrEqual(0)
    expect(pct).toBeLessThanOrEqual(100)
  })

  it('higher rating → lower top percent (better rank)', () => {
    expect(bkTopPercent(90)).toBeLessThan(bkTopPercent(60))
  })
})

describe('bkBarPercent', () => {
  it('returns a number between 0 and 100', () => {
    const pct = bkBarPercent(75)
    expect(pct).toBeGreaterThanOrEqual(0)
    expect(pct).toBeLessThanOrEqual(100)
  })

  it('higher rating → higher bar percent', () => {
    expect(bkBarPercent(90)).toBeGreaterThan(bkBarPercent(60))
  })
})

// ── seasonResults ─────────────────────────────────────────────────────────────

describe('seasonResults', () => {
  it('filters current season results', () => {
    const current = makeResult([200, 200, 200, 200], '2025-09-15') // after SEASON_CURRENT
    const prev    = makeResult([180, 180, 180, 180], '2024-09-15') // before SEASON_CURRENT
    const results = [current, prev]
    expect(seasonResults(results, 'current')).toContain(current)
    expect(seasonResults(results, 'current')).not.toContain(prev)
  })

  it('filters previous season results', () => {
    const current = makeResult([200, 200, 200, 200], '2025-09-15')
    const prev    = makeResult([180, 180, 180, 180], '2024-09-15')
    const results = [current, prev]
    expect(seasonResults(results, 'prev')).toContain(prev)
    expect(seasonResults(results, 'prev')).not.toContain(current)
  })

  it('returns empty array when no results match', () => {
    const old = makeResult([200, 200, 200, 200], '2020-01-01')
    expect(seasonResults([old], 'current')).toHaveLength(0)
  })
})

// ── rhythmLabel ───────────────────────────────────────────────────────────────

describe('rhythmLabel', () => {
  it('returns — for fewer than 2 data points', () => {
    expect(rhythmLabel([]).label).toBe('—')
    expect(rhythmLabel([200]).label).toBe('—')
  })

  it('identifies strong finisher when last avg is 12+ higher than first', () => {
    const { label } = rhythmLabel([190, 195, 205, 215])
    expect(label).toBe('Stark avslutare')
  })

  it('identifies fast starter when first avg is 12+ higher than last', () => {
    const { label } = rhythmLabel([220, 210, 200, 190])
    expect(label).toBe('Snabbstartare')
  })

  it('identifies iron consistent when spread is 8 or fewer', () => {
    const { label } = rhythmLabel([200, 202, 201, 200])
    expect(label).toBe('Järnkonsekvent')
  })

  it('always returns a label string', () => {
    const { label, detail } = rhythmLabel([200, 190, 210, 200])
    expect(typeof label).toBe('string')
    expect(typeof detail).toBe('string')
  })
})
