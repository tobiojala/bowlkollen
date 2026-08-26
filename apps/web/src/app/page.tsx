'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  useFollows, useHomeMatches, usePersonalizedFeed, useHomeFeed,
  useMyTeamId, useBitsMatchFeed, useBitsTopScores,
} from '@/lib/queries'
import StoryRail from './home/_components/StoryRail'
import { buildStoryEntities, useStoryViews, entityKey, type FeedFilter } from '@/lib/story-rail'
import { LiveTopWidget } from './home/_components/LiveTopWidget'
import { RivalCallout } from './home/_components/RivalCallout'
import { LiveAlertBanner } from './home/_components/LiveAlertBanner'
import { MatcherTab } from './home/_components/MatcherTab'
import { FeedSection } from './home/_components/FeedSection'
import { OnboardingCard } from './home/_components/OnboardingCard'
import NextMatchCard from './profile/_components/NextMatchCard'
import { useMyFirstName, useNextMatch } from '@/lib/diary'
import { useFeedStandings } from '@/lib/feed-standings'
import { greetingFor, homeNote } from '@bowlkollen/core'
import { COLOR, RADIUS, SPACE, TYPE } from '@/lib/brand'
import { divisionTier, TIER_RANK } from '@/lib/division-standings'
import { getLiveCompetitions } from '@/lib/competitions'
import type { Match, FeedPlayerResult, BitsMatchFeed } from '@/lib/types'

export default function Home() {
  const [filter, setFilter] = useState<FeedFilter>({ kind: 'view', view: 'allt' })
  const { isUnseen, markViewed } = useStoryViews()

  // Tapping a story circle filters the feed to that entity and marks it seen.
  const selectFilter = (f: FeedFilter) => {
    setFilter(f)
    if (f.kind === 'entity') markViewed(entityKey(f.entityType, f.id))
  }

  const { data: follows = [] }   = useFollows()
  const { data: matchData }      = useHomeMatches()
  const { data: myTeamId }       = useMyTeamId()
  const { data: bitsData, isLoading: bitsLoading } = useBitsMatchFeed()

  const playerIds = follows.filter(f => f.entity_type === 'player').map(f => f.entity_id)
  const teamIds   = follows.filter(f => f.entity_type === 'team').map(f => f.entity_id)

  const { data: feedItems = [], isLoading: feedLoading }   = usePersonalizedFeed(playerIds, teamIds)
  const { data: feedEvents = [], isLoading: eventsLoading } = useHomeFeed(teamIds)
  const { data: topScores = [] } = useBitsTopScores()
  const { data: feedStandings = [] } = useFeedStandings()

  const playerResults = feedItems.filter((f): f is FeedPlayerResult => f.kind === 'player_result')

  const allRecent = (matchData?.recentLive ?? []) as unknown as Match[]
  const live      = allRecent.filter(m => m.status === 'live')

  const tierRank = (div: string | null) => TIER_RANK[divisionTier(div ?? '')] ?? 0

  // All divisions sorted by tier — used for followedMatches so Div 4/5 followers still see their teams
  const bitsRecentAll   = [...(bitsData?.recent   ?? [])].sort((a, b) => tierRank(b.division_name) - tierRank(a.division_name))
  const bitsUpcomingAll = [...(bitsData?.upcoming ?? [])].sort((a, b) => tierRank(b.division_name) - tierRank(a.division_name))

  const isFollowedMatch = (m: BitsMatchFeed) =>
    teamIds.includes(String(m.home_bits_team_id)) || teamIds.includes(String(m.away_bits_team_id))
  const followedMatches = teamIds.length > 0
    ? [...bitsRecentAll.filter(isFollowedMatch), ...bitsUpcomingAll.filter(isFollowedMatch)]
    : []

  // Cold-start feed: cap at Div 3, same scope as Atlas (Elitserien → Div 3)
  const FEED_TIERS = new Set(['Elitserien', 'Allsvenskan', 'Mellanallsvenskan', 'Division 1', 'Division 2', 'Division 3'])
  const isHighTier = (m: BitsMatchFeed) => FEED_TIERS.has(divisionTier(m.division_name ?? ''))
  const bitsRecent   = bitsRecentAll.filter(isHighTier)
  const bitsUpcoming = bitsUpcomingAll.filter(isHighTier)

  const liveCompetitions = getLiveCompetitions()
  const hasNoFollows     = follows.length === 0
  const isView = (v: string) => filter.kind === 'view' && filter.view === v
  const showFeed         = isView('allt') || filter.kind === 'entity'
  const entityFilter     = filter.kind === 'entity' ? { entityType: filter.entityType, id: filter.id } : null
  const storyEntities    = buildStoryEntities(playerResults, followedMatches, feedEvents, teamIds)
  const feedIsLoading    = eventsLoading || feedLoading
  const effectiveMyTeamId = feedEvents.length > 0 ? (myTeamId ?? null) : null

  // Native greeting: date kicker, personalized greeting, and a match-aware note.
  const { data: firstName } = useMyFirstName()
  const { data: nextMatch } = useNextMatch()
  const greetingText = greetingFor(new Date().getHours(), firstName ?? null)
  const dateStr = new Date().toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'long' })
  const daysToMatch = nextMatch
    ? Math.round((new Date(nextMatch.date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000)
    : null
  const note = homeNote({
    daysToMatch,
    opponent: nextMatch?.opponentName ?? null,
    matchId: nextMatch?.matchId ?? null,
    daySeed: Math.floor(Date.now() / 86_400_000),
  })

  return (
    <main style={{ minHeight: '100vh', background: COLOR.bg, color: COLOR.ink, paddingBottom: 100 }}>
      <style>{`
        .home-wrap { max-width: 600px; margin: 0 auto; }
        .home-grid { display: block; }
        .home-side { display: none; }
        .home-greet { align-items: center; text-align: center; }
        @media (min-width: 1024px) {
          .home-wrap { max-width: 1160px; padding: 0 32px; }
          .home-greet { align-items: flex-start; text-align: left; }
          .home-grid { display: grid; grid-template-columns: minmax(0,1fr) 320px; gap: 40px; align-items: start; }
          .home-side { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 88px; }
        }
      `}</style>
      <div className="home-wrap">

        {/* Greeting — native language: date kicker, personalized greeting, and a
            match-aware note (tappable → prep when a fixture is close). */}
        <div className="home-greet" style={{ display: 'flex', flexDirection: 'column', padding: '16px 24px 4px' }}>
          <div style={{ fontSize: TYPE.label, fontWeight: 700, color: COLOR.ink3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: SPACE[1] }}>
            {dateStr}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: COLOR.ink, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {greetingText}
          </div>
          {note.matchId != null ? (
            <Link href={`/prep/${note.matchId}`} style={{ fontSize: TYPE.body, color: COLOR.ink, marginTop: SPACE[2], lineHeight: 1.4, textDecoration: 'none' }}>
              {note.text}
            </Link>
          ) : (
            <div style={{ fontSize: TYPE.body, color: COLOR.ink3, marginTop: SPACE[2], lineHeight: 1.4 }}>
              {note.text}
            </div>
          )}
        </div>

        <div className="home-grid">
        <div className="home-main">

        {/* Story rail — view chips + a lit/quiet circle per followed player/team */}
        <StoryRail filter={filter} entities={storyEntities} isUnseen={isUnseen} onSelect={selectFilter} />

        {/* Live ticker — sits tight under the filter row */}
        <LiveAlertBanner matches={live} competitions={liveCompetitions} />

        {/* Pre-match rivalry — your next fixture's biggest history (claimed players only) */}
        <RivalCallout />

        {/* Matcher tab */}
        {isView('matcher') && (
          <MatcherTab
            live={live}
            bitsRecent={bitsRecent}
            bitsUpcoming={bitsUpcoming}
            isLoading={bitsLoading}
          />
        )}

        {/* Prediktion tab */}
        {isView('prediktion') && (
          <div style={{ padding: `${SPACE[6]}px ${SPACE[4]}px` }}>
            <div style={{
              background: COLOR.surface, border: `1px solid ${COLOR.hairline}`,
              borderRadius: RADIUS.lg, padding: SPACE[6], textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: COLOR.gold, marginBottom: SPACE[3] }}>
                TIPSLIGAN
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: COLOR.ink, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                Tippa matchresultat
              </div>
              <div style={{ fontSize: 13, color: COLOR.ink3, marginTop: SPACE[2], lineHeight: 1.5 }}>
                Tävla om vem som har bäst känsla för bowlingen.
              </div>
              <Link href="/prediktion" style={{
                display: 'block', marginTop: SPACE[4], padding: '12px 0',
                background: COLOR.gold, color: COLOR.bg, borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}>
                Till tipsidan →
              </Link>
            </div>
          </div>
        )}

        {/* Feed — full stream (Allt) or narrowed to a tapped story circle */}
        {showFeed && (
          <FeedSection
            entity={entityFilter}
            feedEvents={feedEvents}
            playerResults={playerResults}
            followedMatches={followedMatches}
            bitsRecent={bitsRecent}
            topScores={topScores}
            feedStandings={feedStandings}
            myTeamId={effectiveMyTeamId}
            isLoading={feedIsLoading}
            teamIds={teamIds}
            playerIds={playerIds}
          />
        )}

        {/* Onboarding — shown when not following anyone */}
        {showFeed && !feedIsLoading && hasNoFollows && <OnboardingCard />}

        {/* Discovery nudge when following — smaller */}
        {showFeed && !feedIsLoading && !hasNoFollows && (
          <div style={{ padding: `${SPACE[8]}px ${SPACE[4]}px ${SPACE[4]}px`, textAlign: 'center' }}>
            <Link href="/discover" style={{ fontSize: TYPE.caption, fontWeight: 600, color: COLOR.ink3, textDecoration: 'none' }}>
              Följ fler lag och spelare →
            </Link>
          </div>
        )}

        </div>{/* home-main */}

        {/* Desktop sidebar — your next match + the league pulse (live / top series) */}
        <aside className="home-side">
          <NextMatchCard />
          <LiveTopWidget live={live} topScores={topScores} />
        </aside>
        </div>{/* home-grid */}

      </div>
    </main>
  )
}
