import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// team_match_availability + its RPCs aren't in the generated types.
const db = supabase as unknown as SupabaseClient;

export type TeamRole = 'captain' | 'player';
export type AvailabilityResponse = 'yes' | 'maybe' | 'no';

// The caller's role on a team (verified claim), or null if not a member.
export function useMyTeamRole(teamId: number) {
  const { session } = useAuth();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ['my-team-role', uid, teamId],
    enabled: !!uid && teamId > 0,
    queryFn: async (): Promise<TeamRole | null> => {
      const { data } = await supabase
        .from('team_claims')
        .select('role')
        .eq('user_id', uid!)
        .eq('bits_team_id', teamId)
        .eq('status', 'verified')
        .maybeSingle();
      if (!data) return null;
      return ((data.role as string | null) ?? 'player') as TeamRole;
    },
  });
}

// The caller's own availability answer for a match.
export function useMyAvailability(teamId: number, matchId: number) {
  const { session } = useAuth();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ['my-availability', uid, teamId, matchId],
    enabled: !!uid && teamId > 0 && matchId > 0,
    queryFn: async (): Promise<{ response: AvailabilityResponse; note: string | null } | null> => {
      const { data } = await db
        .from('team_match_availability')
        .select('response, note')
        .eq('user_id', uid!)
        .eq('bits_team_id', teamId)
        .eq('bits_match_id', matchId)
        .maybeSingle();
      if (!data) return null;
      return { response: (data as Record<string, unknown>).response as AvailabilityResponse, note: ((data as Record<string, unknown>).note as string | null) ?? null };
    },
  });
}

export function useSetAvailability(teamId: number, matchId: number) {
  const { session } = useAuth();
  const uid = session?.user?.id;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { response: AvailabilityResponse; note?: string | null }) => {
      const { error } = await db.rpc('submit_availability_response', {
        p_bits_team_id: teamId,
        p_bits_match_id: matchId,
        p_response: v.response,
        p_note: v.note ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-availability', uid, teamId, matchId] });
      qc.invalidateQueries({ queryKey: ['team-availability', teamId, matchId] });
    },
  });
}

export type AvailabilityRow = {
  userId: string;
  response: AvailabilityResponse;
  note: string | null;
  displayName: string;
  publicId: string | null;
};

// The whole squad's answers — team-private (the RPC checks the caller is a member).
export function useTeamAvailability(teamId: number, matchId: number, enabled = true) {
  return useQuery({
    queryKey: ['team-availability', teamId, matchId],
    enabled: enabled && teamId > 0 && matchId > 0,
    queryFn: async (): Promise<AvailabilityRow[]> => {
      const { data, error } = await db.rpc('get_team_availability', {
        p_bits_team_id: teamId,
        p_bits_match_id: matchId,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        userId: r.user_id as string,
        response: r.response as AvailabilityResponse,
        note: (r.note as string | null) ?? null,
        displayName: (r.display_name as string | null) ?? 'Spelare',
        publicId: (r.public_id as string | null) ?? null,
      }));
    },
  });
}
