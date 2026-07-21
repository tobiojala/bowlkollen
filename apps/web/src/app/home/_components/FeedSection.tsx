'use client'

import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { FeedCard } from './FeedCard'
import { PlayerResultCard } from './PlayerResultCard'
import BitsMatchRow from './BitsMatchRow'
import { BitsScoreCard } from './BitsScoreCard'
import { divisionTier, TIER_RANK } from '@/lib/division-standings'
import type { FeedFilterType } from './HomeTabRow'
import type { TeamEvent, FeedPlayerResult, BitsMatchFeed, BitsTopScore } from '@/lib/types'

// ── Merged feed types ─────────────────────────────────────────────────────────

type FeedEntry =
  | { kind: 'event';      data: TeamEvent;        date: string }
  | { kind: 'player';     data: FeedPlayerResult; date: string }
  | { kind: 'bits_match'; data: BitsMatchFeed;    date: string }
  | { kind: 'bits_score'; data: BitsTopScore;     date: string }

// ── Algorithmic ranking ───────────────────────────────────────────────────────
// Score = recency base (100 → 0 over 14 days) + affinity boosts
// Higher = surfaces earlier in the feed.

const EVENT_BOOST: Partial<Record<string, number>> = {
  promotion_clinched: 50,
  personal_best:      35,
  win_streak:         25,
  unbeaten_run:       20,
  comeback_win:       20,
  revenge_win:        20,
  giant_killer:       20,
  rivalry_match:      15,
  division_climbed:   15,
  player_milestone:   12,
  form_rising:        10,
  match_result:        5,
  match_preview:       5,
  lineup_announced:    3,
  captain_post:        2,
}

function tierBoost(division: string | null | undefined): number {
  return (TIER_RANK[divisionTier(division ?? '')] ?? 0) * 3
}

function scoreEntry(entry: FeedEntry, teamIds: string[], playerIds: string[]): number {
  // Clamp future dates to 0 so upcoming matches score the same as today
  const daysAgo = Math.max(0, (Date.now() - new Date(entry.date).getTime()) / 86_400_000)
  const recency = Math.max(0, 100 - daysAgo * 7)
  let boost = 0

  if (entry.kind === 'event') {
    boost += 80 // story events come only from followed teams
    boost += EVENT_BOOST[entry.data.event_type] ?? 5
    const div = (entry.data.payload as Record<string, unknown>).division
    boost += tierBoost(typeof div === 'string' ? div : null)
  }

  if (entry.kind === 'bits_match') {
    const m = entry.data
    const followed =
      teamIds.includes(String(m.home_bits_team_id)) ||
      teamIds.includes(String(m.away_bits_team_id))
    if (followed) boost += 80
    boost += tierBoost(m.division_name)
    if (m.is_finished) boost += 8 // completed result > upcoming fixture
  }

  if (entry.kind === 'player') {
    const p = entry.data
    if (playerIds.includes(p.playerId)) boost += 80
    boost += tierBoost(p.division)
    if (p.total >= 300)      boost += 40
    else if (p.total >= 270) boost += 20
    else if (p.total >= 250) boost += 10
  }

  if (entry.kind === 'bits_score') {
    const s = entry.data
    boost += tierBoost(s.division)
    if (s.total >= 300)      boost += 40
    else if (s.total >= 270) boost += 20
    else if (s.total >= 250) boost += 10
  }

  return recency + boost
}

// ── Feed builder ──────────────────────────────────────────────────────────────

function buildFeed(
  filter: FeedFilterType,
  feedEvents: TeamEvent[],
  playerResults: FeedPlayerResult[],
  followedMatches: BitsMatchFeed[],
  bitsRecent: BitsMatchFeed[],
  topScores: BitsTopScore[],
  teamIds: string[],
  playerIds: string[],
): FeedEntry[] {
  // Lag tab = strictly personal. Allt tab gets bitsRecent as cold-start fallback;
  // Lag tab does not — empty → OnboardingCard shows instead of duplicating Matcher.
  const lagSource = followedMatches.length > 0 ? followedMatches
    : filter === 'allt' ? bitsRecent
    : []

  const lagEntries: FeedEntry[] =
    feedEvents.length > 0
      ? feedEvents.map(e => ({ kind: 'event',      data: e, date: e.event_date }))
      : lagSource.map(m => ({ kind: 'bits_match', data: m, date: m.match_date }))

  // Spelare tab = strictly personal. topScores is cold-start fallback for Allt only.
  const spelareEntries: FeedEntry[] =
    playerResults.length > 0
      ? playerResults.map(p => ({ kind: 'player',    data: p, date: p.date }))
      : filter === 'allt'
        ? topScores.map(s => ({ kind: 'bits_score', data: s, date: s.date }))
        : []

  const entries: FeedEntry[] = [
    ...(filter === 'allt' || filter === 'lag'     ? lagEntries     : []),
    ...(filter === 'allt' || filter === 'spelare' ? spelareEntries : []),
  ]

  // Pre-compute each score once, then sort descending
  return entries
    .map(e => ({ e, score: scoreEntry(e, teamIds, playerIds) }))
    .sort((a, b) => b.score - a.score)
    .map(({ e }) => e)
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: `8px ${SPACE[4]}px 0` }}>
      {[88, 100, 88].map((h, i) => (
        <div key={i} className="skeleton" style={{
          height: h, borderRadius: RADIUS.lg,
          background: COLOR.surface, border: `1px solid ${COLOR.hairline}`,
        }} />
      ))}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function FeedSection({
  filter, feedEvents, playerResults, followedMatches, bitsRecent, topScores,
  myTeamId, isLoading, teamIds, playerIds,
}: {
  filter: FeedFilterType
  feedEvents: TeamEvent[]
  playerResults: FeedPlayerResult[]
  followedMatches: BitsMatchFeed[]
  bitsRecent: BitsMatchFeed[]
  topScores: BitsTopScore[]
  myTeamId: string | null
  isLoading: boolean
  teamIds: string[]
  playerIds: string[]
}) {
  if (isLoading) return <FeedSkeleton />

  const feed = buildFeed(filter, feedEvents, playerResults, followedMatches, bitsRecent, topScores, teamIds, playerIds)

  if (feed.length === 0) return null

  return (
    <div>
      {feed.map((entry, i) => {
        if (entry.kind === 'event')
          return <FeedCard key={entry.data.id} event={entry.data} myTeamId={myTeamId} />
        if (entry.kind === 'player')
          return <PlayerResultCard key={`pr-${entry.data.playerId}-${entry.data.matchId}`} item={entry.data} />
        if (entry.kind === 'bits_match')
          return <BitsMatchRow key={entry.data.bits_match_id} m={entry.data} index={i} teamIds={teamIds} />
        if (entry.kind === 'bits_score')
          return <BitsScoreCard key={`bs-${entry.data.matchId}-${entry.data.playerName}`} item={entry.data} />
      })}
    </div>
  )
}
