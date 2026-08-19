import { describe, it, expect } from 'vitest'
import { computeTeamStats, type TeamStatMatch, type TeamStatResult } from '@bowlkollen/core'

const TEAM = 100

// M1: team 100 home, wins 6–2. M2: team 100 away, loses 3–5.
const matches: TeamStatMatch[] = [
  { bits_match_id: 1, match_date: '2025-09-01', home_bits_team_id: 100, away_bits_team_id: 200, home_team_name: 'Oss', away_team_name: 'Lag200', home_result: 6, away_result: 2, is_finished: true },
  { bits_match_id: 2, match_date: '2025-10-01', home_bits_team_id: 300, away_bits_team_id: 100, home_team_name: 'Lag300', away_team_name: 'Oss', home_result: 5, away_result: 3, is_finished: true },
  { bits_match_id: 3, match_date: '2025-11-01', home_bits_team_id: 100, away_bits_team_id: 400, home_team_name: 'Oss', away_team_name: 'Lag400', home_result: null, away_result: null, is_finished: false },
]

const results: TeamStatResult[] = [
  // M1 (team is home)
  { bits_match_id: 1, player_name: 'A', lic_nbr: 'LA', series: [200, 210, 190], is_home_team: true },
  { bits_match_id: 1, player_name: 'B', lic_nbr: 'LB', series: [180, 200, 160], is_home_team: true },
  { bits_match_id: 1, player_name: 'X', lic_nbr: 'LX', series: [300, 300, 300], is_home_team: false }, // opponent — ignored
  // M2 (team is away)
  { bits_match_id: 2, player_name: 'A', lic_nbr: 'LA', series: [220, 230, 210], is_home_team: false },
  { bits_match_id: 2, player_name: 'B', lic_nbr: 'LB', series: [150, 160, 170], is_home_team: false },
]

describe('computeTeamStats', () => {
  const s = computeTeamStats(TEAM, matches, results)

  it('counts only this team\'s finished matches', () => {
    expect(s.played).toBe(2)
    expect(s.record).toEqual({ wins: 1, losses: 1, draws: 0 })
    expect(s.winPct).toBe(50)
  })

  it('sums banpoäng for and against', () => {
    expect(s.banFor).toBe(9)   // 6 + 3
    expect(s.banAgainst).toBe(7) // 2 + 5
  })

  it('form is most-recent first', () => {
    expect(s.form).toEqual(['L', 'W'])
  })

  it('team average is mean pins/game over both matches (opponent games excluded)', () => {
    expect(s.teamAverage).toBe(190)
  })

  it('splits home vs away', () => {
    expect(s.home.played).toBe(1)
    expect(s.home.wins).toBe(1)
    expect(s.away.played).toBe(1)
    expect(s.away.losses).toBe(1)
  })

  it('finds the high single game and the high match pinfall', () => {
    expect(s.highGame).toEqual({ name: 'A', pins: 230, date: '2025-10-01' })
    expect(s.highMatch?.total).toBe(1140)
    expect(s.highMatch?.opponent).toBe('Lag200')
  })

  it('per-player lines sorted by average desc', () => {
    expect(s.players.map(p => p.name)).toEqual(['A', 'B'])
    expect(s.players[0]).toMatchObject({ name: 'A', average: 210, high: 230, matches: 2, games: 6 })
    expect(s.players[1]).toMatchObject({ name: 'B', average: 170 })
  })

  it('trend is chronological with per-match average + outcome', () => {
    expect(s.trend.map(t => t.matchId)).toEqual([1, 2])
    expect(s.trend[0]).toMatchObject({ average: 190, outcome: 'W', opponent: 'Lag200' })
  })
})
