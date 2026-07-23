import type { TopScore } from '@/lib/top-scores';

// One match from get_user_season_matches (followed scope).
export type FeedMatch = {
  bits_match_id: number;
  match_date: string;
  home_team_name: string;
  away_team_name: string;
  home_result: number;
  away_result: number;
  division_name: string;
  is_finished: boolean;
  hall_name: string;
};

// A card in the home stream. New content types (promos, competitions, centers)
// become new kinds here — the feed + renderer are built to grow.
export type FeedItem =
  | { kind: 'match'; key: string; ts: string; upcoming: boolean; match: FeedMatch }
  | { kind: 'serie'; key: string; ts: string; score: TopScore };

export type FeedCategory = 'Allt' | 'Matcher' | 'Serier';

// An organic, mixed stream (not rigid sections): upcoming matches lead (soonest
// first), then results + top series interleave by recency so it reads like a feed.
export function buildFeed(matches: FeedMatch[], topScores: TopScore[]): FeedItem[] {
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

  const rest = [...results, ...series].sort((a, b) => b.ts.localeCompare(a.ts));
  return [...upcoming, ...rest];
}

export function filterFeed(items: FeedItem[], category: FeedCategory): FeedItem[] {
  if (category === 'Matcher') return items.filter((i) => i.kind === 'match');
  if (category === 'Serier') return items.filter((i) => i.kind === 'serie');
  return items;
}
