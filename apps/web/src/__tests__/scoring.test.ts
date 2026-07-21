import { describe, it, expect } from 'vitest'
import { calcBanpoang, calcMatchpoang, type ScoringResult } from '@/lib/scoring'

// Helpers
const HOME = 'home-team'
const AWAY = 'away-team'

/** Build a full 8-player result set (4 bords × 2 positions × 2 teams). */
function makeResults(
  homeGames: number[][],  // [bord0pos0, bord0pos1, bord1pos0, bord1pos1, ...] 8 entries × 4 games
  awayGames: number[][],
): ScoringResult[] {
  const rows: ScoringResult[] = []
  for (let i = 0; i < 4; i++) {
    rows.push({ team_id: HOME, bord: i + 1, position: 1, games: homeGames[i * 2] })
    rows.push({ team_id: HOME, bord: i + 1, position: 2, games: homeGames[i * 2 + 1] })
    rows.push({ team_id: AWAY, bord: i + 1, position: 1, games: awayGames[i * 2] })
    rows.push({ team_id: AWAY, bord: i + 1, position: 2, games: awayGames[i * 2 + 1] })
  }
  return rows
}

describe('calcBanpoang', () => {
  it('home sweeps all delmatches and kägelpoäng → [20, 0]', () => {
    // Home bowls 200 everywhere, away bowls 100 everywhere
    const h = Array(8).fill([200, 200, 200, 200])
    const a = Array(8).fill([100, 100, 100, 100])
    expect(calcBanpoang(HOME, AWAY, makeResults(h, a))).toEqual([20, 0])
  })

  it('away sweeps all → [0, 20]', () => {
    const h = Array(8).fill([100, 100, 100, 100])
    const a = Array(8).fill([200, 200, 200, 200])
    expect(calcBanpoang(HOME, AWAY, makeResults(h, a))).toEqual([0, 20])
  })

  it('equal scores → all ties → [0, 0]', () => {
    const g = Array(8).fill([200, 200, 200, 200])
    expect(calcBanpoang(HOME, AWAY, makeResults(g, g))).toEqual([0, 0])
  })

  it('home wins 3 of 4 bords + all kägelpoäng in serie 1 only, away wins 1 bord (serie 1)', () => {
    // serie 0 (gi=0): home wins bords 1,2,3 (combined 300 vs 200); away wins bord 4 (100 vs 300)
    // serier 1-3: all equal
    // kägelpoäng serie 0: home has 3×300 + 1×100 = 1000, away 3×200 + 1×300 = 900 → home +1
    // kägelpoäng 1-3: equal → 0
    // delmatches: home 3, away 1 (each only in serie 0; serier 1-3 are equal → 0)
    // total: home 3+1=4, away 1
    const homeGames = [
      [150, 0, 0, 0], [150, 0, 0, 0],  // bord 1: combined 300 in s0
      [150, 0, 0, 0], [150, 0, 0, 0],  // bord 2: combined 300 in s0
      [150, 0, 0, 0], [150, 0, 0, 0],  // bord 3: combined 300 in s0
      [50,  0, 0, 0], [50,  0, 0, 0],  // bord 4: combined 100 in s0
    ]
    const awayGames = [
      [100, 0, 0, 0], [100, 0, 0, 0],  // bord 1: combined 200 in s0
      [100, 0, 0, 0], [100, 0, 0, 0],  // bord 2: combined 200 in s0
      [100, 0, 0, 0], [100, 0, 0, 0],  // bord 3: combined 200 in s0
      [150, 0, 0, 0], [150, 0, 0, 0],  // bord 4: combined 300 in s0
    ]
    const [h, a] = calcBanpoang(HOME, AWAY, makeResults(homeGames, awayGames))
    // Home: 3 delmatches + 1 kägelpoäng = 4; Away: 1 delmatch
    expect(h).toBe(4)
    expect(a).toBe(1)
  })

  it('kägelpoäng goes to away when they outscore total even if home wins more delmatches', () => {
    // Home wins 3 bords but by slim margin; away loses 3 but by huge margin on one bord
    // serie 0 only:
    // Home bord1: 110+110=220, away: 100+100=200 → home +1 delmatch
    // Home bord2: 110+110=220, away: 100+100=200 → home +1
    // Home bord3: 110+110=220, away: 100+100=200 → home +1
    // Home bord4: 100+100=200, away: 250+250=500 → away +1
    // kägelpoäng: home=220*3+200=860, away=200*3+500=1100 → away +1
    const homeGames = [
      [110, 0, 0, 0], [110, 0, 0, 0],
      [110, 0, 0, 0], [110, 0, 0, 0],
      [110, 0, 0, 0], [110, 0, 0, 0],
      [100, 0, 0, 0], [100, 0, 0, 0],
    ]
    const awayGames = [
      [100, 0, 0, 0], [100, 0, 0, 0],
      [100, 0, 0, 0], [100, 0, 0, 0],
      [100, 0, 0, 0], [100, 0, 0, 0],
      [250, 0, 0, 0], [250, 0, 0, 0],
    ]
    const [h, a] = calcBanpoang(HOME, AWAY, makeResults(homeGames, awayGames))
    expect(h).toBe(3)  // 3 delmatch wins
    expect(a).toBe(2)  // 1 delmatch + 1 kägelpoäng
  })

  it('empty results → [0, 0]', () => {
    expect(calcBanpoang(HOME, AWAY, [])).toEqual([0, 0])
  })

  it('partial results (only 2 of 4 serier played)', () => {
    // Only gi=0 and gi=1 have data; gi=2 and gi=3 are 0/absent
    const homeGames = Array(8).fill([200, 200, 0, 0])
    const awayGames = Array(8).fill([100, 100, 0, 0])
    const [h, a] = calcBanpoang(HOME, AWAY, makeResults(homeGames, awayGames))
    // 4 bords × 2 serier delmatches (home wins all) + 2 kägelpoäng = 10
    expect(h).toBe(10)
    expect(a).toBe(0)
  })

  it('max 20 banpoäng is achievable', () => {
    const h = Array(8).fill([200, 200, 200, 200])
    const a = Array(8).fill([100, 100, 100, 100])
    const [home] = calcBanpoang(HOME, AWAY, makeResults(h, a))
    expect(home).toBe(20)
  })

  it('delmatch is combined 2-player score, not individual comparison', () => {
    // Home bord 1: pos1=50, pos2=300 → combined 350
    // Away bord 1: pos1=200, pos2=200 → combined 400
    // Away wins the delmatch even though home has one player who bowled more
    const results: ScoringResult[] = [
      { team_id: HOME, bord: 1, position: 1, games: [50,  0, 0, 0] },
      { team_id: HOME, bord: 1, position: 2, games: [300, 0, 0, 0] },
      { team_id: AWAY, bord: 1, position: 1, games: [200, 0, 0, 0] },
      { team_id: AWAY, bord: 1, position: 2, games: [200, 0, 0, 0] },
    ]
    const [h, a] = calcBanpoang(HOME, AWAY, results)
    // Away wins delmatch (400 > 350). Away also wins kägelpoäng (400 > 350).
    expect(h).toBe(0)
    expect(a).toBe(2)
  })
})

describe('calcMatchpoang', () => {
  it('home more banpoäng → [2, 0]', () => {
    expect(calcMatchpoang(15, 5)).toEqual([2, 0])
  })

  it('away more banpoäng → [0, 2]', () => {
    expect(calcMatchpoang(5, 15)).toEqual([0, 2])
  })

  it('equal banpoäng → draw [1, 1]', () => {
    expect(calcMatchpoang(10, 10)).toEqual([1, 1])
  })

  it('0–0 → draw [1, 1]', () => {
    expect(calcMatchpoang(0, 0)).toEqual([1, 1])
  })
})
