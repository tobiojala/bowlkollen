import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { STALE } from '@/lib/query';
import { supabase } from '@/lib/supabase';

export type Konstellation = {
  aPublicId: string;
  bPublicId: string;
  wins: number;
  losses: number;
  ties: number;
  together: number;
  winRate: number;
};

type Row = {
  a_public_id: string;
  b_public_id: string;
  wins: number;
  losses: number;
  ties: number;
  together: number;
};

// Historical partnership records among a set of players (the lineup candidates),
// for the captain's "bästa konstellationer" suggestions. Sorting/filtering is the
// caller's job so it can apply a sensible minimum sample.
export function useKonstellationer(publicIds: string[]) {
  const ids = [...publicIds].sort();
  return useQuery({
    queryKey: ['konstellationer', ids.join(',')],
    enabled: ids.length >= 2,
    staleTime: STALE.LONG,
    queryFn: async (): Promise<Konstellation[]> => {
      // get_konstellationer isn't in the generated types yet — cast (see AGENTS.md).
      const db = supabase as unknown as SupabaseClient;
      const { data, error } = await db.rpc('get_konstellationer', { p_public_ids: ids });
      if (error) throw error;
      return ((data ?? []) as Row[]).map((r) => ({
        aPublicId: r.a_public_id,
        bPublicId: r.b_public_id,
        wins: r.wins,
        losses: r.losses,
        ties: r.ties,
        together: r.together,
        winRate: r.wins / ((r.wins + r.losses) || 1),
      }));
    },
  });
}
