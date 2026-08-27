import { useQuery } from '@tanstack/react-query';
import { computeStandings, type MatchRow } from '@bowlkollen/core';

import { supabase } from '@/lib/supabase';

// Season context for a match: each team's current standing in its division, and
// the two teams' head-to-head record. Mirrors web's use-match-context. Free —
// the context that gives a match meaning within the season.

export type MatchContext = {
  homeRank: number | null;
  awayRank: number | null;
  totalTeams: number;
  h2h: { homeWins: number; awayWins: number; meetings: number } | null;
};

const STANDING_COLS =
  'bits_match_id, home_bits_team_id, away_bits_team_id, home_team_name, away_team_name, home_result, away_result, is_finished, match_date, round_id, hall_name';

export function useMatchContext(divisionId: number | null, seasonId: number, homeTeamId: number | null, awayTeamId: number | null) {
  return useQuery<MatchContext>({
    queryKey: ['match-context', divisionId, seasonId, homeTeamId, awayTeamId],
    enabled: !!homeTeamId && !!awayTeamId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      let homeRank: number | null = null, awayRank: number | null = null, totalTeams = 0;

      if (divisionId) {
        const { data } = await supabase.from('bits_matches').select(STANDING_COLS).eq('bits_division_id', divisionId).eq('season_id', seasonId);
        const standings = computeStandings((data ?? []) as unknown as MatchRow[]);
        totalTeams = standings.length;
        const hi = standings.findIndex((s) => s.teamId === homeTeamId); if (hi >= 0) homeRank = hi + 1;
        const ai = standings.findIndex((s) => s.teamId === awayTeamId); if (ai >= 0) awayRank = ai + 1;
      }

      const { data: rows } = await supabase.from('bits_matches')
        .select('home_bits_team_id, away_bits_team_id, home_result, away_result, is_finished')
        .in('home_bits_team_id', [homeTeamId!, awayTeamId!]).in('away_bits_team_id', [homeTeamId!, awayTeamId!]).eq('is_finished', true);

      let homeWins = 0, awayWins = 0, meetings = 0;
      for (const r of (rows ?? []) as { home_bits_team_id: number; away_bits_team_id: number; home_result: number | null; away_result: number | null }[]) {
        if (r.home_result == null || r.away_result == null) continue;
        meetings++;
        if (r.home_result === r.away_result) continue;
        const winner = r.home_result > r.away_result ? r.home_bits_team_id : r.away_bits_team_id;
        if (winner === homeTeamId) homeWins++; else if (winner === awayTeamId) awayWins++;
      }
      return { homeRank, awayRank, totalTeams, h2h: meetings ? { homeWins, awayWins, meetings } : null };
    },
  });
}

export type Outcome = 'V' | 'F' | 'O';
export type TeamForm = { results: Outcome[]; avgFor: number; avgAgainst: number; played: number };

// Both teams' recent form (last finished matches) for the upcoming-match panel.
// Mirrors web's useUpcoming.
export function useUpcoming(homeId: number | null, awayId: number | null) {
  return useQuery<{ home: TeamForm; away: TeamForm }>({
    queryKey: ['match-upcoming', homeId, awayId],
    enabled: !!homeId && !!awayId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const form = async (teamId: number): Promise<TeamForm> => {
        const { data } = await supabase.from('bits_matches')
          .select('home_bits_team_id, away_bits_team_id, home_result, away_result, match_date')
          .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
          .eq('is_finished', true).order('match_date', { ascending: false }).limit(8);
        const rows = ((data ?? []) as { home_bits_team_id: number; away_bits_team_id: number; home_result: number | null; away_result: number | null }[])
          .filter((r) => r.home_result != null && r.away_result != null);
        const results: Outcome[] = []; let f = 0, a = 0;
        for (const r of rows) {
          const isHome = r.home_bits_team_id === teamId;
          const my = (isHome ? r.home_result : r.away_result) as number;
          const opp = (isHome ? r.away_result : r.home_result) as number;
          f += my; a += opp;
          results.push(my > opp ? 'V' : my < opp ? 'F' : 'O');
        }
        const n = rows.length;
        return { results: results.slice(0, 5), avgFor: n ? Math.round(f / n) : 0, avgAgainst: n ? Math.round(a / n) : 0, played: n };
      };
      const [home, away] = await Promise.all([form(homeId!), form(awayId!)]);
      return { home, away };
    },
  });
}

// Per-player season serie-average (public_id → avg_serie), for the Pro snitt
// deltas on the match's spelresultat. Same RPC as web.
export function useMatchAvgs(publicIds: string[], seasonId: number) {
  const ids = [...publicIds].sort();
  return useQuery<Record<string, number>>({
    queryKey: ['match-avgs', seasonId, ids.join(',')],
    enabled: ids.length > 0 && seasonId > 0,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.rpc('get_players_season_avg', { p_public_ids: ids, p_season_id: seasonId });
      const map: Record<string, number> = {};
      for (const a of (data ?? []) as { public_id: string; avg_serie: number }[]) map[a.public_id] = a.avg_serie;
      return map;
    },
  });
}
