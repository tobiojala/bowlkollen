import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export type MyClaim = {
  publicId: string;
  status: 'pending' | 'verified' | 'rejected';
  name: string;
  club: string | null;
} | null;

// The player the logged-in user has claimed (one per user), if any.
export function useMyClaim() {
  const { session } = useAuth();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ['my-claim', uid],
    enabled: !!uid,
    queryFn: async (): Promise<MyClaim> => {
      const { data } = await supabase
        .from('player_claims')
        .select('player_id, status, player:player_id(first_name, sur_name, club_name)')
        .eq('user_id', uid!)
        .maybeSingle();
      if (!data) return null;
      const p = (Array.isArray(data.player) ? data.player[0] : data.player) as
        | { first_name: string | null; sur_name: string | null; club_name: string | null }
        | null;
      return {
        publicId: data.player_id as string,
        status: data.status as 'pending' | 'verified' | 'rejected',
        name: `${p?.first_name ?? ''} ${p?.sur_name ?? ''}`.trim() || 'Spelare',
        club: p?.club_name ?? null,
      };
    },
  });
}

export type MyTeam = { teamId: number; name: string; role: string };

// Teams the user is a verified member/captain of.
export function useMyTeams() {
  const { session } = useAuth();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ['my-teams', uid],
    enabled: !!uid,
    queryFn: async (): Promise<MyTeam[]> => {
      const { data: claims } = await supabase
        .from('team_claims')
        .select('bits_team_id, role')
        .eq('user_id', uid!)
        .eq('status', 'verified');
      const ids = (claims ?? []).map((c) => c.bits_team_id);
      if (ids.length === 0) return [];
      const { data: teams } = await supabase.from('bits_teams').select('bits_team_id, name').in('bits_team_id', ids);
      const nameById = new Map((teams ?? []).map((t) => [t.bits_team_id, t.name]));
      return (claims ?? []).map((c) => ({
        teamId: c.bits_team_id,
        name: nameById.get(c.bits_team_id) ?? 'Lag',
        role: c.role ?? 'player',
      }));
    },
  });
}
