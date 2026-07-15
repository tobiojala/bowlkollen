import { describe, it, expect } from 'vitest'
import { isLineupComplete, sortRosterForPicker, type SlotPosition } from '@/lib/lineup'
import type { RosterPlayer } from '@/lib/queries'

function player(publicId: string, licenceAverage: number | null): RosterPlayer {
  return { publicId, name: publicId, licenceAverage, appearances: 5 }
}

describe('isLineupComplete', () => {
  it('is false when no slots are filled', () => {
    expect(isLineupComplete([])).toBe(false)
  })

  it('is false when a single starting slot is missing', () => {
    const slots: SlotPosition[] = [1, 2, 3, 4].flatMap(bord =>
      [1, 2].map(position => ({ bord, position, isReserve: false })),
    ).slice(0, 7)
    expect(isLineupComplete(slots)).toBe(false)
  })

  it('is true when all 8 starting slots are filled, reserves irrelevant', () => {
    const slots: SlotPosition[] = [1, 2, 3, 4].flatMap(bord =>
      [1, 2].map(position => ({ bord, position, isReserve: false })),
    )
    expect(isLineupComplete(slots)).toBe(true)
    expect(isLineupComplete([...slots, { bord: 0, position: 1, isReserve: true }])).toBe(true)
  })
})

describe('sortRosterForPicker', () => {
  it('puts available players before undecided and unavailable ones', () => {
    const roster = [player('a', 180), player('b', 200), player('c', 190)]
    const sorted = sortRosterForPicker(roster, { a: 'no', b: 'yes', c: undefined })
    expect(sorted.map(p => p.publicId)).toEqual(['b', 'c', 'a'])
  })

  it('breaks ties within the same availability by licence average, descending', () => {
    const roster = [player('a', 180), player('b', 210), player('c', 195)]
    const sorted = sortRosterForPicker(roster, { a: 'yes', b: 'yes', c: 'yes' })
    expect(sorted.map(p => p.publicId)).toEqual(['b', 'c', 'a'])
  })

  it('treats a null licence average as the lowest', () => {
    const roster = [player('a', null), player('b', 150)]
    const sorted = sortRosterForPicker(roster, {})
    expect(sorted.map(p => p.publicId)).toEqual(['b', 'a'])
  })
})
