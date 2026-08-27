import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { ResultRow } from '@/components/TeamResults';
import { computeDelmatcher, type DelmatchSlot, type DelmatchSummary } from '@/lib/delmatch';
import { supabase } from '@/lib/supabase';

// Match-page data hooks — extracted from the screen so the page stays lean.

export type Match = {
  home_team_name: string; away_team_name: string;
  home_score: number | null; away_score: number | null;   // pinfall
  home_result: number | null; away_result: number | null; // match points
  home_bits_team_id: number | null; away_bits_team_id: number | null;
  bits_division_id: number | null; season_id: number;
  division_name: string | null; is_finished: boolean | null; match_date: string; match_datetime: string | null;
  hall_name: string | null; hall_city: string | null; oil_pattern: string | null;
};

export function useMatch(matchId: number) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: async (): Promise<Match | null> => {
      const { data } = await supabase
        .from('bits_matches')
        .select('home_team_name, away_team_name, home_score, away_score, home_result, away_result, home_bits_team_id, away_bits_team_id, bits_division_id, season_id, division_name, is_finished, match_date, match_datetime, hall_name, hall_city, oil_pattern')
        .eq('bits_match_id', matchId)
        .maybeSingle();
      return data as Match | null;
    },
  });
}

export function useMatchResults(matchId: number) {
  return useQuery({
    queryKey: ['match-results', matchId],
    queryFn: async (): Promise<ResultRow[]> => {
      const { data, error } = await supabase
        .from('bits_match_player_results')
        .select('player_name, total_result, series, is_home_team, lic_nbr')
        .eq('bits_match_id', matchId)
        .order('total_result', { ascending: false });
      if (error) throw error;
      const rows = data ?? [];

      const licNbrs = [...new Set(rows.map((r) => r.lic_nbr))];
      const idMap = new Map<string, string>();
      if (licNbrs.length) {
        const { data: players } = await supabase.from('bits_players').select('lic_nbr, public_id').in('lic_nbr', licNbrs);
        for (const p of players ?? []) idMap.set(p.lic_nbr, p.public_id);
      }
      return rows.map((r) => ({
        player_name: r.player_name, total_result: r.total_result, series: r.series,
        is_home_team: r.is_home_team, public_id: idMap.get(r.lic_nbr) ?? null,
      }));
    },
  });
}

export function useMatchDelmatcher(matchId: number) {
  return useQuery({
    queryKey: ['match-delmatch', matchId],
    queryFn: async (): Promise<DelmatchSummary> => {
      // bits_match_delmatch isn't in the generated types yet — cast (see AGENTS.md).
      const db = supabase as unknown as SupabaseClient;
      const { data, error } = await db
        .from('bits_match_delmatch')
        .select('serie, table_no, player_order, is_home_team, player_name, lic_nbr, score')
        .eq('bits_match_id', matchId);
      if (error) throw error;
      const rows = (data ?? []) as {
        serie: number; table_no: number; player_order: number;
        is_home_team: boolean; player_name: string; lic_nbr: string | null; score: number;
      }[];

      const licNbrs = [...new Set(rows.map((r) => r.lic_nbr).filter(Boolean) as string[])];
      const idMap = new Map<string, string>();
      if (licNbrs.length) {
        const { data: players } = await supabase.from('bits_players').select('lic_nbr, public_id').in('lic_nbr', licNbrs);
        for (const p of players ?? []) idMap.set(p.lic_nbr, p.public_id);
      }
      const slots: DelmatchSlot[] = rows.map((r) => ({
        serie: r.serie, tableNo: r.table_no, order: r.player_order, isHomeTeam: r.is_home_team,
        playerName: r.player_name, publicId: r.lic_nbr ? idMap.get(r.lic_nbr) ?? null : null, score: r.score,
      }));
      return computeDelmatcher(slots);
    },
  });
}
