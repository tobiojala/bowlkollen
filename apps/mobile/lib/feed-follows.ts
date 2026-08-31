import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { FollowEntityType } from '@/lib/follows';

// Data hooks the home story rail needs: the user's follows (with names), and —
// crucially — their players' results + teams' matches carrying the BITS IDs that
// `get_user_season_matches` drops. These let the rail build one circle per follow
// and filter the feed to a tapped entity. Mirrors web's feed-players.ts.

const CURRENT_SEASON = 2026;

export type FollowItem = { type: FollowEntityType; id: string; name: string; sub: string | null };

export function useMyFollows() {
  return useQuery({
    queryKey: ['follows', 'detail'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { teams: [] as FollowItem[], players: [] as FollowItem[] };

      const { data: rows } = await supabase
        .from('follows').select('entity_type, entity_id').eq('user_id', session.user.id);

      const teamIds = (rows ?? []).filter((r) => r.entity_type === 'team').map((r) => Number(r.entity_id));
      const playerIds = (rows ?? []).filter((r) => r.entity_type === 'player').map((r) => r.entity_id);

      const [teamsRes, playersRes] = await Promise.all([
        teamIds.length
          ? supabase.from('bits_teams').select('bits_team_id, name, club_name').in('bits_team_id', teamIds)
          : Promise.resolve({ data: [] as { bits_team_id: number; name: string; club_name: string | null }[] }),
        playerIds.length
          ? supabase.from('bits_players').select('public_id, first_name, sur_name').in('public_id', playerIds)
          : Promise.resolve({ data: [] as { public_id: string; first_name: string | null; sur_name: string | null }[] }),
      ]);

      const teams: FollowItem[] = (teamsRes.data ?? []).map((t) => ({
        type: 'team', id: String(t.bits_team_id), name: t.name,
        sub: t.club_name && t.club_name !== t.name ? t.club_name : null,
      }));
      const players: FollowItem[] = (playersRes.data ?? []).map((p) => ({
        type: 'player', id: p.public_id,
        name: `${p.first_name ?? ''} ${p.sur_name ?? ''}`.trim(), sub: null,
      }));
      return { teams, players };
    },
  });
}

export type PlayerResult = {
  playerId: string; playerName: string; matchId: string; date: string;
  total: number; games: number[]; division: string; opponent: string;
};

type ResultRow = { bits_match_id: number; lic_nbr: string; player_name: string; is_home_team: boolean; series: number[]; total_result: number };
type MatchRow = { bits_match_id: number; division_name: string | null; home_team_name: string; away_team_name: string; match_date: string };

export function useFollowedPlayerResults(publicIds: string[]) {
  const ids = [...publicIds].sort();
  return useQuery({
    queryKey: ['feed', 'followed-players', ids.join(',')],
    enabled: ids.length > 0,
    staleTime: 30_000,
    queryFn: async (): Promise<PlayerResult[]> => {
      const { data: players } = await supabase.from('bits_players').select('public_id,lic_nbr').in('public_id', ids);
      const licToPub = new Map<string, string>();
      for (const p of (players ?? []) as { public_id: string; lic_nbr: string }[]) licToPub.set(p.lic_nbr, p.public_id);
      const lics = [...licToPub.keys()];
      if (lics.length === 0) return [];

      const { data: results } = await supabase.from('bits_match_player_results')
        .select('bits_match_id,lic_nbr,player_name,is_home_team,series,total_result').in('lic_nbr', lics).limit(200);
      if (!results?.length) return [];

      const matchIds = [...new Set((results as ResultRow[]).map((r) => r.bits_match_id))];
      const { data: matches } = await supabase.from('bits_matches')
        .select('bits_match_id,division_name,home_team_name,away_team_name,match_date,is_finished')
        .in('bits_match_id', matchIds).eq('is_finished', true);
      const mMap = new Map((matches as MatchRow[] ?? []).map((m) => [m.bits_match_id, m]));

      const items: PlayerResult[] = [];
      for (const r of results as ResultRow[]) {
        const m = mMap.get(r.bits_match_id);
        const pub = licToPub.get(r.lic_nbr);
        if (!m || !pub || !(r.total_result > 0 && r.total_result <= 1200)) continue;
        items.push({
          playerId: pub, playerName: r.player_name, matchId: String(r.bits_match_id), date: m.match_date,
          total: r.total_result, games: r.series ?? [], division: m.division_name ?? '',
          opponent: r.is_home_team ? m.away_team_name : m.home_team_name,
        });
      }
      return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40);
    },
  });
}

export type TeamMatch = {
  bitsMatchId: number; homeTeamId: number; awayTeamId: number; homeName: string; awayName: string;
  homeResult: number | null; awayResult: number | null; homeScore: number | null; awayScore: number | null;
  date: string; division: string; hall: string | null; isFinished: boolean;
};

type TeamMatchRow = {
  bits_match_id: number; home_bits_team_id: number; away_bits_team_id: number; home_team_name: string; away_team_name: string;
  home_result: number | null; away_result: number | null; home_score: number | null; away_score: number | null;
  match_date: string; division_name: string | null; hall_name: string | null; is_finished: boolean;
};

export function useFollowedMatches(teamIds: string[]) {
  const ids = [...teamIds].map(Number).filter((n) => n > 0).sort();
  return useQuery({
    queryKey: ['feed', 'followed-matches', ids.join(',')],
    enabled: ids.length > 0,
    staleTime: 30_000,
    queryFn: async (): Promise<TeamMatch[]> => {
      const inList = ids.join(',');
      const { data } = await supabase.from('bits_matches')
        .select('bits_match_id,home_bits_team_id,away_bits_team_id,home_team_name,away_team_name,home_result,away_result,home_score,away_score,match_date,division_name,hall_name,is_finished')
        .eq('season_id', CURRENT_SEASON)
        .or(`home_bits_team_id.in.(${inList}),away_bits_team_id.in.(${inList})`)
        .order('match_date', { ascending: false }).limit(60);
      return ((data ?? []) as TeamMatchRow[]).map((m) => ({
        bitsMatchId: m.bits_match_id, homeTeamId: m.home_bits_team_id, awayTeamId: m.away_bits_team_id,
        homeName: m.home_team_name, awayName: m.away_team_name, homeResult: m.home_result, awayResult: m.away_result,
        homeScore: m.home_score, awayScore: m.away_score,
        date: m.match_date, division: m.division_name ?? '', hall: m.hall_name ?? null, isFinished: m.is_finished,
      }));
    },
  });
}
