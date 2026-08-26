'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FeedPlayerResult, BitsMatchFeed, TeamEvent } from '@/lib/types'

// The home story rail: three shared view chips + a story circle per followed
// player/team. A circle's ring lights when that entity has activity newer than
// you've seen; tapping filters the feed to them and marks them seen.

export type FeedView = 'allt' | 'matcher' | 'prediktion'

export type FeedFilter =
  | { kind: 'view'; view: FeedView }
  | { kind: 'entity'; entityType: 'player' | 'team'; id: string; name: string }

export type StoryEntity = {
  key: string                 // `${entityType}:${id}`
  entityType: 'player' | 'team'
  id: string
  name: string
  latestTs: string            // ISO/date of the entity's most recent activity
}

export const entityKey = (entityType: 'player' | 'team', id: string | number) => `${entityType}:${id}`

// Derive one circle per followed entity that has recent activity, newest first.
// Sources are already followed-scoped (personalized feed / followed matches /
// team events), so anything here is someone the user follows.
export function buildStoryEntities(
  playerResults: FeedPlayerResult[],
  followedMatches: BitsMatchFeed[],
  feedEvents: TeamEvent[],
  teamIds: string[],
): StoryEntity[] {
  const today = new Date().toISOString().slice(0, 10)
  const map = new Map<string, StoryEntity>()
  // latestTs tracks the newest PAST activity — the "news". Upcoming fixtures
  // still create a circle (so you can tap in), but a future date never lights
  // the ring, otherwise it'd read unseen forever.
  const add = (entityType: 'player' | 'team', id: string | number | null | undefined, name: string, ts: string) => {
    if (id == null || id === '' || !name || !ts) return
    const key = entityKey(entityType, id)
    const past = ts.slice(0, 10) <= today ? ts : ''
    const cur = map.get(key)
    if (!cur) map.set(key, { key, entityType, id: String(id), name, latestTs: past })
    else if (past && past > cur.latestTs) cur.latestTs = past
  }

  for (const p of playerResults) add('player', p.playerId, p.playerName, p.date)

  const followed = new Set(teamIds.map(String))
  for (const m of followedMatches) {
    if (followed.has(String(m.home_bits_team_id))) add('team', m.home_bits_team_id, m.home_team_name, m.match_date)
    if (followed.has(String(m.away_bits_team_id))) add('team', m.away_bits_team_id, m.away_team_name, m.match_date)
  }
  for (const e of feedEvents) {
    if (e.bits_team_id) add('team', e.bits_team_id, e.team?.name ?? '', e.event_date)
  }

  return [...map.values()].sort((a, b) => b.latestTs.localeCompare(a.latestTs))
}

// Per-viewer "seen" state — localStorage only (per device; no backend for v1).
// Keyed by entity, value = ISO timestamp of when the user last opened them.
const STORE_KEY = 'bk_story_views'

export function useStoryViews() {
  const [views, setViews] = useState<Record<string, string>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) setViews(JSON.parse(raw) as Record<string, string>)
    } catch { /* private mode / blocked storage → treat all as unseen */ }
  }, [])

  const markViewed = useCallback((key: string) => {
    setViews((prev) => {
      const next = { ...prev, [key]: new Date().toISOString() }
      try { localStorage.setItem(STORE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  // Unseen when the entity has past activity newer than the day you last opened
  // them (date-granular so same-day reads stay quiet). No past activity (only
  // upcoming) → never lit.
  const isUnseen = useCallback((key: string, latestTs: string) => {
    if (!latestTs) return false
    const seen = views[key]
    return !seen || latestTs.slice(0, 10) > seen.slice(0, 10)
  }, [views])

  return { isUnseen, markViewed }
}
