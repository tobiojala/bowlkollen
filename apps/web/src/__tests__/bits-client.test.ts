import { parseTeamSeries, parsePlayerTotals, parseMatchResults, type BitsMatchScores, type BitsMatchResults } from '@/lib/bits-client'

function makeScores(data: {
  series: Array<{
    boards: Array<{
      scores: Array<{ playerName: string; score: string; laneScore: string; scoreId: string }>
    }>
  }>
}): BitsMatchScores {
  return {
    series:     data.series.map((s, si) => ({
      serieId:   String(si + 1),
      serieName: `S${si + 1}`,
      boards:    s.boards.map((b, bi) => ({
        boardId:   String(bi + 1),
        boardName: `Bord ${bi + 1}`,
        scores:    b.scores,
      })),
    })),
    serieNames: data.series.map((_, i) => `S${i + 1}`),
    boardNames: data.series[0]?.boards.map((_, i) => `Bord ${i + 1}`) ?? [],
  }
}

// The outer `boards` array splits in half: first half = home team's board
// groups, second half = away team's. Each board's inner `scores` array holds
// the team's players for that group — NOT alternating home/away entries.
// (Verified against known pin totals across real matches — see bits-sync.ts.)
const FIXTURE = makeScores({
  series: [
    {
      boards: [
        { // home, board 1
          scores: [
            { playerName: 'A. Home1', score: '200', laneScore: '1', scoreId: '1' },
            { playerName: 'C. Home2', score: '220', laneScore: '1', scoreId: '2' },
          ],
        },
        { // away, board 2
          scores: [
            { playerName: 'B. Away1', score: '180', laneScore: '380', scoreId: '3' },
            { playerName: 'D. Away2', score: '190', laneScore: '370', scoreId: '4' },
          ],
        },
      ],
    },
    {
      boards: [
        { // home, board 1
          scores: [
            { playerName: 'A. Home1', score: '215', laneScore: '1', scoreId: '5' },
            { playerName: 'C. Home2', score: '205', laneScore: '1', scoreId: '6' },
          ],
        },
        { // away, board 2
          scores: [
            { playerName: 'B. Away1', score: '200', laneScore: '415', scoreId: '7' },
            { playerName: 'D. Away2', score: '195', laneScore: '395', scoreId: '8' },
          ],
        },
      ],
    },
  ],
})

describe('parseTeamSeries', () => {
  it('sums first half of boards as home, second half as away', () => {
    const { teamA, teamB } = parseTeamSeries(FIXTURE)

    // Serie 1 — home: 200+220 = 420; away: 180+190 = 370
    expect(teamA[0]).toBe(420)
    expect(teamB[0]).toBe(370)

    // Serie 2 — home: 215+205 = 420; away: 200+195 = 395
    expect(teamA[1]).toBe(420)
    expect(teamB[1]).toBe(395)
  })

  it('returns arrays of equal length matching number of series', () => {
    const { teamA, teamB } = parseTeamSeries(FIXTURE)
    expect(teamA).toHaveLength(2)
    expect(teamB).toHaveLength(2)
  })

  it('returns empty arrays for empty series', () => {
    const empty = makeScores({ series: [] })
    const { teamA, teamB } = parseTeamSeries(empty)
    expect(teamA).toHaveLength(0)
    expect(teamB).toHaveLength(0)
  })

  it('skips malformed score strings gracefully', () => {
    const bad = makeScores({
      series: [{
        boards: [
          { scores: [{ playerName: 'X', score: 'NaN', laneScore: '0', scoreId: '1' }, { playerName: 'Y', score: '', laneScore: '0', scoreId: '2' }] },
          { scores: [{ playerName: 'Z', score: '200', laneScore: '0', scoreId: '3' }, { playerName: 'W', score: '150', laneScore: '0', scoreId: '4' }] },
        ],
      }],
    })
    const { teamA, teamB } = parseTeamSeries(bad)
    expect(teamA[0]).toBe(0)   // X/Y both malformed
    expect(teamB[0]).toBe(350) // Z+W
  })

  it('handles odd board counts by giving the extra board to away', () => {
    // 3 boards: floor(3/2) = 1 home board, 2 away boards
    const odd = makeScores({
      series: [{
        boards: [
          { scores: [{ playerName: 'Home', score: '200', laneScore: '0', scoreId: '1' }] },
          { scores: [{ playerName: 'Away1', score: '150', laneScore: '0', scoreId: '2' }] },
          { scores: [{ playerName: 'Away2', score: '160', laneScore: '0', scoreId: '3' }] },
        ],
      }],
    })
    const { teamA, teamB } = parseTeamSeries(odd)
    expect(teamA[0]).toBe(200)
    expect(teamB[0]).toBe(310)
  })
})

describe('parsePlayerTotals', () => {
  it('returns one entry per unique player name', () => {
    const players = parsePlayerTotals(FIXTURE)
    const names = players.map(p => p.name)
    expect(names).toContain('A. Home1')
    expect(names).toContain('B. Away1')
    expect(new Set(names).size).toBe(names.length) // no duplicates
  })

  it('correctly marks home vs away based on which half of the boards array', () => {
    const players = parsePlayerTotals(FIXTURE)
    const home = players.filter(p => p.isHomeTeam).map(p => p.name)
    const away = players.filter(p => !p.isHomeTeam).map(p => p.name)
    expect(home).toContain('A. Home1') // board 0, first half → home
    expect(home).toContain('C. Home2') // board 0, first half → home
    expect(away).toContain('B. Away1') // board 1, second half → away
    expect(away).toContain('D. Away2') // board 1, second half → away
  })

  it('accumulates games across series for same player', () => {
    const players = parsePlayerTotals(FIXTURE)
    const p = players.find(pl => pl.name === 'A. Home1')!
    expect(p.games).toEqual([200, 215])
    expect(p.total).toBe(415)
  })

  it('calculates total as sum of games', () => {
    const players = parsePlayerTotals(FIXTURE)
    for (const p of players) {
      expect(p.total).toBe(p.games.reduce((a, b) => a + b, 0))
    }
  })

  it('skips entries with empty or zero scores', () => {
    const bad = makeScores({
      series: [{
        boards: [
          { scores: [{ playerName: '', score: '200', laneScore: '0', scoreId: '1' }, { playerName: 'Real', score: '0', laneScore: '0', scoreId: '2' }] },
          { scores: [{ playerName: 'Valid', score: '180', laneScore: '0', scoreId: '3' }, { playerName: 'Also OK', score: '160', laneScore: '0', scoreId: '4' }] },
        ],
      }],
    })
    const players = parsePlayerTotals(bad)
    expect(players.find(p => p.name === '')).toBeUndefined()
    expect(players.find(p => p.name === 'Real')).toBeUndefined()
    expect(players.find(p => p.name === 'Valid')).toBeDefined()
  })
})

describe('parseMatchResults', () => {
  function makeResults(overrides: Partial<BitsMatchResults> = {}): BitsMatchResults {
    return {
      playerListHome: [],
      playerListAway: [],
      homeTeamSkillLevel: 0,
      awayTeamSkillLevel: 0,
      ...overrides,
    }
  }

  it('strips the "(LIC)" suffix to recover the full name', () => {
    const results = makeResults({
      playerListHome: [{
        player: 'Adam Andersson (M070592ADA01)', licNbr: 'M070592ADA01', homeOrAwayTeam: 'H',
        result1: 223, result2: 245, result3: 217, result4: 201,
        totalResult: 886, totalResultWithoutHcp: 886, totalSeries: 4, place: 7,
      }],
    })
    const [p] = parseMatchResults(results)
    expect(p.fullName).toBe('Adam Andersson')
    expect(p.licNbr).toBe('M070592ADA01')
    expect(p.isHomeTeam).toBe(true)
    expect(p.series).toEqual([223, 245, 217, 201])
    expect(p.total).toBe(886)
  })

  it('splits home and away correctly via homeOrAwayTeam', () => {
    const results = makeResults({
      playerListHome: [{
        player: 'Home Player (LIC1)', licNbr: 'LIC1', homeOrAwayTeam: 'H',
        result1: 200, result2: 200, result3: 200, result4: 200,
        totalResult: 800, totalResultWithoutHcp: 800, totalSeries: 4, place: 1,
      }],
      playerListAway: [{
        player: 'Away Player (LIC2)', licNbr: 'LIC2', homeOrAwayTeam: 'A',
        result1: 190, result2: 190, result3: 190, result4: 190,
        totalResult: 760, totalResultWithoutHcp: 760, totalSeries: 4, place: 2,
      }],
    })
    const rows = parseMatchResults(results)
    expect(rows.find(r => r.licNbr === 'LIC1')?.isHomeTeam).toBe(true)
    expect(rows.find(r => r.licNbr === 'LIC2')?.isHomeTeam).toBe(false)
  })

  it('skips players listed but who did not actually play', () => {
    const results = makeResults({
      playerListHome: [{
        player: 'Reserve (LIC3)', licNbr: 'LIC3', homeOrAwayTeam: 'H',
        result1: 0, result2: 0, result3: 0, result4: 0,
        totalResult: 0, totalResultWithoutHcp: 0, totalSeries: 0, place: 17,
      }],
    })
    expect(parseMatchResults(results)).toHaveLength(0)
  })

  it('trims series to totalSeries — no trailing zeros for unplayed series', () => {
    const results = makeResults({
      playerListHome: [{
        player: 'Two Series (LIC4)', licNbr: 'LIC4', homeOrAwayTeam: 'H',
        result1: 200, result2: 210, result3: 0, result4: 0,
        totalResult: 410, totalResultWithoutHcp: 410, totalSeries: 2, place: 5,
      }],
    })
    const [p] = parseMatchResults(results)
    expect(p.series).toEqual([200, 210])
  })
})
