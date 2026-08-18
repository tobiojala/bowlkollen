import { describe, it, expect } from 'vitest'
import {
  eventKey, outcomeOf, bestScorer, calcMatchAvg, milestoneOrdinal,
  winStreakTitle, matchResultTitle, matchResultBody, personalBestTitle, formRisingTitle,
  emotionalWinInserts, type EmotionalMatch,
} from '@/lib/sync-bits-team-events.helpers'

const ME = 100
function match(id: number, date: string, home: number, away: number, homeId = ME, awayId = 200): EmotionalMatch {
  return {
    bits_match_id: id, match_date: date, home_result: home, away_result: away,
    home_bits_team_id: homeId, away_bits_team_id: awayId,
    home_team_name: homeId === ME ? 'Oss' : 'Motståndare', away_team_name: awayId === ME ? 'Oss' : 'Motståndare',
  }
}

describe('eventKey', () => {
  it('is stable and includes every part', () => {
    expect(eventKey('match_result', '3290233', '2025-09-13')).toBe('match_result|3290233|2025-09-13|')
    expect(eventKey('personal_best', '99', '2025-09-13', 'Anneli')).toBe('personal_best|99|2025-09-13|Anneli')
  })
  it('renders a null match_id as empty, not the string "null"', () => {
    expect(eventKey('form_rising', null, '2025-09-13', 'Hanna')).toBe('form_rising||2025-09-13|Hanna')
  })
})

describe('outcomeOf', () => {
  it('classifies win / loss / draw', () => {
    expect(outcomeOf(5, 3)).toBe('W')
    expect(outcomeOf(3, 5)).toBe('L')
    expect(outcomeOf(4, 4)).toBe('D')
  })
  it('returns null when a score is missing', () => {
    expect(outcomeOf(null, 3)).toBeNull()
    expect(outcomeOf(3, null)).toBeNull()
  })
})

describe('bestScorer', () => {
  it('picks the highest single game across players', () => {
    expect(bestScorer([
      { player_name: 'A', series: [180, 210, 195] },
      { player_name: 'B', series: [220, 190, 205] },
    ])).toEqual({ name: 'B', high: 220 })
  })
  it('ignores zero/blank games and empty series', () => {
    expect(bestScorer([{ player_name: 'A', series: [0, 0, 199] }])).toEqual({ name: 'A', high: 199 })
    expect(bestScorer([{ player_name: 'A', series: null }])).toBeNull()
  })
  it('returns null for no rows', () => {
    expect(bestScorer([])).toBeNull()
  })
})

describe('calcMatchAvg', () => {
  it('averages only the valid games, rounded', () => {
    expect(calcMatchAvg([200, 210, 190])).toBe(200)
    expect(calcMatchAvg([200, 0, 190])).toBe(195)
  })
  it('returns null when there are no valid games', () => {
    expect(calcMatchAvg([])).toBeNull()
    expect(calcMatchAvg([0, 0])).toBeNull()
  })
})

describe('milestoneOrdinal', () => {
  it('formats the Swedish ordinal', () => {
    expect(milestoneOrdinal(10)).toBe('10:e')
    expect(milestoneOrdinal(100)).toBe('100:e')
  })
})

describe('winStreakTitle', () => {
  it('escalates by streak length', () => {
    expect(winStreakTitle(3)).toBe('Tre matcher, tre segrar')
    expect(winStreakTitle(5)).toBe('Fem i rad — laget rullar')
    expect(winStreakTitle(7)).toBe('Sju matcher utan förlust')
    expect(winStreakTitle(10)).toContain('historisk')
  })
})

describe('matchResultTitle', () => {
  it('varies by margin and venue for a win', () => {
    expect(matchResultTitle('W', 'AIK', 8, 2, true)).toContain('Dominerade hemma')
    expect(matchResultTitle('W', 'AIK', 8, 2, false)).toContain('borta')
    expect(matchResultTitle('W', 'AIK', 5, 4, true)).toContain('Höll undan')
  })
  it('handles loss and draw', () => {
    expect(matchResultTitle('L', 'AIK', 2, 8, true)).toContain('för starka')
    expect(matchResultTitle('D', 'AIK', 4, 4, true)).toContain('Delade poängen')
  })
})

describe('matchResultBody', () => {
  it('appends the top scorer when present', () => {
    const body = matchResultBody('W', 6, 2, true, { name: 'Anneli', high: 245 })
    expect(body).toContain('Anneli toppade med 245')
  })
  it('works without a top scorer', () => {
    expect(matchResultBody('D', 4, 4, false, null)).toContain('Delade poängen 4–4 borta')
  })
})

describe('personalBestTitle', () => {
  it('escalates language with the size of the jump', () => {
    expect(personalBestTitle('A', 250, 25)).toContain('slår rekord')
    expect(personalBestTitle('A', 250, 12)).toContain('skriver om rekordboken')
    expect(personalBestTitle('A', 250, 4)).toContain('eget rekord')
  })
})

describe('formRisingTitle', () => {
  it('escalates with delta over the season average', () => {
    expect(formRisingTitle('A', 16, 220)).toContain('karriärbästa')
    expect(formRisingTitle('A', 11, 220)).toContain('klättrar')
    expect(formRisingTitle('A', 6, 220)).toContain('över snitt')
  })
})

describe('emotionalWinInserts', () => {
  it('emits a revenge_win when we beat a team that beat us earlier', () => {
    const matches = [
      match(1, '2025-09-01', 2, 6),  // we (home) lost to team 200
      match(2, '2025-10-01', 7, 3),  // we (home) beat team 200 → revenge
    ]
    const rows = emotionalWinInserts(matches, ME, new Set(), 10)
    const revenge = rows.filter(r => r.event_type === 'revenge_win')
    expect(revenge).toHaveLength(1)
    expect(revenge[0].match_id).toBe('2')
  })

  it('does not emit revenge when the prior meeting was also a win', () => {
    const matches = [match(1, '2025-09-01', 6, 2), match(2, '2025-10-01', 7, 3)]
    const rows = emotionalWinInserts(matches, ME, new Set(), 10)
    expect(rows.filter(r => r.event_type === 'revenge_win')).toHaveLength(0)
  })

  it('respects the remaining cap and returns nothing when remaining <= 0', () => {
    const matches = [match(1, '2025-09-01', 2, 6), match(2, '2025-10-01', 7, 3)]
    expect(emotionalWinInserts(matches, ME, new Set(), 0)).toHaveLength(0)
  })

  it('skips events already recorded in `seen`', () => {
    const matches = [match(1, '2025-09-01', 2, 6), match(2, '2025-10-01', 7, 3)]
    const seen = new Set([eventKey('revenge_win', '2', '2025-10-01')])
    expect(emotionalWinInserts(matches, ME, seen, 10).filter(r => r.event_type === 'revenge_win')).toHaveLength(0)
  })
})
