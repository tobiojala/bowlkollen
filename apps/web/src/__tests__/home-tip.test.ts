import { describe, it, expect } from 'vitest'
import { greetingFor, homeNote } from '@bowlkollen/core'

describe('greetingFor', () => {
  it('picks the time-of-day base greeting', () => {
    expect(greetingFor(8, null)).toBe('God morgon')
    expect(greetingFor(12, null)).toBe('God dag')
    expect(greetingFor(20, null)).toBe('God kväll')
  })
  it('personalizes with the first name when present', () => {
    expect(greetingFor(8, 'Tobias')).toBe('God morgon, Tobias')
  })
})

describe('homeNote', () => {
  const base = { daySeed: 0 }
  it('flags match day when the fixture is today', () => {
    const n = homeNote({ ...base, daysToMatch: 0, opponent: 'BK Örnen', matchId: 42 })
    expect(n.matchId).toBe(42)
    expect(n.text).toContain('Matchdag')
    expect(n.text).toContain('BK Örnen')
  })
  it('counts down when a match is within five days', () => {
    const n = homeNote({ ...base, daysToMatch: 3, opponent: null, matchId: 7 })
    expect(n.matchId).toBe(7)
    expect(n.text).toContain('3 dagar')
  })
  it('falls back to a deterministic daily tip with no upcoming match', () => {
    const a = homeNote({ daySeed: 2, daysToMatch: null, opponent: null, matchId: null })
    const b = homeNote({ daySeed: 2, daysToMatch: null, opponent: null, matchId: null })
    expect(a.matchId).toBeNull()
    expect(a.text).toBe(b.text)
  })
})
