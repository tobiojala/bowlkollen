import { describe, it, expect } from 'vitest'
import { buildProfileData, type ProfileMatch } from '@/lib/profile'

const m = (date: string, games: number[], home = true): ProfileMatch =>
  ({ date, opp: 'X', result: 'W 6–2', games, home })

const season: ProfileMatch[] = [
  m('14 sep', [178, 192, 203, 187]),
  m('21 sep', [201, 215, 198, 224]),
  m('28 sep', [189, 176, 201, 195]),
  m('5 okt',  [223, 211, 198, 234]),
  m('12 okt', [256, 234, 212, 245]),
]

describe('buildProfileData', () => {
  const d = buildProfileData(season, { lastSeasonAvg: 200 })

  it('computes season average over all valid games', () => {
    const all = season.flatMap(x => x.games)
    expect(d.seasonAvg).toBe(Math.round(all.reduce((a, b) => a + b) / all.length))
  })

  it('produces one match average per match', () => {
    expect(d.matchAvgs).toHaveLength(season.length)
    expect(d.matchAvgs[0]).toBe(Math.round((178 + 192 + 203 + 187) / 4))
  })

  it('finds the best series and its index', () => {
    expect(d.bestSeries).toBe(256 + 234 + 212 + 245)
    expect(d.bestSeriesIdx).toBe(4)
  })

  it('form is recent-4 average minus season average', () => {
    const recent = season.slice(-4).flatMap(x => x.games)
    const recentAvg = Math.round(recent.reduce((a, b) => a + b) / recent.length)
    expect(d.formDiff).toBe(recentAvg - d.seasonAvg)
  })

  it('hit rate is share of games >= 200', () => {
    const all = season.flatMap(x => x.games)
    const over = all.filter(g => g >= 200).length
    expect(d.hitRate).toBe(Math.round((over / all.length) * 100))
  })

  it('game-position averages have one entry per game slot', () => {
    expect(d.gameAvgs).toHaveLength(4)
  })

  it('projection adds 3 future matches at current form', () => {
    const sum = d.matchAvgs.reduce((a, b) => a + b)
    expect(d.projSeasonAvg).toBe(Math.round((sum + d.recentAvg * 3) / (d.matchAvgs.length + 3)))
  })

  it('handles an empty season without throwing', () => {
    const empty = buildProfileData([])
    expect(empty.hasData).toBe(false)
    expect(empty.seasonAvg).toBe(0)
    expect(empty.matchAvgs).toEqual([])
  })

  it('ignores zero-padding games', () => {
    const padded = buildProfileData([m('x', [200, 200, 0, 0])])
    expect(padded.seasonAvg).toBe(200)
  })
})
