import { describe, it, expect } from 'vitest'
import { recencyScore, eventBoost, serieBoost, EVENT_BOOST } from '@bowlkollen/core'

const NOW = new Date('2026-08-26T12:00:00Z').getTime()

describe('recencyScore', () => {
  it('is 100 at now and decays ~7/day', () => {
    expect(recencyScore(new Date(NOW).toISOString(), NOW)).toBe(100)
    expect(recencyScore(new Date(NOW - 2 * 86_400_000).toISOString(), NOW)).toBeCloseTo(86, 0)
  })
  it('clamps a future date to 100 (upcoming reads as now)', () => {
    expect(recencyScore(new Date(NOW + 5 * 86_400_000).toISOString(), NOW)).toBe(100)
  })
  it('floors at 0 past ~14 days', () => {
    expect(recencyScore(new Date(NOW - 30 * 86_400_000).toISOString(), NOW)).toBe(0)
  })
})

describe('eventBoost', () => {
  it('uses the table and defaults unknown types to 5', () => {
    expect(eventBoost('promotion_clinched')).toBe(EVENT_BOOST.promotion_clinched)
    expect(eventBoost('nope')).toBe(5)
  })
})

describe('serieBoost', () => {
  it('steps at 250/270/300', () => {
    expect(serieBoost(300)).toBe(40)
    expect(serieBoost(279)).toBe(20)
    expect(serieBoost(255)).toBe(10)
    expect(serieBoost(200)).toBe(0)
  })
})
