import { describe, it, expect } from 'vitest'
import { isLineupComplete, sortRosterForPicker, suggestLineup, seatPairIntoBoard, type SlotPosition } from '@/lib/lineup'
import type { RosterPlayer, LineupSlot } from '@/lib/queries'

function starter(publicId: string, bord: number, pos: number): LineupSlot {
  return { publicId, playerName: publicId, bord, pos, isReserve: false }
}
const person = (publicId: string) => ({ publicId, name: publicId })

function player(publicId: string, licenceAverage: number | null): RosterPlayer {
  return { publicId, name: publicId, licenceAverage, appearances: 5 }
}

describe('isLineupComplete', () => {
  it('is false when no slots are filled', () => {
    expect(isLineupComplete([])).toBe(false)
  })

  it('is false when a single starting slot is missing', () => {
    const slots: SlotPosition[] = [1, 2, 3, 4].flatMap(bord =>
      [1, 2].map(pos => ({ bord, pos, isReserve: false })),
    ).slice(0, 7)
    expect(isLineupComplete(slots)).toBe(false)
  })

  it('is true when all 8 starting slots are filled, reserves irrelevant', () => {
    const slots: SlotPosition[] = [1, 2, 3, 4].flatMap(bord =>
      [1, 2].map(pos => ({ bord, pos, isReserve: false })),
    )
    expect(isLineupComplete(slots)).toBe(true)
    expect(isLineupComplete([...slots, { bord: 0, pos: 1, isReserve: true }])).toBe(true)
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

describe('suggestLineup', () => {
  it('fills every empty starter slot from the pool, best first', () => {
    const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(person)
    const out = suggestLineup([], pool)
    expect(out.filter(s => !s.isReserve)).toHaveLength(8)
    expect(out.find(s => s.bord === 1 && s.pos === 1)?.publicId).toBe('a')
  })

  it('never moves already-seated players and skips the ones in the pool', () => {
    const current = [starter('x', 1, 1)]
    const out = suggestLineup(current, [person('x'), person('a'), person('b')])
    expect(out.find(s => s.bord === 1 && s.pos === 1)?.publicId).toBe('x') // untouched
    expect(out.filter(s => s.publicId === 'x')).toHaveLength(1)            // not double-seated
    expect(out.find(s => s.bord === 1 && s.pos === 2)?.publicId).toBe('a')
  })

  it('stops gracefully when the pool runs out', () => {
    const out = suggestLineup([], [person('a'), person('b')])
    expect(out.filter(s => !s.isReserve)).toHaveLength(2)
  })
})

describe('seatPairIntoBoard', () => {
  it('seats a pair into the first fully-empty banpar', () => {
    const out = seatPairIntoBoard([starter('x', 1, 1)], person('a'), person('b'))
    // bord 1 has a starter, so the pair lands on bord 2
    expect(out.find(s => s.publicId === 'a')).toMatchObject({ bord: 2, pos: 1 })
    expect(out.find(s => s.publicId === 'b')).toMatchObject({ bord: 2, pos: 2 })
  })

  it('is a no-op when every banpar already has a starter', () => {
    const full = [1, 2, 3, 4].map(b => starter(`s${b}`, b, 1))
    expect(seatPairIntoBoard(full, person('a'), person('b'))).toEqual(full)
  })

  it('removes the pair from any slot they already hold', () => {
    const out = seatPairIntoBoard([starter('a', 1, 1)], person('a'), person('b'))
    expect(out.filter(s => s.publicId === 'a')).toHaveLength(1)
    expect(out.find(s => s.publicId === 'a')).toMatchObject({ bord: 2, pos: 1 })
  })
})
