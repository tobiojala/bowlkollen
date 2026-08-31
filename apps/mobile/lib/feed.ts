import { recencyScore, eventBoost, serieBoost, diversifyByKind } from '@bowlkollen/core';

import type { FeedStanding } from '@/lib/feed-standings';
import type { Promo } from '@/lib/promos';
import type { TeamEvent } from '@/lib/story-events';
import type { TopScore } from '@/lib/top-scores';

// One match from get_user_season_matches (followed scope).
export type FeedMatch = {
  bits_match_id: number;
  match_date: string;
  home_team_name: string;
  away_team_name: string;
  home_result: number;
  away_result: number;
  home_score: number | null;
  away_score: number | null;
  division_name: string;
  is_finished: boolean;
  hall_name: string;
};

// A card in the home stream. New content types (promos, competitions, centers)
// become new kinds here — the feed + renderer are built to grow.
export type FeedItem =
  | { kind: 'match'; key: string; ts: string; upcoming: boolean; match: FeedMatch }
  | { kind: 'serie'; key: string; ts: string; score: TopScore }
  | { kind: 'event'; key: string; ts: string; event: TeamEvent }
  | { kind: 'promo'; key: string; ts: string; promo: Promo }
  | { kind: 'standings'; key: string; ts: string; standing: FeedStanding };

export type FeedCategory = 'Allt' | 'Matcher' | 'Serier';

// Feed ranking — recency base + affinity boosts, all shared verbatim with web
// via @bowlkollen/core (recencyScore / eventBoost / serieBoost). The native
// stream is already followed-scoped, so there's no separate "followed" boost —
// everything here is already someone the user follows.
function rankScore(item: FeedItem): number {
  let score = recencyScore(item.ts);
  if (item.kind === 'event') score += 80 + eventBoost(item.event.event_type);
  if (item.kind === 'match' && item.match.is_finished) score += 8;
  if (item.kind === 'serie') score += serieBoost(item.score.total);
  return score;
}

// An organic, mixed stream (not rigid sections): upcoming matches lead (soonest
// first), then results + top series + story events interleave by rank so the feed
// surfaces the meaningful moments (a personal best, a segersvit) not just the
// most recent fixture.
export function buildFeed(matches: FeedMatch[], topScores: TopScore[], events: TeamEvent[] = []): FeedItem[] {
  const upcoming: FeedItem[] = matches
    .filter((m) => !m.is_finished)
    .sort((a, b) => a.match_date.localeCompare(b.match_date))
    .map((m) => ({ kind: 'match', key: `m${m.bits_match_id}`, ts: m.match_date, upcoming: true, match: m }));

  const results: FeedItem[] = matches
    .filter((m) => m.is_finished)
    .map((m) => ({ kind: 'match', key: `m${m.bits_match_id}`, ts: m.match_date, upcoming: false, match: m }));

  const series: FeedItem[] = topScores.map((s) => ({
    kind: 'serie',
    key: `s${s.matchId}-${s.playerName}`,
    ts: s.date,
    score: s,
  }));

  const story: FeedItem[] = events.map((e) => ({ kind: 'event', key: `e${e.id}`, ts: e.event_date, event: e }));

  // Rank the non-upcoming items, then interleave kinds so the stream reads mixed
  // instead of clustering all story events at the top (shared mixer with web).
  const rest = diversifyByKind([...results, ...series, ...story].sort((a, b) => rankScore(b) - rankScore(a)));
  return [...upcoming, ...rest];
}

export function filterFeed(items: FeedItem[], category: FeedCategory): FeedItem[] {
  if (category === 'Matcher') return items.filter((i) => i.kind === 'match');
  if (category === 'Serier') return items.filter((i) => i.kind === 'serie');
  return items;
}

// Standings snapshots sit near the top (at-a-glance content), spaced out.
export function injectStandings(items: FeedItem[], standings: FeedStanding[]): FeedItem[] {
  if (standings.length === 0) return items;
  const out = [...items];
  standings.forEach((s, i) => {
    const pos = Math.min(out.length, 2 + i * 4);
    out.splice(pos, 0, { kind: 'standings', key: `std-${s.divisionId}`, ts: '', standing: s });
  });
  return out;
}

// Drop sponsored posts into the stream at intervals — like Instagram, never at
// the very top, spaced out so they read as part of the feed, not a banner.
export function injectPromos(items: FeedItem[], promos: Promo[], every = 5): FeedItem[] {
  if (promos.length === 0 || items.length < 3) return items;
  const out: FeedItem[] = [];
  let p = 0;
  items.forEach((item, i) => {
    out.push(item);
    if (i > 0 && (i + 1) % every === 0 && p < promos.length) {
      out.push({ kind: 'promo', key: `promo-${promos[p].id}`, ts: item.ts, promo: promos[p] });
      p += 1;
    }
  });
  return out;
}
