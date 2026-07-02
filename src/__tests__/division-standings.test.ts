import {
  computeStandings,
  divisionTier,
  groupDivisionsByTier,
  type MatchRow,
} from '@/lib/division-standings'

function match(overrides: Partial<MatchRow> & Pick<MatchRow, 'home_bits_team_id' | 'away_bits_team_id' | 'home_result' | 'away_result'>): MatchRow {
  return {
    bits_match_id:  overrides.home_bits_team_id * 100 + overrides.away_bits_team_id,
    home_team_name: `Team ${overrides.home_bits_team_id}`,
    away_team_name: `Team ${overrides.away_bits_team_id}`,
    is_finished:    true,
    match_date:     '2025-01-01',
    round_id:       1,
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
    ['Mellanallsvenskan Herrar Väst',  'Mellanallsvenskan'],
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
  it('groups correctly and omits empty tiers', () => {
    const divs = [
      { bits_division_id: 1, name: 'Elitserien Herrar' },
      { bits_division_id: 2, name: 'Division 1 Herrar Norra' },
      { bits_division_id: 3, name: 'Division 1 Herrar Söder' },
    ]
    const groups = groupDivisionsByTier(divs)
    expect(groups.get('Elitserien')).toHaveLength(1)
    expect(groups.get('Division 1')).toHaveLength(2)
    expect(groups.has('Allsvenskan')).toBe(false)
  })
})
