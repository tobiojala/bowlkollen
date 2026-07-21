import { describe, it, expect } from 'vitest'
import { motFaltet, formMotFaltet, tryckMotFaltet, stabilitet, percentile, calcBkRating } from '@/lib/bk-rating'
import { BK_RATING } from '@/lib/constants'
import type { RatedGame } from '@/lib/types'

const game = (score: number, fieldAvg: number, seq: number, extra: Partial<RatedGame> = {}): RatedGame =>
  ({ score, fieldAvg, seq, ...extra })

// ── motFaltet ─────────────────────────────────────────────────────────────────

describe('motFaltet', () => {
  it('averages pins above the field', () => {
    const games = [game(210, 200, 0), game(190, 200, 1), game(220, 200, 2)]
    expect(motFaltet(games)).toBeCloseTo((10 - 10 + 20) / 3)
  })

  it('is condition-adjusted: a low score on a hard night can beat a high score on an easy one', () => {
    const hardNightHero = [game(195, 180, 0)]   // +15 vs field
    const easyNightStar = [game(215, 210, 0)]   // +5 vs field
    expect(motFaltet(hardNightHero)).toBeGreaterThan(motFaltet(easyNightStar))
  })

  it('downweights verified non-sanctioned games', () => {
    const games = [
      game(220, 200, 0, { source: 'sanctioned' }),  // +20 at weight 1.0
      game(200, 200, 1, { source: 'verified' }),    //  +0 at weight 0.5
    ]
    expect(motFaltet(games)).toBeCloseTo(20 / 1.5)
  })

  it('excludes self-reported games entirely', () => {
    const games = [
      game(210, 200, 0, { source: 'sanctioned' }),
      game(280, 200, 1, { source: 'self_reported' }),  // suspiciously good — ignored
    ]
    expect(motFaltet(games)).toBeCloseTo(10)
  })

  it('returns 0 with no eligible games', () => {
    expect(motFaltet([])).toBe(0)
    expect(motFaltet([game(250, 200, 0, { source: 'self_reported' })])).toBe(0)
  })
})

// ── formMotFaltet ─────────────────────────────────────────────────────────────

describe('formMotFaltet', () => {
  it('weights recent games more than old ones', () => {
    // Same season average, opposite trajectories
    const surging = [game(190, 200, 0), game(200, 200, 1), game(220, 200, 2)]
    const fading  = [game(220, 200, 0), game(200, 200, 1), game(190, 200, 2)]
    expect(formMotFaltet(surging)).toBeGreaterThan(motFaltet(surging))
    expect(formMotFaltet(fading)).toBeLessThan(motFaltet(fading))
    expect(formMotFaltet(surging)).toBeGreaterThan(formMotFaltet(fading))
  })

  it('halves the weight after FORM_HALF_LIFE_GAMES games', () => {
    const h = BK_RATING.FORM_HALF_LIFE_GAMES
    const games = [game(220, 200, 0), game(200, 200, h)]
    // old game (+20) at weight 0.5, recent (+0) at weight 1 → 20*0.5/1.5
    expect(formMotFaltet(games)).toBeCloseTo(10 / 1.5)
  })

  it('lets self-reported games influence form, but at low weight', () => {
    const without = [game(200, 200, 0)]
    const withSelf = [...without, game(240, 200, 1, { source: 'self_reported' })]
    expect(formMotFaltet(withSelf)).toBeGreaterThan(formMotFaltet(without))
  })
})

// ── tryckMotFaltet ────────────────────────────────────────────────────────────

describe('tryckMotFaltet', () => {
  it('measures deciding games only', () => {
    const games = [
      game(180, 200, 0),                     // poor, but not a decider
      game(225, 200, 1, { decider: true }),  // clutch +25
    ]
    expect(tryckMotFaltet(games)).toBeCloseTo(25)
  })

  it('falls back to season motFaltet when there are no deciders', () => {
    const games = [game(212, 200, 0), game(208, 200, 1)]
    expect(tryckMotFaltet(games)).toBeCloseTo(motFaltet(games))
  })
})

// ── stabilitet ────────────────────────────────────────────────────────────────

describe('stabilitet', () => {
  it('scores a tight spread higher than a volatile one', () => {
    const steady   = [game(205, 200, 0), game(206, 200, 1), game(204, 200, 2)]
    const volatile = [game(170, 200, 0), game(240, 200, 1), game(205, 200, 2)]
    expect(stabilitet(steady)).toBeGreaterThan(stabilitet(volatile))
  })

  it('uses field residuals, so consistency across hard and easy nights counts', () => {
    // Always exactly +10 vs field, even though raw scores swing 40 pins
    const adaptable = [game(190, 180, 0), game(230, 220, 1), game(210, 200, 2)]
    expect(stabilitet(adaptable)).toBe(-0)
  })
})

// ── percentile ────────────────────────────────────────────────────────────────

describe('percentile', () => {
  it('ranks within a population', () => {
    const pop = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    expect(percentile(10, pop)).toBe(95)  // best (ties counted at midpoint)
    expect(percentile(1, pop)).toBe(5)
  })

  it('puts a lone player at the middle, not the extremes', () => {
    expect(percentile(5, [5])).toBe(50)
    expect(percentile(5, [])).toBe(50)
  })
})

// ── calcBkRating ──────────────────────────────────────────────────────────────

describe('calcBkRating', () => {
  // Small synthetic league: 5 players × 6 games on shared field conditions
  const fieldAvgs = [195, 200, 190, 205, 198, 202]
  const mkPlayer = (offsets: number[], deciderBoost = 0): RatedGame[] =>
    offsets.map((off, i) => game(fieldAvgs[i] + off, fieldAvgs[i], i, i === 5 ? { decider: true } : {}))
      .map((g, i) => i === 5 ? { ...g, score: g.score + deciderBoost } : g)

  const star    = mkPlayer([12, 15, 10, 18, 20, 22])            // strong + surging
  const clutch  = mkPlayer([2, 0, 4, 1, 3, 2], 18)              // average, huge decider
  const steady  = mkPlayer([5, 5, 5, 5, 5, 5])                  // metronome
  const fading  = mkPlayer([20, 16, 10, -2, -8, -12])           // great start, collapsing
  const grinder = mkPlayer([0, 1, 2, 3, 4, 5])                  // modest, improving
  const rookie  = mkPlayer([-10, -12, -6, -15, -9, -11])        // below field
  const league  = [star, clutch, steady, fading, grinder, rookie]

  it('stays within 0-100 and orders the league sensibly', () => {
    const ratings = league.map(p => calcBkRating(p, league))
    for (const r of ratings) {
      expect(r.total).toBeGreaterThanOrEqual(0)
      expect(r.total).toBeLessThanOrEqual(100)
    }
    const [starR, , , fadingR, , rookieR] = ratings
    expect(starR.total).toBeGreaterThan(fadingR.total)
    expect(fadingR.total).toBeGreaterThan(rookieR.total)
  })

  it('rewards clutch play in the Tryck pillar', () => {
    const clutchR = calcBkRating(clutch, league)
    const steadyR = calcBkRating(steady, league)
    expect(clutchR.pillars.tryck).toBeGreaterThan(steadyR.pillars.tryck)
  })

  it('a collapse drops Form below an improving grinder, while Grund still leads', () => {
    const fadingR  = calcBkRating(fading, league)
    const grinderR = calcBkRating(grinder, league)
    // Season-long body of work still favours the fader...
    expect(fadingR.pillars.grund).toBeGreaterThan(grinderR.pillars.grund)
    // ...but current form favours the grinder — the rating sees trajectory.
    expect(fadingR.pillars.form).toBeLessThan(grinderR.pillars.form)
  })

  it('reports season motFaltet alongside the score', () => {
    const starR = calcBkRating(star, league)
    expect(starR.motFaltet).toBeCloseTo((12 + 15 + 10 + 18 + 20 + 22) / 6, 0)
  })

  it('pillar weights sum to 1', () => {
    const w = BK_RATING.WEIGHTS
    expect(w.GRUND + w.FORM + w.TRYCK + w.STABILITET).toBeCloseTo(1)
  })
})
