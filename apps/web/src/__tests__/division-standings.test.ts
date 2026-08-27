import { describe, it, expect } from 'vitest'
import {
  computeStandings,
  divisionTier,
  groupDivisionsByTier,
  standingsNeighbors,
  buildTeamNarrativeInput,
  type MatchRow,
  type TeamStanding,
} from '@/lib/division-standings'

function match(overrides: Partial<MatchRow> & Pick<MatchRow, 'home_bits_team_id' | 'away_bits_team_id' | 'home_result' | 'away_result'>): MatchRow {
  return {
    bits_match_id:  overrides.home_bits_team_id * 100 + overrides.away_bits_team_id,
    home_team_name: `Team ${overrides.home_bits_team_id}`,
    away_team_name: `Team ${overrides.away_bits_team_id}`,
    is_finished:    true,
    match_date:     '2025-01-01',
    round_id:       1,
    hall_name:      null,
    ...overrides,
  }
}

describe('computeStandings', () => {
  it('awards 2 pts to winner, 0 to loser', () => {
    const rows = [match({ home_bits_team_id: 1, away_bits_team_id: 2, home_result: 6, away_result: 2 })]
    const standings = computeStandings(rows)
    const home = standings.find(s => s.teamId === 1)!
    const away = standings.find(s => s.teamId === 2)!
    expect(home.points).toBe(2)
    expect(away.points).toBe(0)
    expect(home.won).toBe(1)
    expect(away.lost).toBe(1)
  })

  it('awards 1 pt each on a draw (4-4)', () => {
    const rows = [match({ home_bits_team_id: 1, away_bits_team_id: 2, home_result: 4, away_result: 4 })]
    const standings = computeStandings(rows)
    const home = standings.find(s => s.teamId === 1)!
    const away = standings.find(s => s.teamId === 2)!
    expect(home.points).toBe(1)
    expect(away.points).toBe(1)
    expect(home.drawn).toBe(1)
    expect(away.drawn).toBe(1)
  })

  it('accumulates board wins/losses across matches', () => {
    const rows = [
      match({ home_bits_team_id: 1, away_bits_team_id: 2, home_result: 6, away_result: 2 }),
      match({ home_bits_team_id: 2, away_bits_team_id: 1, home_result: 5, away_result: 3 }),
    ]
    const standings = computeStandings(rows)
    const t1 = standings.find(s => s.teamId === 1)!
    const t2 = standings.find(s => s.teamId === 2)!
    expect(t1.boardWins).toBe(6 + 3)   // won 6 at home, 3 away
    expect(t1.boardLosses).toBe(2 + 5) // lost 2 at home, 5 away
    expect(t2.boardWins).toBe(2 + 5)
    expect(t2.boardLosses).toBe(6 + 3)
  })

  it('sorts by points desc, then net board wins desc', () => {
    const rows = [
      match({ home_bits_team_id: 1, away_bits_team_id: 2, home_result: 5, away_result: 3 }),
      match({ home_bits_team_id: 3, away_bits_team_id: 4, home_result: 6, away_result: 2 }),
      match({ home_bits_team_id: 2, away_bits_team_id: 3, home_result: 4, away_result: 4 }),
    ]
    const standings = computeStandings(rows)
    // T3: 1W+1D = 3 pts; T1: 1W = 2 pts; T2: 1D+1L = 1 pt; T4: 1L = 0 pts
    expect(standings[0].teamId).toBe(3)
    expect(standings[1].teamId).toBe(1)
    expect(standings[2].teamId).toBe(2)
    expect(standings[3].teamId).toBe(4)
  })

  it('skips matches that are not finished', () => {
    const rows = [
      match({ home_bits_team_id: 1, away_bits_team_id: 2, home_result: 6, away_result: 2, is_finished: false }),
    ]
    expect(computeStandings(rows)).toHaveLength(0)
  })

  it('skips matches where result is null', () => {
    const rows = [
      match({ home_bits_team_id: 1, away_bits_team_id: 2, home_result: null, away_result: null }),
    ]
    expect(computeStandings(rows)).toHaveLength(0)
  })

  it('returns empty array for empty input', () => {
    expect(computeStandings([])).toHaveLength(0)
  })
})

describe('divisionTier', () => {
  it.each([
    ['Elitserien Herrar',              'Elitserien'],
    ['Elitserien Damer',               'Elitserien'],
    ['Allsvenskan Herrar Norra',       'Allsvenskan'],
    // All Allsvenskan variants share one tier, regardless of casing/spacing:
    // the men's one-word forms have a lowercase 'a'.
    ['Mellanallsvenskan Herrar Väst',  'Allsvenskan'],
    ['Sydallsvenskan Herrar',          'Allsvenskan'],
    ['Nordallsvenskan Herrar',         'Allsvenskan'],
    ['Södra Allsvenskan Damer',        'Allsvenskan'],
    ['Division 1 Herrar Norra',        'Division 1'],
    ['Division 2 Herrar Syd',          'Division 2'],
    ['Division 5 Damer',               'Division 5'],
    ['Distriktsserien X',              'Övrigt'],
    // Regional district leagues that happen to contain "Div N" as a
    // substring must NOT be mistaken for the national tier.
    ['Värmlands P4 Div 4',             'Övrigt'],
    ['Stockholmsligan 1',              'Övrigt'],
  ])('%s → %s', (name, expected) => {
    expect(divisionTier(name)).toBe(expected)
  })
})

describe('groupDivisionsByTier', () => {
  const tier = (groups: { tier: string; items: { name: string }[] }[], t: string) => groups.find(g => g.tier === t)?.items

  it('groups by tier order and omits empty tiers', () => {
    const groups = groupDivisionsByTier([
      { bits_division_id: 1, name: 'Elitserien Herrar' },
      { bits_division_id: 2, name: 'Division 1 Herrar Norra' },
      { bits_division_id: 3, name: 'Division 1 Herrar Söder' },
    ])
    expect(tier(groups, 'Elitserien')).toHaveLength(1)
    expect(tier(groups, 'Division 1')).toHaveLength(2)
    expect(groups.some(g => g.tier === 'Allsvenskan')).toBe(false)
    expect(groups.map(g => g.tier)).toEqual(['Elitserien', 'Division 1']) // tier order preserved
  })

  it('sorts within a tier by Swedish locale (Ö after V)', () => {
    const groups = groupDivisionsByTier([
      { name: 'Division 2 Östra' }, { name: 'Division 2 Västra' }, { name: 'Division 2 Norra' },
    ])
    expect(tier(groups, 'Division 2')!.map(d => d.name)).toEqual(['Division 2 Norra', 'Division 2 Västra', 'Division 2 Östra'])
  })
})

function standing(teamId: number, points: number): TeamStanding {
  return { teamId, teamName: `Team ${teamId}`, played: 0, won: 0, drawn: 0, lost: 0, boardWins: 0, boardLosses: 0, points }
}

describe('standingsNeighbors', () => {
  const table = [1, 2, 3, 4, 5, 6, 7, 8].map(id => standing(id, 100 - id))

  it('centers a window around the team', () => {
    expect(standingsNeighbors(table, 4, 2).map(r => r.teamId)).toEqual([2, 3, 4, 5, 6])
  })

  it('clamps the window at the top of the table', () => {
    expect(standingsNeighbors(table, 1, 2).map(r => r.teamId)).toEqual([1, 2, 3, 4, 5])
  })

  it('clamps the window at the bottom of the table', () => {
    expect(standingsNeighbors(table, 8, 2).map(r => r.teamId)).toEqual([4, 5, 6, 7, 8])
  })

  it('returns everyone when the division is smaller than the window', () => {
    const small = [1, 2, 3].map(id => standing(id, 10 - id))
    expect(standingsNeighbors(small, 2, 2)).toHaveLength(3)
  })

  it('returns empty when the team is not in the standings', () => {
    expect(standingsNeighbors(table, 999, 2)).toEqual([])
  })
})

describe('buildTeamNarrativeInput', () => {
  it('builds the table, most-recent-first form, and opponent context', () => {
    const matches: MatchRow[] = [
      match({ home_bits_team_id: 1, away_bits_team_id: 2, home_result: 6, away_result: 2, match_date: '2025-01-01' }),
      match({ home_bits_team_id: 3, away_bits_team_id: 1, home_result: 5, away_result: 3, match_date: '2025-01-08' }),
      match({ home_bits_team_id: 1, away_bits_team_id: 4, home_result: null, away_result: null, match_date: '2025-01-15', is_finished: false }),
    ]
    const standings = computeStandings(matches)
    const input = buildTeamNarrativeInput(1, matches, standings)

    expect(input.teamId).toBe('1')
    expect(input.totalMatches).toBe(3)
    expect(input.playedMatches).toBe(2)
    // Most recent first: lost the second match (to team 3), won the first.
    expect(input.form).toEqual(['L', 'W'])
    expect(input.lastMatchResult).toBe('L')
    expect(input.lastOpponentId).toBe('3')
    expect(input.upcomingOpponentId).toBe('4')
    expect(input.table.find(r => r.teamId === '1')).toBeDefined()
  })

  it('is null/empty-safe when the team has no match history', () => {
    const input = buildTeamNarrativeInput(1, [], [])
    expect(input.form).toEqual([])
    expect(input.lastOpponentId).toBeNull()
    expect(input.upcomingOpponentId).toBeNull()
    expect(input.lastMatchResult).toBeNull()
  })
})
