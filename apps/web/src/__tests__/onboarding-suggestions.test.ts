import { describe, it, expect } from 'vitest'
import { composePlayerSuggestions } from '@/lib/onboarding-suggestions'

const roster = (n: number) => Array.from({ length: n }, (_, i) => ({
  public_id: `p${i}`, name: `Player ${i}`, licence_average: 180 + i,
}))

describe('composePlayerSuggestions', () => {
  it('orders tiers: teammates, then regional Elitserien, then division rivals', () => {
    const result = composePlayerSuggestions(roster(1), roster(1), roster(1))
    expect(result.map(p => p.tier)).toEqual(['teammate', 'elitserien_regional', 'division_rival'])
  })

  it('preserves roster order within each tier', () => {
    const result = composePlayerSuggestions(roster(3), [], [])
    expect(result.map(p => p.publicId)).toEqual(['p0', 'p1', 'p2'])
  })

  it('carries name and licenceAverage through unchanged', () => {
    const result = composePlayerSuggestions([{ public_id: 'p0', name: 'Pontus Ilstedt', licence_average: 140 }], [], [])
    expect(result[0]).toEqual({ publicId: 'p0', name: 'Pontus Ilstedt', licenceAverage: 140, tier: 'teammate' })
  })

  it('handles all-empty tiers', () => {
    expect(composePlayerSuggestions([], [], [])).toEqual([])
  })

  it('handles a missing regional Elitserien tier without breaking ordering', () => {
    const result = composePlayerSuggestions(roster(1), [], roster(2))
    expect(result.map(p => p.tier)).toEqual(['teammate', 'division_rival', 'division_rival'])
  })
})
