import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { STALE } from '@/lib/query';

// Ingested BITS competitions (tävlingar) — native parity with the web
// /tavlingar/resultat + /tavlingar/[id] surfaces. See project_bits_competitions.

const db = supabase as unknown as SupabaseClient;

export type CompRow = {
  bits_competition_id: number;
  name: string;
  hall_city: string | null;
  start_date: string | null;
  results_synced: boolean;
};

export function useCompetitionSeasons() {
  return useQuery<number[]>({
    queryKey: ['comp-seasons'],
    staleTime: STALE.LONG,
    queryFn: async () => {
      const { data } = await db.from('bits_competitions').select('season_id');
      return [...new Set(((data ?? []) as { season_id: number }[]).map((r) => r.season_id))].sort((a, b) => b - a);
    },
  });
}

export function useCompetitions(season: number) {
  return useQuery<CompRow[]>({
    queryKey: ['comps', season],
    enabled: !!season,
    staleTime: STALE.MEDIUM,
    queryFn: async () => {
      const { data } = await db.from('bits_competitions')
        .select('bits_competition_id, name, hall_city, start_date, results_synced')
        .eq('season_id', season)
        .order('start_date', { ascending: false })
        .limit(1000);
      return (data ?? []) as CompRow[];
    },
  });
}

export type CompDetail = {
  bits_competition_id: number; name: string; hall: string | null; hall_city: string | null;
  start_date: string | null; end_date: string | null;
};
export type CompResult = {
  result_row_nbr: number; lic_nbr: string | null; player_name: string | null; club_name: string | null;
  place: number | null; total_pins: number; total_games: number;
};

export function useCompetition(id: number) {
  return useQuery<{ comp: CompDetail | null; results: CompResult[]; links: Record<string, string> }>({
    queryKey: ['comp', id],
    enabled: !!id,
    staleTime: STALE.MEDIUM,
    queryFn: async () => {
      const { data: comp } = await db.from('bits_competitions').select('*').eq('bits_competition_id', id).maybeSingle();
      const { data: rows } = await db.from('bits_competition_results').select('*')
        .eq('bits_competition_id', id)
        .order('result_row_nbr', { ascending: true })
        .order('place', { ascending: true });
      const results = (rows ?? []) as CompResult[];
      const lics = [...new Set(results.map((r) => r.lic_nbr).filter(Boolean) as string[])];
      const links: Record<string, string> = {};
      if (lics.length) {
        const { data: players } = await db.from('bits_players').select('lic_nbr, public_id').in('lic_nbr', lics);
        for (const p of (players ?? []) as { lic_nbr: string; public_id: string }[]) links[p.lic_nbr] = p.public_id;
      }
      return { comp: (comp as CompDetail) ?? null, results, links };
    },
  });
}

export type PlayerComp = {
  bits_competition_id: number; competition_name: string; start_date: string | null;
  place: number | null; total_pins: number; total_games: number;
};

export function usePlayerCompetitions(publicId: string) {
  return useQuery<PlayerComp[]>({
    queryKey: ['player-comps', publicId],
    staleTime: STALE.LONG,
    retry: false,
    queryFn: async () => {
      const { data, error } = await db.rpc('get_player_competition_results', { p_public_id: publicId });
      if (error) return [];
      return (data ?? []) as PlayerComp[];
    },
  });
}
