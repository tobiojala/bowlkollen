import { describe, it, expect } from 'vitest'
import { SCORE, RATING, SEASON, STANDINGS_DIVISIONS, QUERY, STALE } from '@/lib/constants'
import { getDivision, divisionShort, divisionColor, divisionBg, DIVISIONS } from '@/lib/divisions'

// ── SCORE constants ───────────────────────────────────────────────────────────

describe('SCORE constants', () => {
  it('thresholds are in ascending order', () => {
    expect(SCORE.GOOD).toBeLessThan(SCORE.GREAT)
    expect(SCORE.GREAT).toBeLessThan(SCORE.ELITE)
    expect(SCORE.ELITE).toBeLessThan(SCORE.PERFECT)
  })

  it('HONOR_ROLL equals GREAT (220)', () => {
    expect(SCORE.HONOR_ROLL).toBe(SCORE.GREAT)
  })

  it('PERFECT is 300', () => {
    expect(SCORE.PERFECT).toBe(300)
  })
})

// ── RATING constants ──────────────────────────────────────────────────────────

describe('RATING constants', () => {
  it('thresholds are in descending order (LEGEND is highest)', () => {
    expect(RATING.LEGEND).toBeGreaterThan(RATING.ELITE)
    expect(RATING.ELITE).toBeGreaterThan(RATING.PRO)
    expect(RATING.PRO).toBeGreaterThan(RATING.VETERAN)
  })
})

// ── SEASON constants ──────────────────────────────────────────────────────────

describe('SEASON constants', () => {
  it('CURRENT is after PREV', () => {
    expect(SEASON.CURRENT > SEASON.PREV).toBe(true)
  })

  it('both dates are valid ISO date strings', () => {
    expect(() => new Date(SEASON.CURRENT)).not.toThrow()
    expect(() => new Date(SEASON.PREV)).not.toThrow()
    expect(SEASON.CURRENT).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(SEASON.PREV).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('season starts in July', () => {
    expect(SEASON.CURRENT.slice(5, 7)).toBe('07')
    expect(SEASON.PREV.slice(5, 7)).toBe('07')
  })
})

// ── STANDINGS_DIVISIONS ───────────────────────────────────────────────────────

describe('STANDINGS_DIVISIONS', () => {
  it('contains Elitserien Herrar and Elitserien Damer', () => {
    expect(STANDINGS_DIVISIONS).toContain('Elitserien Herrar')
    expect(STANDINGS_DIVISIONS).toContain('Elitserien Damer')
  })
})

// ── QUERY constants ───────────────────────────────────────────────────────────

describe('QUERY constants', () => {
  it('all limits are positive integers', () => {
    expect(QUERY.HOME_MATCHES_LIMIT).toBeGreaterThan(0)
    expect(QUERY.HOME_UPCOMING_LIMIT).toBeGreaterThan(0)
    expect(QUERY.TEAM_MATCHES_LIMIT).toBeGreaterThan(0)
    expect(QUERY.HONOR_ROLL_LIMIT).toBeGreaterThan(0)
  })

  it('SEARCH_MIN_CHARS is at least 2', () => {
    expect(QUERY.SEARCH_MIN_CHARS).toBeGreaterThanOrEqual(2)
  })
})

// ── STALE times ───────────────────────────────────────────────────────────────

describe('STALE times', () => {
  it('LIVE is the shortest stale time', () => {
    expect(STALE.LIVE).toBeLessThanOrEqual(STALE.SHORT)
    expect(STALE.SHORT).toBeLessThanOrEqual(STALE.DEFAULT)
    expect(STALE.DEFAULT).toBeLessThanOrEqual(STALE.MEDIUM)
    expect(STALE.MEDIUM).toBeLessThanOrEqual(STALE.LONG)
  })

  it('all stale times are positive', () => {
    Object.values(STALE).forEach(t => expect(t).toBeGreaterThan(0))
  })
})

// ── getDivision ───────────────────────────────────────────────────────────────

describe('getDivision', () => {
  it('returns division for known name', () => {
    const div = getDivision('Elitserien Herrar')
    expect(div).not.toBeNull()
    expect(div?.tier).toBe(1)
    expect(div?.color).toBeTruthy()
  })

  it('returns null for unknown name', () => {
    expect(getDivision('Unknown Division')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(getDivision(null)).toBeNull()
  })
})

// ── divisionShort ─────────────────────────────────────────────────────────────

describe('divisionShort', () => {
  it('returns short name for known division', () => {
    const short = divisionShort('Elitserien Herrar')
    expect(short).toBeTruthy()
    expect(short.length).toBeLessThan('Elitserien Herrar'.length)
  })

  it('falls back to original name for unknown division', () => {
    expect(divisionShort('Custom League')).toBe('Custom League')
  })

  it('returns empty string for null', () => {
    expect(divisionShort(null)).toBe('')
  })
})

// ── divisionColor ─────────────────────────────────────────────────────────────

describe('divisionColor', () => {
  it('returns a hex color for known division', () => {
    const color = divisionColor('Elitserien Herrar')
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('returns muted fallback for unknown division', () => {
    const darkColor  = divisionColor('Unknown', 'dark')
    const lightColor = divisionColor('Unknown', 'light')
    expect(darkColor).toBeTruthy()
    expect(lightColor).toBeTruthy()
  })
})

// ── DIVISIONS structure ───────────────────────────────────────────────────────

describe('DIVISIONS', () => {
  it('every division has required fields', () => {
    DIVISIONS.forEach(d => {
      expect(d.name).toBeTruthy()
      expect(d.short).toBeTruthy()
      expect(d.color).toMatch(/^#/)
      expect(d.tier).toBeGreaterThanOrEqual(1)
    })
  })

  it('Elitserien divisions are tier 1', () => {
    const elitserien = DIVISIONS.filter(d => d.name.includes('Elitserien'))
    expect(elitserien.length).toBeGreaterThan(0)
    elitserien.forEach(d => expect(d.tier).toBe(1))
  })

  it('all division names are unique', () => {
    const names = DIVISIONS.map(d => d.name)
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })
})
