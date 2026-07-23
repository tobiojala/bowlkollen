import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type TopScore = {
  matchId: number;
  playerName: string;
  total: number;
  series: number[];
  division: string;
  opponent: string;
  date: string;
  publicId: string | null;
};

const WINDOW_DAYS = 180;
const MAX_TOTAL = 1200; // 4 × 300

// Recent top series in the top tiers — the national highlight reel. Ported from
// the web useBitsTopScores: authoritative per-player results, deduped to each
// player's best in the window.
export function useTopScores() {
  return useQuery({
    queryKey: ['top-scores'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<TopScore[]> => {
      const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);

      const { data: matches } = await supabase
        .from('bits_matches')
        .select('bits_match_id, division_name, home_team_name, away_team_name, match_date')
        .eq('is_finished', true)
        .gte('match_date', since)
        .lte('match_date', today)
        .or('division_name.ilike.%Elitserien%,division_name.ilike.%Allsvenskan%')
        .order('match_date', { ascending: false })
        .limit(60);
      if (!matches?.length) return [];

      const matchMap = new Map(matches.map((m) => [m.bits_match_id, m]));
      const { data: results } = await supabase
        .from('bits_match_player_results')
        .select('bits_match_id, lic_nbr, player_name, is_home_team, series, total_result')
        .in('bits_match_id', matches.map((m) => m.bits_match_id))
        .order('total_result', { ascending: false })
        .limit(120);
      if (!results?.length) return [];

      const licNbrs = [...new Set(results.map((r) => r.lic_nbr))];
      const idByLic = new Map<string, string>();
      if (licNbrs.length) {
        const { data: players } = await supabase
          .from('bits_players')
          .select('lic_nbr, public_id')
          .in('lic_nbr', licNbrs);
        for (const p of players ?? []) idByLic.set(p.lic_nbr, p.public_id);
      }

      const seen = new Set<string>();
      const out: TopScore[] = [];
      for (const r of results) {
        if (r.total_result <= 0 || r.total_result > MAX_TOTAL || seen.has(r.lic_nbr)) continue;
        seen.add(r.lic_nbr);
        const m = matchMap.get(r.bits_match_id)!;
        out.push({
          matchId: r.bits_match_id,
          playerName: r.player_name,
          total: r.total_result,
          series: r.series ?? [],
          division: m.division_name ?? '',
          opponent: r.is_home_team ? m.away_team_name : m.home_team_name,
          date: m.match_date,
          publicId: idByLic.get(r.lic_nbr) ?? null,
        });
        if (out.length >= 15) break;
      }
      return out;
    },
  });
}
