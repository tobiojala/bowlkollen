import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// team_match_availability + its RPCs aren't in the generated types.
const db = supabase as unknown as SupabaseClient;

export type TeamRole = 'captain' | 'player' | 'lagledare' | 'styrelse' | 'reserv';
export type AvailabilityResponse = 'yes' | 'maybe' | 'no';

// Join a team as a verified member (role 'player'). License that played for the team
// or is licensed with its club auto-verifies an adult; juniors/non-matches → pending.
// An optional team-scoped invite code is the vouching signal. p_invite_code is always
// sent (null when absent) so PostgREST resolves to the hardened 3-arg submit_team_claim
// rather than erroring on the legacy overload.
export function useJoinTeam(teamId: number) {
  const { session } = useAuth();
  const uid = session?.user?.id;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { licNbr: string; inviteCode?: string | null }): Promise<'verified' | 'pending'> => {
      const { data, error } = await db.rpc('submit_team_claim', {
        p_bits_team_id: teamId,
        p_lic_nbr: v.licNbr.trim(),
        p_invite_code: v.inviteCode?.trim() || null,
      });
      if (error) throw error;
      return ((data as { status?: 'verified' | 'pending' } | null)?.status ?? 'pending');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-team-role', uid, teamId] });
      qc.invalidateQueries({ queryKey: ['my-teams', uid] });
    },
  });
}

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

// Human-readable Swedish labels for team roles.
export const ROLE_LABEL: Record<TeamRole, string> = {
  captain: 'Kapten',
  player: 'Spelare',
  lagledare: 'Lagledare',
  styrelse: 'Styrelse',
  reserv: 'Reserv',
};
export const ASSIGNABLE_ROLES: TeamRole[] = ['captain', 'player', 'lagledare', 'styrelse', 'reserv'];

export type TeamMember = {
  userId: string;
  displayName: string;
  publicId: string | null;
  role: TeamRole;
  vouched: boolean;
  isMe: boolean;
};

// The squad's accounts + roles — team-private (RPC checks the caller is a member).
export function useTeamMembers(teamId: number) {
  return useQuery({
    queryKey: ['team-members', teamId],
    enabled: teamId > 0,
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await db.rpc('get_team_members', { p_bits_team_id: teamId });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        userId: r.user_id as string,
        displayName: (r.display_name as string | null) ?? 'Spelare',
        publicId: (r.public_id as string | null) ?? null,
        role: (r.role as TeamRole) ?? 'player',
        vouched: (r.vouched as boolean | null) ?? false,
        isMe: (r.is_me as boolean | null) ?? false,
      }));
    },
  });
}

// Captain-only: assign a role to a member.
export function useSetMemberRole(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { userId: string; role: TeamRole }) => {
      const { error } = await db.rpc('set_member_role', {
        p_bits_team_id: teamId,
        p_target_user_id: v.userId,
        p_role: v.role,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-members', teamId] }),
  });
}

// Any verified member can mint a shareable team invite link (the share IS the vouch).
export function useCreateTeamInvite(teamId: number) {
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const { data, error } = await db.rpc('create_team_invite_code', { p_bits_team_id: teamId });
      if (error) throw error;
      return data as string;
    },
  });
}

export type BestSplit = { name: string; avg: number; games: number } | null;

export type LineupCandidate = {
  publicId: string;
  name: string;
  overallAvg: number | null;
  overallGames: number;
  venueAvg: number | null;
  venueGames: number;
  divisionAvg: number | null;
  divisionGames: number;
  bestVenue: BestSplit;
  bestSquad: BestSplit;
  availability: AvailabilityResponse | null;
};

const MIN_CONTEXT_GAMES = 3; // below this a split is too noisy to lead with

// The number to show/rank on for this match: venue if they've bowled it enough,
// else this division, else their overall. Returns the value + which context it is.
export function candidateFit(c: LineupCandidate): { value: number | null; context: 'venue' | 'division' | 'overall' } {
  if (c.venueAvg != null && c.venueGames >= MIN_CONTEXT_GAMES) return { value: c.venueAvg, context: 'venue' };
  if (c.divisionAvg != null && c.divisionGames >= MIN_CONTEXT_GAMES) return { value: c.divisionAvg, context: 'division' };
  return { value: c.overallAvg, context: 'overall' };
}

// Ranked, context-aware candidates for a match's laguttagning (team-private RPC).
export function useLineupCandidates(teamId: number, matchId: number) {
  return useQuery({
    queryKey: ['lineup-candidates', teamId, matchId],
    enabled: teamId > 0 && matchId > 0,
    queryFn: async (): Promise<LineupCandidate[]> => {
      const { data, error } = await db.rpc('get_lineup_candidates', {
        p_bits_team_id: teamId,
        p_bits_match_id: matchId,
      });
      if (error) throw error;
      const split = (name: unknown, avg: unknown, games: unknown): BestSplit =>
        name ? { name: name as string, avg: (avg as number) ?? 0, games: (games as number) ?? 0 } : null;
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        publicId: r.public_id as string,
        name: (r.player_name as string | null) ?? 'Spelare',
        overallAvg: (r.overall_avg as number | null) ?? null,
        overallGames: (r.overall_games as number | null) ?? 0,
        venueAvg: (r.venue_avg as number | null) ?? null,
        venueGames: (r.venue_games as number | null) ?? 0,
        divisionAvg: (r.division_avg as number | null) ?? null,
        divisionGames: (r.division_games as number | null) ?? 0,
        bestVenue: split(r.best_venue, r.best_venue_avg, r.best_venue_games),
        bestSquad: split(r.best_squad, r.best_squad_avg, r.best_squad_games),
        availability: (r.availability as AvailabilityResponse | null) ?? null,
      }));
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
