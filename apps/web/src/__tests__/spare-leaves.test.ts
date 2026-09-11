import { describe, it, expect } from 'vitest'
import { isSplit, leaveKind, leaveName, leaveKey, aggregateSpares } from '@bowlkollen/core'

describe('spare-leaves', () => {
  it('detects hål (splits) vs plain leaves', () => {
    expect(isSplit([7, 10])).toBe(true)        // classic split
    expect(isSplit([4, 6])).toBe(true)
    expect(isSplit([3, 10])).toBe(true)         // baby split
    expect(isSplit([4, 6, 7, 10])).toBe(true)   // stora fyran
    expect(isSplit([10])).toBe(false)           // single pin
    expect(isSplit([1, 2])).toBe(false)         // headpin still up
    expect(isSplit([2, 4, 5])).toBe(false)      // one connected cluster
  })

  it('classifies and names leaves', () => {
    expect(leaveKind([10])).toBe('single')
    expect(leaveKind([7, 10])).toBe('hal')
    expect(leaveKind([2, 4, 5])).toBe('multi')
    expect(leaveName([10])).toBe('10:an')
    expect(leaveName([4, 6, 7, 10])).toBe('Stora fyran')
    expect(leaveName([3, 6, 10])).toBe('3–6–10')
    expect(leaveKey([10, 7])).toBe('7,10')      // canonical, sorted
  })

  it('aggregates spare conversion', () => {
    const s = aggregateSpares([
      { pins: [10], converted: true }, { pins: [10], converted: true }, { pins: [10], converted: false },
      { pins: [7, 10], converted: false }, { pins: [7, 10], converted: false },
    ], 2)
    expect(s.overall).toEqual({ made: 2, att: 5, pct: 40 })
    expect(s.byKind.single.pct).toBe(67)  // 2/3
    expect(s.byKind.hal.pct).toBe(0)      // 0/2
    const ten = s.byLeave.find(r => r.key === '10')!
    expect([ten.att, ten.made, ten.pct]).toEqual([3, 2, 67])
    expect(s.nemesis?.key).toBe('7,10')   // lowest pct with att >= 2
  })
})
