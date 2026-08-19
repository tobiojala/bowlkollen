import { computeStandings } from '@bowlkollen/core';
import { useQuery } from '@tanstack/react-query';

import type { MatchRowData } from '@/components/MatchRow';
import { supabase } from '@/lib/supabase';

const CURRENT_SEASON = 2026;
const PREVIOUS_SEASON = 2025;

const STANDING_COLS =
  'bits_match_id, home_bits_team_id, away_bits_team_id, home_team_name, away_team_name, home_result, away_result, is_finished, match_date, round_id, hall_name';

export type TeamIdentity = { name: string; club_name: string | null; bits_club_id: number | null; logoUrl: string | null; ringColor: string | null; headerColor: string | null };

export function useTeam(teamId: number) {
  return useQuery({
    queryKey: ['team', teamId],
    enabled: teamId > 0,
    queryFn: async (): Promise<TeamIdentity | null> => {
      const { data } = await supabase
        .from('bits_teams')
        .select('name, club_name, bits_club_id')
        .eq('bits_team_id', teamId)
        .maybeSingle();
      if (!data) return null;
      // Club crest + any captain-set ring colour, resolved separately (no FK embed).
      // team_appearance / bits_clubs aren't fully in the generated types → untyped view.
      const anyDb = supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => { eq: (k: string, v: unknown) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> } };
        };
      };
      const [club, appearance] = await Promise.all([
        data.bits_club_id
          ? anyDb.from('bits_clubs').select('logo_url').eq('bits_id', data.bits_club_id).maybeSingle()
          : Promise.resolve({ data: null }),
        anyDb.from('team_appearance').select('ring_color, header_color').eq('bits_team_id', teamId).maybeSingle(),
      ]);
      const app = appearance.data as { ring_color?: string; header_color?: string } | null;
      return {
        name: data.name as string,
        club_name: (data.club_name as string | null) ?? null,
        bits_club_id: (data.bits_club_id as number | null) ?? null,
        logoUrl: ((club.data as { logo_url?: string } | null)?.logo_url as string | null) ?? null,
        ringColor: (app?.ring_color as string | null) ?? null,
        headerColor: (app?.header_color as string | null) ?? null,
      };
    },
  });
}

export type TeamMatch = MatchRowData & {
  home_bits_team_id: number;
  away_bits_team_id: number;
  bits_division_id: number | null;
};

export function useTeamMatches(teamId: number, enabled = true) {
  return useQuery({
    queryKey: ['team-matches', teamId],
    enabled: enabled && teamId > 0,
    queryFn: async (): Promise<TeamMatch[]> => {
      const { data, error } = await supabase
        .from('bits_matches')
        .select(
          'bits_match_id, home_team_name, away_team_name, home_result, away_result, division_name, is_finished, match_date, hall_name, home_bits_team_id, away_bits_team_id, bits_division_id',
        )
        .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
        .eq('season_id', CURRENT_SEASON);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Full division table -> this team's standing (rank / points) + the whole table
// for the standings ladder, via the shared computeStandings from @bowlkollen/core.
// Pre-season (no finished matches yet) falls back to last season's final table,
// flagged `historical` so the UI can label it — mirrors the web.
export function useTeamStanding(divisionId: number | null, teamId: number) {
  return useQuery({
    queryKey: ['team-standing', divisionId, teamId],
    enabled: divisionId != null,
    queryFn: async () => {
      const current = await supabase
        .from('bits_matches')
        .select(STANDING_COLS)
        .eq('bits_division_id', divisionId!)
        .eq('season_id', CURRENT_SEASON);
      if (current.error) throw current.error;

      let table = computeStandings(current.data ?? []);
      let historical = false;

      // No finished matches this season yet -> show last season's final table for
      // the division the team actually played in then (promotion/relegation-safe).
      if (table.length === 0) {
        const prevDiv = await supabase
          .from('bits_matches')
          .select('bits_division_id')
          .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
          .eq('season_id', PREVIOUS_SEASON)
          .not('bits_division_id', 'is', null)
          .limit(1)
          .maybeSingle();
        const prevDivisionId = prevDiv.data?.bits_division_id ?? null;
        if (prevDivisionId != null) {
          const prev = await supabase
            .from('bits_matches')
            .select(STANDING_COLS)
            .eq('bits_division_id', prevDivisionId)
            .eq('season_id', PREVIOUS_SEASON);
          if (!prev.error) {
            table = computeStandings(prev.data ?? []);
            historical = true;
          }
        }
      }

      const idx = table.findIndex((s) => s.teamId === teamId);
      return {
        rank: idx === -1 ? null : idx + 1,
        total: table.length,
        points: idx === -1 ? null : table[idx].points,
        table,
        historical,
      };
    },
  });
}

export type FormResult = 'W' | 'L' | 'D';

export function computeForm(matches: TeamMatch[], teamId: number): FormResult[] {
  return matches
    .filter((m) => m.is_finished && m.home_result != null && m.away_result != null)
    .sort((a, b) => a.match_date.localeCompare(b.match_date))
    .slice(-5)
    .map((m) => {
      const home = m.home_bits_team_id === teamId;
      const my = (home ? m.home_result : m.away_result) ?? 0;
      const opp = (home ? m.away_result : m.home_result) ?? 0;
      return my > opp ? 'W' : my < opp ? 'L' : 'D';
    });
}

// Distinct seasons this team has data in (newest first) — drives the schedule's
// season picker so you can look back at past seasons.
export function useTeamSeasons(teamId: number) {
  return useQuery({
    queryKey: ['team-seasons', teamId],
    queryFn: async (): Promise<number[]> => {
      const { data, error } = await supabase
        .from('bits_matches')
        .select('season_id')
        .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`);
      if (error) throw error;
      const seasons = [...new Set((data ?? []).map((r) => r.season_id as number))];
      return seasons.sort((a, b) => b - a);
    },
  });
}

// This team's matches for a specific season (any season, for the picker).
export function useTeamSeasonMatches(teamId: number, season: number | null) {
  return useQuery({
    queryKey: ['team-season-matches', teamId, season],
    enabled: season != null,
    queryFn: async (): Promise<TeamMatch[]> => {
      const { data, error } = await supabase
        .from('bits_matches')
        .select(
          'bits_match_id, home_team_name, away_team_name, home_result, away_result, division_name, is_finished, match_date, hall_name, home_bits_team_id, away_bits_team_id, bits_division_id',
        )
        .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
        .eq('season_id', season!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRoster(teamId: number) {
  return useQuery({
    queryKey: ['team-roster', teamId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_team_roster', {
        p_bits_team_id: teamId,
        p_limit: 20,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}
