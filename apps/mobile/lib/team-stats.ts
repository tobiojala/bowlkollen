import { useQuery } from '@tanstack/react-query';
import { computeTeamStats, type TeamStatMatch, type TeamStatResult, type TeamStats } from '@bowlkollen/core';

import { supabase } from '@/lib/supabase';

// Deep team stats from BITS via the shared core engine (same as web /statistik).
// Current season first; falls back to last season so it's never empty off-season.
const CURRENT_SEASON_FLOOR = '2026-07-01';
const LAST_SEASON_FLOOR = '2025-07-01';

const MATCH_COLS =
  'bits_match_id, match_date, home_bits_team_id, away_bits_team_id, home_team_name, away_team_name, home_result, away_result, is_finished';

async function fetchWindow(teamId: number, floor: string, ceilExclusive: string | null): Promise<TeamStats | null> {
  let q = supabase.from('bits_matches').select(MATCH_COLS)
    .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
    .gte('match_date', floor)
    .order('match_date', { ascending: true });
  if (ceilExclusive) q = q.lt('match_date', ceilExclusive);
  const { data: matches } = await q;
  const ms = (matches ?? []) as TeamStatMatch[];
  const finished = ms.filter((m) => m.is_finished);
  if (!finished.length) return null;

  const { data: results } = await supabase.from('bits_match_player_results')
    .select('bits_match_id, player_name, lic_nbr, series, is_home_team')
    .in('bits_match_id', finished.map((m) => m.bits_match_id));
  return computeTeamStats(teamId, ms, (results ?? []) as TeamStatResult[]);
}

export type TeamStatsData = { stats: TeamStats; season: 'current' | 'last' } | null;

export function useTeamStats(teamId: number) {
  return useQuery<TeamStatsData>({
    queryKey: ['team-stats', teamId],
    enabled: teamId > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const current = await fetchWindow(teamId, CURRENT_SEASON_FLOOR, null);
      if (current) return { stats: current, season: 'current' };
      const last = await fetchWindow(teamId, LAST_SEASON_FLOOR, CURRENT_SEASON_FLOOR);
      if (last) return { stats: last, season: 'last' };
      return null;
    },
  });
}
