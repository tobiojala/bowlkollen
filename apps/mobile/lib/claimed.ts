import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

// get_claimed_public_ids isn't in the generated types (run claimed_badge.sql).
const db = supabase as unknown as SupabaseClient;

// Which of these players are on Bowlkollen (verified claim). Batched; returns a Set.
export function useClaimedPlayers(publicIds: (string | null | undefined)[]) {
  const ids = [...new Set(publicIds.filter((x): x is string => !!x))].sort();
  return useQuery({
    queryKey: ['claimed-players', ids],
    enabled: ids.length > 0,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await db.rpc('get_claimed_public_ids', { p_ids: ids });
      if (error) throw error;
      return new Set(((data ?? []) as { public_id: string }[]).map((r) => r.public_id));
    },
  });
}

// Convenience for a single player.
export function useIsClaimed(publicId: string | null | undefined) {
  const { data } = useClaimedPlayers([publicId]);
  return !!publicId && !!data?.has(publicId);
}
