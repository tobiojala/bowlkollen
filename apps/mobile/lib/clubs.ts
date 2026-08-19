import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

// A BITS club and its teams (World 5). Mirrors web /clubs/[bitsId] — BITS-native,
// every team has a canonical /lag/[bits_team_id] page.
export type Club = {
  bits_id: number;
  name: string;
  county: string | null;
  hall_name: string | null;
  logo_url: string | null;
};

export type ClubTeam = {
  bits_team_id: number;
  name: string;
  hall_name: string | null;
  team_type_desc: string | null;
};

export function useClub(bitsId: number) {
  return useQuery({
    queryKey: ['club', bitsId],
    enabled: bitsId > 0,
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<{ club: Club | null; teams: ClubTeam[] }> => {
      const { data: club } = await supabase
        .from('bits_clubs')
        .select('bits_id, name, county, hall_name, logo_url')
        .eq('bits_id', bitsId)
        .maybeSingle();
      if (!club) return { club: null, teams: [] };

      const { data: teams } = await supabase
        .from('bits_teams')
        .select('bits_team_id, name, hall_name, team_type_desc')
        .eq('bits_club_id', bitsId)
        .order('name');
      return { club: club as Club, teams: (teams as ClubTeam[]) ?? [] };
    },
  });
}

// Tier label (A-lag / Damer A / Junior …) from a BITS team type description.
export function teamTypeLabel(desc: string | null): string {
  const d = desc ?? '';
  if (d.includes('DA - Lag')) return 'Damer A';
  if (d.includes('DB - Lag')) return 'Damer B';
  if (d.includes('A - Lag')) return 'A-lag';
  if (d.includes('B - Lag')) return 'B-lag';
  if (d.includes('C - Lag')) return 'C-lag';
  if (d.includes('F - Lag')) return 'F-lag';
  if (d.includes('JH - Lag') || d.includes('Junior')) return 'Junior';
  return d;
}
