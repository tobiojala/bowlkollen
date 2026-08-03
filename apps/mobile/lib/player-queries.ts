import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export function usePlayer(publicId: string) {
  return useQuery({
    queryKey: ['player', publicId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_player_identity', { p_public_id: publicId });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}

export function usePlayerHistory(publicId: string) {
  return useQuery({
    queryKey: ['player-history', publicId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_player_match_history', { p_public_id: publicId });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Percentile vs the whole field (integer: "better than X%").
export function usePlayerPercentile(publicId: string) {
  return useQuery({
    queryKey: ['player-percentile', publicId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_player_percentile', { p_public_id: publicId });
      if (error) throw error;
      return data;
    },
  });
}
