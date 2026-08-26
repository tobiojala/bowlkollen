import { describe, it, expect } from 'vitest'
import { buildStoryEntities, entityKey } from '@/lib/story-rail'
import type { FeedPlayerResult, BitsMatchFeed, TeamEvent } from '@/lib/types'

const player = (id: string, name: string, date: string) =>
  ({ kind: 'player_result', playerId: id, playerName: name, date, matchId: 1, total: 220, games: [220], opponent: 'X', division: 'Div 1' } as unknown as FeedPlayerResult)

const match = (home: number, away: number, date: string) =>
  ({ bits_match_id: 9, home_bits_team_id: home, away_bits_team_id: away, home_team_name: `T${home}`, away_team_name: `T${away}`, match_date: date, division_name: 'Elitserien' } as unknown as BitsMatchFeed)

const event = (teamId: number, name: string, date: string) =>
  ({ id: `e${teamId}`, bits_team_id: teamId, team: { name }, event_date: date, event_type: 'win_streak' } as unknown as TeamEvent)

describe('buildStoryEntities', () => {
  it('makes one circle per followed player/team, newest activity first', () => {
    const out = buildStoryEntities(
      [player('p1', 'Anna Berg', '2026-08-20')],
      [match(100, 200, '2026-08-25')],   // only 100 is followed
      [event(100, 'X-Calibur', '2026-08-24')],
      ['100'],
    )
    expect(out.map(e => e.key)).toEqual([entityKey('team', 100), entityKey('player', 'p1')])
    expect(out[0].latestTs).toBe('2026-08-25') // team's newest across match+event
  })

  it('keeps the most recent timestamp per entity', () => {
    const out = buildStoryEntities(
      [player('p1', 'Anna', '2026-08-10'), player('p1', 'Anna', '2026-08-22')],
      [], [], [],
    )
    expect(out).toHaveLength(1)
    expect(out[0].latestTs).toBe('2026-08-22')
  })

  it('ignores matches whose teams the user does not follow', () => {
    const out = buildStoryEntities([], [match(100, 200, '2026-08-25')], [], ['999'])
    expect(out).toHaveLength(0)
  })
})
