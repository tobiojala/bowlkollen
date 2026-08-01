import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { STALE } from '@/lib/query';
import { supabase } from '@/lib/supabase';

export type MatchRivalry = {
  a: { publicId: string | null; name: string; wins: number };
  b: { publicId: string | null; name: string; wins: number };
  ties: number;
  meetings: number;
  tonight: 'a' | 'b' | 'split';
};

type RivalryRow = {
  a_public_id: string | null;
  a_name: string;
  b_public_id: string | null;
  b_name: string;
  a_wins: number;
  b_wins: number;
  ties: number;
  meetings: number;
  a_tonight_wins: number;
  b_tonight_wins: number;
};

// "Kvällens hetaste bord" — the finished match's marquee rivalry (career head-to-head
// of the pairing with the most history). null when no genuine rivalry (met < 3 times).
export function useMatchRivalry(matchId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['match-rivalry', matchId],
    enabled,
    staleTime: STALE.LONG,
    queryFn: async (): Promise<MatchRivalry | null> => {
      // get_match_rivalry isn't in the generated types yet — cast (see AGENTS.md).
      const db = supabase as unknown as SupabaseClient;
      const { data, error } = await db.rpc('get_match_rivalry', { p_match_id: matchId });
      if (error) throw error;
      const row = ((data ?? []) as RivalryRow[])[0];
      if (!row) return null;
      return {
        a: { publicId: row.a_public_id, name: row.a_name, wins: row.a_wins },
        b: { publicId: row.b_public_id, name: row.b_name, wins: row.b_wins },
        ties: row.ties,
        meetings: row.meetings,
        tonight: row.a_tonight_wins > row.b_tonight_wins ? 'a' : row.b_tonight_wins > row.a_tonight_wins ? 'b' : 'split',
      };
    },
  });
}
