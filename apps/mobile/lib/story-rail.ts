import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

import type { FeedItem, FeedMatch } from '@/lib/feed';
import type { FollowItem, PlayerResult, TeamMatch } from '@/lib/feed-follows';
import type { TeamEvent } from '@/lib/story-events';

// Home story rail (native twin of web): one circle per followed player/team, its
// ring lit when they have activity newer than you've seen. Tapping filters the
// feed to that entity. Seen-state persists per device via SecureStore.

export type StoryEntity = {
  key: string;                    // `${entityType}:${id}`
  entityType: 'player' | 'team';
  id: string;
  name: string;
  latestTs: string;               // newest PAST activity ("news"); '' = only upcoming/none
};

export function buildStoryEntities(
  follows: { teams: FollowItem[]; players: FollowItem[] },
  playerResults: PlayerResult[],
  teamMatches: TeamMatch[],
  storyEvents: TeamEvent[],
): StoryEntity[] {
  const today = new Date().toISOString().slice(0, 10);
  const bump = (map: Map<string, string>, id: string, ts: string) => {
    if (!ts || ts.slice(0, 10) > today) return; // past activity only
    const cur = map.get(id);
    if (!cur || ts > cur) map.set(id, ts);
  };

  const playerTs = new Map<string, string>();
  for (const r of playerResults) bump(playerTs, r.playerId, r.date);

  const teamTs = new Map<string, string>();
  for (const m of teamMatches) if (m.isFinished) { bump(teamTs, String(m.homeTeamId), m.date); bump(teamTs, String(m.awayTeamId), m.date); }
  for (const e of storyEvents) if (e.bits_team_id) bump(teamTs, String(e.bits_team_id), e.event_date);

  const players: StoryEntity[] = follows.players.map((p) => ({ key: `player:${p.id}`, entityType: 'player', id: p.id, name: p.name, latestTs: playerTs.get(p.id) ?? '' }));
  const teams: StoryEntity[] = follows.teams.map((t) => ({ key: `team:${t.id}`, entityType: 'team', id: t.id, name: t.name, latestTs: teamTs.get(t.id) ?? '' }));
  return [...players, ...teams].sort((a, b) => b.latestTs.localeCompare(a.latestTs));
}

// The feed narrowed to one tapped entity, mapped into the existing card kinds.
export function entityFeed(
  entity: { entityType: 'player' | 'team'; id: string },
  playerResults: PlayerResult[],
  teamMatches: TeamMatch[],
  storyEvents: TeamEvent[],
): FeedItem[] {
  if (entity.entityType === 'player') {
    return playerResults
      .filter((r) => r.playerId === entity.id)
      .map((r) => ({
        kind: 'serie', key: `s${r.matchId}-${r.playerName}`, ts: r.date,
        score: { matchId: Number(r.matchId), playerName: r.playerName, total: r.total, series: r.games, division: r.division, opponent: r.opponent, date: r.date, publicId: r.playerId },
      }));
  }
  const idNum = Number(entity.id);
  const toMatch = (m: TeamMatch): FeedMatch => ({
    bits_match_id: m.bitsMatchId, match_date: m.date, home_team_name: m.homeName, away_team_name: m.awayName,
    home_result: m.homeResult ?? 0, away_result: m.awayResult ?? 0, division_name: m.division, is_finished: m.isFinished, hall_name: m.hall ?? '',
  });
  const matches: FeedItem[] = teamMatches
    .filter((m) => m.homeTeamId === idNum || m.awayTeamId === idNum)
    .map((m) => ({ kind: 'match', key: `m${m.bitsMatchId}`, ts: m.date, upcoming: !m.isFinished, match: toMatch(m) }));
  const events: FeedItem[] = storyEvents
    .filter((e) => e.bits_team_id === idNum)
    .map((e) => ({ kind: 'event', key: `e${e.id}`, ts: e.event_date, event: e }));

  const upcoming = matches.filter((m) => m.kind === 'match' && m.upcoming);
  const rest = [...matches.filter((m) => !(m.kind === 'match' && m.upcoming)), ...events].sort((a, b) => b.ts.localeCompare(a.ts));
  return [...upcoming, ...rest];
}

// Per-device seen state — SecureStore (no AsyncStorage per AGENTS #7). Small blob.
const STORE_KEY = 'bk_story_views';

export function useStoryViews() {
  const [views, setViews] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try { const raw = await SecureStore.getItemAsync(STORE_KEY); if (raw) setViews(JSON.parse(raw) as Record<string, string>); } catch { /* treat all unseen */ }
    })();
  }, []);

  const markViewed = useCallback((key: string) => {
    setViews((prev) => {
      const next = { ...prev, [key]: new Date().toISOString() };
      SecureStore.setItemAsync(STORE_KEY, JSON.stringify(next)).catch(() => { /* ignore */ });
      return next;
    });
  }, []);

  const isUnseen = useCallback((key: string, latestTs: string) => {
    if (!latestTs) return false;
    const seen = views[key];
    return !seen || latestTs.slice(0, 10) > seen.slice(0, 10);
  }, [views]);

  return { isUnseen, markViewed };
}
