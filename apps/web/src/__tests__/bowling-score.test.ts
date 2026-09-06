import { describe, it, expect } from 'vitest'
import { scoreGame, gameTotal, isGameComplete, maxNextRoll, frameMarks, framesOf } from '@bowlkollen/core'

describe('bowling-score', () => {
  it('scores a perfect game as 300', () => {
    expect(gameTotal(Array(12).fill(10))).toBe(300)
  })

  it('scores all-fives (every frame a spare) as 150', () => {
    expect(gameTotal(Array(21).fill(5))).toBe(150)
  })

  it('scores an all-open game (9 then miss) as 90', () => {
    expect(gameTotal(Array.from({ length: 20 }, (_, i) => (i % 2 ? 0 : 9)))).toBe(90)
  })

  it('leaves a strike/spare frame pending until its bonus balls land', () => {
    const { frames } = scoreGame([10, 5]) // strike, then a 5 (needs one more ball)
    expect(frames[0]).toBeNull()
  })

  it('handles the 10th frame with a strike (three balls)', () => {
    // nine opens of 9+0=9 → 81, then 10th X X X = 30 → 111
    const nine = Array.from({ length: 18 }, (_, i) => (i % 2 ? 0 : 9))
    expect(gameTotal([...nine, 10, 10, 10])).toBe(111)
    expect(isGameComplete([...nine, 10, 10, 10])).toBe(true)
    expect(isGameComplete([...nine, 10, 10])).toBe(false)
  })

  it('clamps the next roll to what is legal', () => {
    expect(maxNextRoll([])).toBe(10)      // fresh frame
    expect(maxNextRoll([7])).toBe(3)      // second ball can't exceed 10-7
    expect(maxNextRoll([10])).toBe(10)    // new frame after a strike
    expect(maxNextRoll(Array(12).fill(10))).toBe(0) // game over
  })

  it('renders ball marks (X, /, –, number)', () => {
    expect(frameMarks([10, 7, 3])[0]).toEqual(['X'])
    expect(frameMarks([7, 3])[0]).toEqual(['7', '/'])
    expect(frameMarks([0, 5])[0]).toEqual(['–', '5'])
    expect(framesOf([10, 10, 10]).length).toBe(3)
  })
})
