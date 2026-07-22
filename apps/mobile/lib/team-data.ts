import { computeStandings } from '@bowlkollen/core';
import { useQuery } from '@tanstack/react-query';

import type { MatchRowData } from '@/components/MatchRow';
import { supabase } from '@/lib/supabase';

const CURRENT_SEASON = 2026;

export function useTeam(teamId: number) {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from('bits_teams')
        .select('name, club_name')
        .eq('bits_team_id', teamId)
        .maybeSingle();
      return data;
    },
  });
}

export type TeamMatch = MatchRowData & {
  home_bits_team_id: number;
  away_bits_team_id: number;
  bits_division_id: number | null;
};

export function useTeamMatches(teamId: number) {
  return useQuery({
    queryKey: ['team-matches', teamId],
    queryFn: async (): Promise<TeamMatch[]> => {
      const { data, error } = await supabase
        .from('bits_matches')
        .select(
          'bits_match_id, home_team_name, away_team_name, home_result, away_result, division_name, is_finished, match_date, hall_name, home_bits_team_id, away_bits_team_id, bits_division_id',
        )
        .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
        .eq('season_id', CURRENT_SEASON);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Full division table -> this team's standing (rank / points) + the whole table
// for the standings ladder, via the shared computeStandings from @bowlkollen/core.
export function useTeamStanding(divisionId: number | null, teamId: number) {
  return useQuery({
    queryKey: ['team-standing', divisionId, teamId],
    enabled: divisionId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bits_matches')
        .select(
          'bits_match_id, home_bits_team_id, away_bits_team_id, home_team_name, away_team_name, home_result, away_result, is_finished, match_date, round_id, hall_name',
        )
        .eq('bits_division_id', divisionId!)
        .eq('season_id', CURRENT_SEASON);
      if (error) throw error;
      const table = computeStandings(data ?? []);
      const idx = table.findIndex((s) => s.teamId === teamId);
      if (idx === -1) return { rank: null, total: table.length, points: null, table };
      return { rank: idx + 1, total: table.length, points: table[idx].points, table };
    },
  });
}

export type FormResult = 'W' | 'L' | 'D';

export function computeForm(matches: TeamMatch[], teamId: number): FormResult[] {
  return matches
    .filter((m) => m.is_finished && m.home_result != null && m.away_result != null)
    .sort((a, b) => a.match_date.localeCompare(b.match_date))
    .slice(-5)
    .map((m) => {
      const home = m.home_bits_team_id === teamId;
      const my = (home ? m.home_result : m.away_result) ?? 0;
      const opp = (home ? m.away_result : m.home_result) ?? 0;
      return my > opp ? 'W' : my < opp ? 'L' : 'D';
    });
}

export function useRoster(teamId: number) {
  return useQuery({
    queryKey: ['team-roster', teamId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_roster', {
        p_bits_team_id: teamId,
        p_limit: 20,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}
