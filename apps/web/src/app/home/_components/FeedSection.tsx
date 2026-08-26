'use client'

import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { FeedCard } from './FeedCard'
import { PlayerResultCard } from './PlayerResultCard'
import { FeedMatchCard } from './FeedMatchCard'
import { TopScoreCard } from './TopScoreCard'
import { useFeedReactions, useReactionActions } from '@/lib/feed-reactions'
import { divisionTier, TIER_RANK } from '@/lib/division-standings'
import { recencyScore, eventBoost, serieBoost } from '@bowlkollen/core'
import type { FeedFilterType } from './HomeTabRow'
import type { TeamEvent, FeedPlayerResult, BitsMatchFeed, BitsTopScore } from '@/lib/types'

// ── Merged feed types ─────────────────────────────────────────────────────────

type FeedEntry =
  | { kind: 'event';      data: TeamEvent;        date: string }
  | { kind: 'player';     data: FeedPlayerResult; date: string }
  | { kind: 'bits_match'; data: BitsMatchFeed;    date: string }
  | { kind: 'bits_score'; data: BitsTopScore;     date: string }

// ── Algorithmic ranking ───────────────────────────────────────────────────────
// Score = recency base (shared @bowlkollen/core) + affinity boosts.
// Higher = surfaces earlier in the feed. The recency curve, the per-type event
// boost, and the standout-serie boost are shared verbatim with native via core;
// tier + followed weighting stay here (web mixes cold-start with followed data).

function tierBoost(division: string | null | undefined): number {
  return (TIER_RANK[divisionTier(division ?? '')] ?? 0) * 3
}

function scoreEntry(entry: FeedEntry, teamIds: string[], playerIds: string[]): number {
  const recency = recencyScore(entry.date)
  let boost = 0

  if (entry.kind === 'event') {
    boost += 80 // story events come only from followed teams
    boost += eventBoost(entry.data.event_type)
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
    boost += serieBoost(p.total)
  }

  if (entry.kind === 'bits_score') {
    boost += tierBoost(entry.data.division)
    boost += serieBoost(entry.data.total)
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
  const feed = buildFeed(filter, feedEvents, playerResults, followedMatches, bitsRecent, topScores, teamIds, playerIds)
  const postKeys = feed.flatMap(e =>
    e.kind === 'bits_match' ? [`m${(e.data as BitsMatchFeed).bits_match_id}`]
    : e.kind === 'bits_score' ? [`s${(e.data as BitsTopScore).matchId}-${(e.data as BitsTopScore).playerName}`]
    : e.kind === 'player' ? [`p${(e.data as FeedPlayerResult).playerId}-${(e.data as FeedPlayerResult).matchId}`]
    : [])
  const { data: reactions } = useFeedReactions(postKeys)
  const { toggleLike, toggleSave } = useReactionActions()

  if (isLoading) return <FeedSkeleton />
  if (feed.length === 0) return null

  return (
    <div>
      {feed.map((entry, i) => {
        if (entry.kind === 'event')
          return <FeedCard key={entry.data.id} event={entry.data} myTeamId={myTeamId} />
        if (entry.kind === 'player') {
          const pr = entry.data
          const r = reactions?.get(`p${pr.playerId}-${pr.matchId}`) ?? { likes: 0, liked: false, saved: false }
          return <PlayerResultCard key={`pr-${pr.playerId}-${pr.matchId}`} item={pr} reaction={r} onLike={toggleLike} onSave={toggleSave} />
        }
        if (entry.kind === 'bits_match') {
          const m = entry.data
          const r = reactions?.get(`m${m.bits_match_id}`) ?? { likes: 0, liked: false, saved: false }
          return <FeedMatchCard key={m.bits_match_id} reaction={r} onLike={toggleLike} onSave={toggleSave}
            match={{ bitsMatchId: m.bits_match_id, date: m.match_date, homeTeam: m.home_team_name, awayTeam: m.away_team_name,
              homeResult: m.home_result, awayResult: m.away_result, division: m.division_name, hall: m.hall_name, finished: m.is_finished }} />
        }
        if (entry.kind === 'bits_score') {
          const s = entry.data
          const r = reactions?.get(`s${s.matchId}-${s.playerName}`) ?? { likes: 0, liked: false, saved: false }
          return <TopScoreCard key={`bs-${s.matchId}-${s.playerName}`} item={s} reaction={r} onLike={toggleLike} onSave={toggleSave} />
        }
      })}
    </div>
  )
}
