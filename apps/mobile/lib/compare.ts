import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { computePlayerStats, type PlayerMatch, type PlayerStats } from '@/lib/player-stats';
import { STALE } from '@/lib/query';
import { supabase } from '@/lib/supabase';

export type CompareIdentity = { name: string; clubName: string | null; licenceAverage: number | null };
export type ComparePlayer = { identity: CompareIdentity; stats: PlayerStats | null; over250: number };

// Identity + season stats for one side of the Compare screen.
export function useComparePlayer(publicId: string) {
  return useQuery({
    queryKey: ['compare-player', publicId],
    staleTime: STALE.MEDIUM,
    queryFn: async (): Promise<ComparePlayer> => {
      const [id, hist] = await Promise.all([
        supabase.rpc('get_player_identity', { p_public_id: publicId }),
        supabase.rpc('get_player_match_history', { p_public_id: publicId }),
      ]);
      const idRow = (id.data?.[0] ?? {}) as { name?: string; club_name?: string | null; licence_average?: number | null };
      const history = (hist.data ?? []) as PlayerMatch[];
      const stats = history.length ? computePlayerStats(history) : null;
      const games = history.flatMap((h) => (h.series ?? []).filter((g) => g > 0));
      return {
        identity: { name: idRow.name ?? '—', clubName: idRow.club_name ?? null, licenceAverage: idRow.licence_average ?? null },
        stats,
        over250: games.filter((g) => g >= 250).length,
      };
    },
  });
}

export type H2HForm = 'V' | 'F' | 'O';
export type H2H = { aWins: number; bWins: number; ties: number; meetings: number; recent: H2HForm[] };

// Direct delmatch head-to-head A-vs-B (from A's perspective).
export function useH2H(a: string, b: string) {
  return useQuery({
    queryKey: ['h2h', a, b],
    staleTime: STALE.LONG,
    queryFn: async (): Promise<H2H> => {
      // get_h2h isn't in the generated types yet — cast (see AGENTS.md).
      const db = supabase as unknown as SupabaseClient;
      const { data, error } = await db.rpc('get_h2h', { p_a: a, p_b: b });
      if (error) throw error;
      const r = ((data ?? []) as { a_wins: number; b_wins: number; ties: number; meetings: number; recent: number[] | null }[])[0];
      if (!r) return { aWins: 0, bWins: 0, ties: 0, meetings: 0, recent: [] };
      return {
        aWins: r.a_wins,
        bWins: r.b_wins,
        ties: r.ties,
        meetings: r.meetings,
        recent: (r.recent ?? []).map((n) => (n === 1 ? 'V' : n === -1 ? 'F' : 'O')),
      };
    },
  });
}
