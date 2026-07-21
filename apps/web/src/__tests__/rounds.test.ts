import { describe, it, expect } from 'vitest'
import { groupByRound, roundDateLabel, type RoundLike } from '@/lib/rounds'

const m = (date: string, round: number | null, finished = false): RoundLike =>
  ({ match_date: date, round_id: round, is_finished: finished })

describe('groupByRound', () => {
  it('groups by round_id and relabels sequentially by date', () => {
    // Deliberately out of order, with a sparse round id starting at 2.
    const groups = groupByRound([
      m('2026-09-19', 3), m('2026-09-12', 2), m('2026-09-12', 2), m('2026-09-26', 4),
    ])
    expect(groups.map(g => g.label)).toEqual(['Omgång 1', 'Omgång 2', 'Omgång 3'])
    expect(groups[0].firstDate).toBe('2026-09-12')
    expect(groups[0].matches).toHaveLength(2)
  })

  it('marks a round played only when every match is finished', () => {
    const groups = groupByRound([
      m('2026-09-12', 1, true), m('2026-09-12', 1, false),
      m('2026-09-19', 2, true), m('2026-09-19', 2, true),
    ])
    expect(groups[0].played).toBe(false) // one still upcoming
    expect(groups[1].played).toBe(true)
  })

  it('falls back to match date when round_id is null', () => {
    const groups = groupByRound([m('2026-09-12', null), m('2026-09-19', null)])
    expect(groups).toHaveLength(2)
  })

  it('sorts matches within a round by date', () => {
    const groups = groupByRound([m('2026-09-14', 1), m('2026-09-12', 1), m('2026-09-13', 1)])
    expect(groups[0].matches.map(x => x.match_date)).toEqual(['2026-09-12', '2026-09-13', '2026-09-14'])
  })
})

describe('roundDateLabel', () => {
  it('single day', () => {
    expect(roundDateLabel('2026-09-12', '2026-09-12')).toBe('12 sep')
  })
  it('same month range', () => {
    expect(roundDateLabel('2026-09-12', '2026-09-14')).toBe('12–14 sep')
  })
  it('cross-month range', () => {
    expect(roundDateLabel('2026-09-28', '2026-10-02')).toBe('28 sep – 2 okt')
  })
})
