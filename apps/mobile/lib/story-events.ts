import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

// The Auto-Story Engine (Remember pillar) generates team_events server-side on
// the web brain (see apps/web/src/lib/sync-bits-team-events.ts), keyed by
// bits_team_id. Native just READS + renders them into the home feed. Types mirror
// apps/web/src/lib/types.ts — keep them in sync when the engine gains event types.

export type TeamEventType =
  | 'match_result'
  | 'win_streak'
  | 'unbeaten_run'
  | 'personal_best'
  | 'player_milestone'
  | 'form_rising'
  | 'division_climbed'
  | 'match_preview'
  | 'lineup_announced'
  | 'comeback_win'
  | 'revenge_win'
  | 'giant_killer'
  | 'rivalry_match'
  | 'promotion_clinched'
  | 'captain_post';

export type MatchResultPayload = {
  opponent_name: string;
  my_score: number;
  opp_score: number;
  is_home: boolean;
  division: string;
  result: 'W' | 'D' | 'L';
  top_scorer: { name: string; high_game: number } | null;
};

export type PersonalBestPayload = { player_id: string; player_name: string; new_best: number; previous_best: number };
export type FormRisingPayload = { player_id: string; player_name: string; delta: number; recent_avg: number; season_avg: number };
export type PlayerMilestonePayload = { player_id: string; player_name: string; milestone: number; total_matches: number };
export type StreakPayload = { streak_length: number; previous_best: number; is_season_best: boolean };

export type TeamEvent = {
  id: string;
  bits_team_id: number | null;
  team_name?: string;
  event_type: TeamEventType;
  event_date: string;
  title: string;
  body: string | null;
  payload: Record<string, unknown>;
  match_id: string | null;
  is_hidden: boolean;
};

// Where a story card navigates (mirrors web FeedCard.linkFor): match events open
// the match, per-player events open the player, everything else the team.
const MATCH_LINKED: TeamEventType[] = ['match_result', 'match_preview', 'revenge_win', 'giant_killer', 'comeback_win'];

export function storyEventHref(e: TeamEvent): string {
  if (e.match_id && MATCH_LINKED.includes(e.event_type)) return `/matcher/${e.match_id}`;
  if (e.event_type === 'personal_best' || e.event_type === 'form_rising' || e.event_type === 'player_milestone') {
    const playerId = (e.payload as { player_id?: string }).player_id;
    if (playerId) return `/player/${playerId}`;
  }
  return e.bits_team_id ? `/lag/${e.bits_team_id}` : '/';
}

// Story events for the teams the current user follows. Mirrors web's useHomeFeed:
// read team_events by bits_team_id, then attach the team name from bits_teams.
export function useHomeStoryEvents() {
  return useQuery<TeamEvent[]>({
    queryKey: ['story-events', 'home'],
    staleTime: 30_000,
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return [];

      // Followed teams — entity_id is String(bits_team_id) (the bits-id bridge).
      const { data: follows } = await supabase
        .from('follows')
        .select('entity_id')
        .eq('user_id', session.user.id)
        .eq('entity_type', 'team');
      const teamIds = ((follows ?? []) as { entity_id: string }[])
        .map((f) => Number(f.entity_id))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (!teamIds.length) return [];

      const { data, error } = await supabase
        .from('team_events')
        .select('id, bits_team_id, event_type, event_date, title, body, payload, match_id, is_hidden')
        .in('bits_team_id', teamIds)
        .eq('is_hidden', false)
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(40);
      if (error) throw error;
      const events = (data ?? []) as unknown as TeamEvent[];

      // Attach team names (bits events have no legacy team join).
      const ids = [...new Set(events.map((e) => e.bits_team_id).filter((n): n is number => !!n))];
      if (ids.length) {
        const { data: teams } = await supabase.from('bits_teams').select('bits_team_id, name').in('bits_team_id', ids);
        const nameById = new Map(((teams ?? []) as { bits_team_id: number; name: string }[]).map((t) => [t.bits_team_id, t.name]));
        for (const e of events) if (e.bits_team_id) e.team_name = nameById.get(e.bits_team_id) ?? 'Lag';
      }
      return events;
    },
  });
}
