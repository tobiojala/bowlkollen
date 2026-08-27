import { describe, it, expect } from 'vitest'
import { recencyScore, eventBoost, serieBoost, EVENT_BOOST, diversifyByKind } from '@bowlkollen/core'

describe('diversifyByKind', () => {
  it('avoids consecutive same-kind while another kind waits, keeping rough rank', () => {
    const ranked = [
      { kind: 'event', id: 1 }, { kind: 'event', id: 2 }, { kind: 'event', id: 3 },
      { kind: 'match', id: 4 }, { kind: 'serie', id: 5 },
    ]
    const out = diversifyByKind(ranked)
    // no two neighbours share a kind until one kind is exhausted
    for (let i = 1; i < 3; i++) expect(out[i].kind).not.toBe(out[i - 1].kind)
    expect(out).toHaveLength(5)
    expect(out[0]).toEqual({ kind: 'event', id: 1 }) // best-ranked head still leads
  })
  it('is a no-op for a single kind', () => {
    const ranked = [{ kind: 'match', id: 1 }, { kind: 'match', id: 2 }]
    expect(diversifyByKind(ranked)).toEqual(ranked)
  })
})

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
