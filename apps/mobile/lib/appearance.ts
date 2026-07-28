import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

// player_appearance / set_my_player_header / set_team_header aren't in the generated
// types (run supabase/migrations/profile_headers.sql).
const db = supabase as unknown as SupabaseClient;

// The curated cover colour for a player's public profile (public read).
export function usePlayerHeader(publicId: string | null | undefined) {
  return useQuery({
    queryKey: ['player-header', publicId],
    enabled: !!publicId,
    queryFn: async (): Promise<string | null> => {
      const { data } = await db.from('player_appearance').select('header_color').eq('public_id', publicId!).maybeSingle();
      return ((data as { header_color?: string } | null)?.header_color as string | null) ?? null;
    },
  });
}

// The caller sets their own claimed player's header.
export function useSetMyPlayerHeader(publicId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (color: string | null) => {
      const { error } = await db.rpc('set_my_player_header', { p_color: color });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['player-header', publicId] }),
  });
}

// Captain/board sets the team's header colour (team_appearance).
export function useSetTeamHeader(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (color: string | null) => {
      const { error } = await db.rpc('set_team_header', { p_bits_team_id: teamId, p_color: color });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team', teamId] }),
  });
}
