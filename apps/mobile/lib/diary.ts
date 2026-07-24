import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// player_notes isn't in the generated types yet (run supabase/migrations/player_notes.sql).
const db = supabase as unknown as SupabaseClient;

const CURRENT_SEASON = 2026;
const todayISO = () => new Date().toISOString().slice(0, 10);

export type NextMatch = {
  matchId: number;
  date: string;
  hall: string | null;
  division: string | null;
  myTeamId: number;
  myTeamName: string;
  opponentId: number | null;
  opponentName: string;
  isHome: boolean;
};

// The soonest upcoming fixture across the teams the user plays for (verified team
// claims) — falling back to teams they follow so the card still lights up before a
// user has claimed a team. Null when there's nothing on the horizon.
export function useNextMatch() {
  const { session } = useAuth();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ['next-match', uid],
    enabled: !!uid,
    queryFn: async (): Promise<NextMatch | null> => {
      // My teams first; if none, the teams I follow.
      const { data: claims } = await supabase
        .from('team_claims')
        .select('bits_team_id')
        .eq('user_id', uid!)
        .eq('status', 'verified');
      let teamIds = (claims ?? []).map((c) => c.bits_team_id as number);

      if (teamIds.length === 0) {
        const { data: follows } = await supabase
          .from('follows')
          .select('entity_id')
          .eq('user_id', uid!)
          .eq('entity_type', 'team');
        teamIds = (follows ?? []).map((f) => Number(f.entity_id)).filter((n) => n > 0);
      }
      if (teamIds.length === 0) return null;

      const ids = teamIds.join(',');
      const { data: rows } = await supabase
        .from('bits_matches')
        .select(
          'bits_match_id, home_team_name, away_team_name, match_date, hall_name, division_name, home_bits_team_id, away_bits_team_id, is_finished',
        )
        .or(`home_bits_team_id.in.(${ids}),away_bits_team_id.in.(${ids})`)
        .eq('season_id', CURRENT_SEASON)
        .eq('is_finished', false)
        .gte('match_date', todayISO())
        .order('match_date', { ascending: true })
        .limit(1);

      const m = rows?.[0];
      if (!m) return null;
      const isHome = teamIds.includes(m.home_bits_team_id as number);
      return {
        matchId: m.bits_match_id as number,
        date: m.match_date as string,
        hall: (m.hall_name as string | null) ?? null,
        division: (m.division_name as string | null) ?? null,
        myTeamId: (isHome ? m.home_bits_team_id : m.away_bits_team_id) as number,
        myTeamName: (isHome ? m.home_team_name : m.away_team_name) as string,
        opponentId: (isHome ? m.away_bits_team_id : m.home_bits_team_id) as number | null,
        opponentName: (isHome ? m.away_team_name : m.home_team_name) as string,
        isHome,
      };
    },
  });
}

export type PrepMatch = {
  matchId: number;
  date: string;
  hall: string | null;
  division: string | null;
  homeName: string;
  awayName: string;
};

// Just enough of a match to head up the prep sheet. Shares the ['match'] cache
// key shape isn't reused here (different columns) — keyed separately.
export function usePrepMatch(matchId: number) {
  return useQuery({
    queryKey: ['prep-match', matchId],
    enabled: matchId > 0,
    queryFn: async (): Promise<PrepMatch | null> => {
      const { data } = await supabase
        .from('bits_matches')
        .select('bits_match_id, match_date, hall_name, division_name, home_team_name, away_team_name')
        .eq('bits_match_id', matchId)
        .maybeSingle();
      if (!data) return null;
      return {
        matchId: data.bits_match_id as number,
        date: data.match_date as string,
        hall: (data.hall_name as string | null) ?? null,
        division: (data.division_name as string | null) ?? null,
        homeName: data.home_team_name as string,
        awayName: data.away_team_name as string,
      };
    },
  });
}

export type Note = {
  id: string;
  matchId: number | null;
  hall: string | null;
  body: string;
  createdAt: string;
};

const mapNote = (r: Record<string, unknown>): Note => ({
  id: r.id as string,
  matchId: (r.bits_match_id as number | null) ?? null,
  hall: (r.hall_name as string | null) ?? null,
  body: r.body as string,
  createdAt: r.created_at as string,
});

// Every note I've written at a given center, newest first — this is the "recall"
// that surfaces when I'm booked to play here again.
export function useHallNotes(hall: string | null | undefined) {
  const { session } = useAuth();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ['hall-notes', uid, hall],
    enabled: !!uid && !!hall,
    queryFn: async (): Promise<Note[]> => {
      const { data } = await db
        .from('player_notes')
        .select('id, bits_match_id, hall_name, body, created_at')
        .eq('user_id', uid!)
        .eq('hall_name', hall!)
        .order('created_at', { ascending: false });
      return (data ?? []).map(mapNote);
    },
  });
}

// Notes written for one specific match.
export function useMatchNotes(matchId: number | null | undefined) {
  const { session } = useAuth();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ['match-notes', uid, matchId],
    enabled: !!uid && matchId != null,
    queryFn: async (): Promise<Note[]> => {
      const { data } = await db
        .from('player_notes')
        .select('id, bits_match_id, hall_name, body, created_at')
        .eq('user_id', uid!)
        .eq('bits_match_id', matchId!)
        .order('created_at', { ascending: false });
      return (data ?? []).map(mapNote);
    },
  });
}

export function useSaveNote() {
  const { session } = useAuth();
  const uid = session?.user?.id;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { body: string; matchId: number | null; hall: string | null }) => {
      const { error } = await db.from('player_notes').insert({
        user_id: uid,
        bits_match_id: input.matchId,
        hall_name: input.hall,
        body: input.body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['match-notes', uid, v.matchId] });
      qc.invalidateQueries({ queryKey: ['hall-notes', uid, v.hall] });
    },
  });
}

// A ball as it appears in a match's "what I threw" list — enough to render the orb.
export type MatchBall = {
  rowId: string;          // match_balls row id (for detach)
  playerBallId: string;   // the bag entry
  brand: string | null;
  name: string;
  imageUrl: string | null;
  weight: number | null;
};

const BALL_JOIN =
  'id, player_ball_id, player_ball:player_ball_id(custom_name, brand, weight, ball:ball_id(brand, name, image_url))';

const mapMatchBall = (row: Record<string, unknown>): MatchBall => {
  const pb = (Array.isArray(row.player_ball) ? row.player_ball[0] : row.player_ball) as
    | Record<string, unknown>
    | null;
  const cat = pb && (Array.isArray(pb.ball) ? pb.ball[0] : pb.ball) as Record<string, unknown> | null;
  return {
    rowId: row.id as string,
    playerBallId: row.player_ball_id as string,
    brand: (cat?.brand as string | null) ?? (pb?.brand as string | null) ?? null,
    name: (cat?.name as string | null) ?? (pb?.custom_name as string | null) ?? 'Klot',
    imageUrl: (cat?.image_url as string | null) ?? null,
    weight: (pb?.weight as number | null) ?? null,
  };
};

// Balls attached to this specific match.
export function useMatchBalls(matchId: number | null | undefined) {
  const { session } = useAuth();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ['match-balls', uid, matchId],
    enabled: !!uid && matchId != null,
    queryFn: async (): Promise<MatchBall[]> => {
      const { data } = await db
        .from('match_balls')
        .select(BALL_JOIN)
        .eq('user_id', uid!)
        .eq('bits_match_id', matchId!)
        .order('created_at', { ascending: true });
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(mapMatchBall);
    },
  });
}

// Distinct balls I've thrown at this center on *other* visits — the recall.
export function useHallBalls(hall: string | null | undefined, excludeMatchId: number) {
  const { session } = useAuth();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ['hall-balls', uid, hall, excludeMatchId],
    enabled: !!uid && !!hall,
    queryFn: async (): Promise<MatchBall[]> => {
      const { data } = await db
        .from('match_balls')
        .select(BALL_JOIN + ', bits_match_id')
        .eq('user_id', uid!)
        .eq('hall_name', hall!)
        .neq('bits_match_id', excludeMatchId)
        .order('created_at', { ascending: false });
      const rows = ((data ?? []) as unknown as Record<string, unknown>[]).map(mapMatchBall);
      const seen = new Set<string>();
      return rows.filter((b) => (seen.has(b.playerBallId) ? false : (seen.add(b.playerBallId), true)));
    },
  });
}

export function useAttachBall() {
  const { session } = useAuth();
  const uid = session?.user?.id;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { matchId: number; playerBallId: string; hall: string | null }) => {
      const { error } = await db
        .from('match_balls')
        .insert({ user_id: uid, bits_match_id: v.matchId, player_ball_id: v.playerBallId, hall_name: v.hall });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['match-balls', uid, v.matchId] }),
  });
}

export function useDetachBall() {
  const { session } = useAuth();
  const uid = session?.user?.id;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { rowId: string; matchId: number }) => {
      const { error } = await db.from('match_balls').delete().eq('id', v.rowId);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['match-balls', uid, v.matchId] }),
  });
}

// The official SvBF oil profiles (shared oil_profiles table, seeded from swebowl.se).
// Category order + Swedish labels, everyday league profiles first.
export type OilProfile = {
  name: string;
  lengthFt: number | null;
  ratio: number | null;
  category: string | null;
  description: string | null;
};

export const OIL_CATEGORY_ORDER = ['elite', 'elite_damer', 'bredare', 'sammandrag', 'kval', 'sm'];
export const OIL_CATEGORY_LABEL: Record<string, string> = {
  elite: 'ELITSERIEN / ALLSVENSKAN',
  elite_damer: 'ELITSERIEN DAMER',
  bredare: 'DIVISION 1–3 / ALLSVENSKAN DAMER',
  sammandrag: 'SAMMANDRAG',
  kval: 'KVAL',
  sm: 'SM-SLUTSPEL',
  other: 'ÖVRIGA',
};

// The Swedish-league oil profiles, ready to pick from. Public-read table, so no auth
// needed; returns [] before it's seeded (the sheet then falls back to Husgärd + free entry).
export function useOilProfiles() {
  return useQuery({
    queryKey: ['oil-profiles'],
    staleTime: 60 * 60_000,
    queryFn: async (): Promise<OilProfile[]> => {
      const { data } = await db
        .from('oil_profiles')
        .select('name, length_ft, ratio, category, description')
        .order('length_ft', { ascending: true });
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        name: r.name as string,
        lengthFt: (r.length_ft as number | null) ?? null,
        ratio: (r.ratio as number | null) ?? null,
        category: (r.category as string | null) ?? null,
        description: (r.description as string | null) ?? null,
      }));
    },
  });
}

// The oil pattern the player logged for this match, if any.
export function useMatchPattern(matchId: number | null | undefined) {
  const { session } = useAuth();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ['match-pattern', uid, matchId],
    enabled: !!uid && matchId != null,
    queryFn: async (): Promise<string | null> => {
      const { data } = await db
        .from('match_prep')
        .select('oil_pattern')
        .eq('user_id', uid!)
        .eq('bits_match_id', matchId!)
        .maybeSingle();
      return ((data as Record<string, unknown> | null)?.oil_pattern as string | null) ?? null;
    },
  });
}

export function useSetMatchPattern() {
  const { session } = useAuth();
  const uid = session?.user?.id;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { matchId: number; pattern: string | null; hall: string | null }) => {
      const { error } = await db
        .from('match_prep')
        .upsert(
          { user_id: uid, bits_match_id: v.matchId, oil_pattern: v.pattern, hall_name: v.hall, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,bits_match_id' },
        );
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['match-pattern', uid, v.matchId] });
      qc.invalidateQueries({ queryKey: ['pattern-history', uid] });
    },
  });
}

export type PatternHistory = { balls: MatchBall[]; notes: Note[] };

// Everything I learned on this oil pattern at OTHER matches — the cross-center
// recall. Distinct balls thrown + the most recent notes, from any hall.
export function usePatternHistory(pattern: string | null | undefined, excludeMatchId: number) {
  const { session } = useAuth();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ['pattern-history', uid, pattern, excludeMatchId],
    enabled: !!uid && !!pattern,
    queryFn: async (): Promise<PatternHistory> => {
      const { data: preps } = await db
        .from('match_prep')
        .select('bits_match_id')
        .eq('user_id', uid!)
        .eq('oil_pattern', pattern!)
        .neq('bits_match_id', excludeMatchId);
      const ids = ((preps ?? []) as Record<string, unknown>[]).map((p) => p.bits_match_id as number);
      if (ids.length === 0) return { balls: [], notes: [] };

      const [ballsRes, notesRes] = await Promise.all([
        db.from('match_balls').select(BALL_JOIN).eq('user_id', uid!).in('bits_match_id', ids),
        db
          .from('player_notes')
          .select('id, bits_match_id, hall_name, body, created_at')
          .eq('user_id', uid!)
          .in('bits_match_id', ids)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const rawBalls = ((ballsRes.data ?? []) as unknown as Record<string, unknown>[]).map(mapMatchBall);
      const seen = new Set<string>();
      const balls = rawBalls.filter((b) => (seen.has(b.playerBallId) ? false : (seen.add(b.playerBallId), true)));
      const notes = ((notesRes.data ?? []) as Record<string, unknown>[]).map(mapNote);
      return { balls, notes };
    },
  });
}

export function useDeleteNote() {
  const { session } = useAuth();
  const uid = session?.user?.id;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('player_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match-notes', uid] });
      qc.invalidateQueries({ queryKey: ['hall-notes', uid] });
    },
  });
}
