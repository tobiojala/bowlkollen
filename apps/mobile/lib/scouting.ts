import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { useAuth } from '@/lib/auth';
import { useMyClaim } from '@/lib/me';
import { STALE } from '@/lib/query';
import { supabase } from '@/lib/supabase';

export type ScoutTag = 'bogey' | 'favorit' | 'even';
export type ScoutOpponent = {
  publicId: string | null;
  name: string;
  myWins: number;
  myLosses: number;
  ties: number;
  meetings: number;
  recent: ScoutForm[];   // last 5, recent-first
  tag: ScoutTag;
};
export type ScoutForm = 'V' | 'F' | 'O';
export type Scouting = {
  opponentTeamId: number;
  opponentName: string;
  opponents: ScoutOpponent[];
  leadCount: number;   // opponents faced whom the viewer leads
  total: number;
};

type MatchTeams = { homeTeamId: number | null; awayTeamId: number | null; homeName: string; awayName: string };
type RpcRow = { opp_public_id: string | null; opp_name: string; my_wins: number; my_losses: number; ties: number; meetings: number; recent: number[] | null };

const toForm = (n: number): ScoutForm => (n === 1 ? 'V' : n === -1 ? 'F' : 'O');
const rank = (o: ScoutOpponent) => (o.tag === 'bogey' ? 0 : o.tag === 'even' ? 1 : 2); // threats first

async function myTeamIds(uid: string): Promise<number[]> {
  const { data: claims } = await supabase
    .from('team_claims').select('bits_team_id').eq('user_id', uid).eq('status', 'verified');
  let ids = (claims ?? []).map((c) => c.bits_team_id as number);
  if (!ids.length) {
    const { data: follows } = await supabase
      .from('follows').select('entity_id').eq('user_id', uid).eq('entity_type', 'team');
    ids = (follows ?? []).map((f) => Number(f.entity_id)).filter((n) => n > 0);
  }
  return ids;
}

// The viewer's career head-to-head vs the opponent's roster for a given match.
// null unless the viewer is a claimed player AND one of the two teams is theirs.
export function usePlayerScouting(match: MatchTeams | null) {
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: claim } = useMyClaim();
  const publicId = claim?.status === 'verified' ? claim.publicId : undefined;
  const home = match?.homeTeamId ?? null;
  const away = match?.awayTeamId ?? null;

  return useQuery({
    queryKey: ['player-scouting', publicId, home, away],
    enabled: !!uid && !!publicId && !!home && !!away,
    staleTime: STALE.LONG,
    queryFn: async (): Promise<Scouting | null> => {
      const teamIds = await myTeamIds(uid!);
      const opponentTeamId = teamIds.includes(home!) ? away : teamIds.includes(away!) ? home : null;
      if (!opponentTeamId) return null;
      const opponentName = opponentTeamId === home ? match!.homeName : match!.awayName;

      const db = supabase as unknown as SupabaseClient;
      const { data, error } = await db.rpc('get_player_scouting', { p_public_id: publicId, p_opponent_team_id: opponentTeamId });
      if (error) throw error;

      const opponents: ScoutOpponent[] = ((data ?? []) as RpcRow[]).map((r) => ({
        publicId: r.opp_public_id,
        name: r.opp_name,
        myWins: r.my_wins,
        myLosses: r.my_losses,
        ties: r.ties,
        meetings: r.meetings,
        recent: (r.recent ?? []).map(toForm),
        tag: (r.my_wins > r.my_losses ? 'favorit' : r.my_wins < r.my_losses ? 'bogey' : 'even') as ScoutTag,
      }));
      opponents.sort((a, b) => rank(a) - rank(b) || b.meetings - a.meetings);

      return {
        opponentTeamId,
        opponentName,
        opponents,
        leadCount: opponents.filter((o) => o.myWins > o.myLosses).length,
        total: opponents.length,
      };
    },
  });
}

// The opponent team's last five results (from their side): V/F/O, recent-first.
export function useTeamForm(teamId: number | null | undefined) {
  return useQuery({
    queryKey: ['team-form', teamId],
    enabled: !!teamId,
    staleTime: STALE.MEDIUM,
    queryFn: async (): Promise<ScoutForm[]> => {
      const { data } = await supabase
        .from('bits_matches')
        .select('home_bits_team_id, away_bits_team_id, home_result, away_result, match_date')
        .or(`home_bits_team_id.eq.${teamId},away_bits_team_id.eq.${teamId}`)
        .eq('is_finished', true)
        .order('match_date', { ascending: false })
        .limit(5);
      return (data ?? []).map((m) => {
        const home = m.home_bits_team_id === teamId;
        const mine = home ? m.home_result : m.away_result;
        const opp = home ? m.away_result : m.home_result;
        if (mine == null || opp == null) return 'O';
        return mine > opp ? 'V' : mine < opp ? 'F' : 'O';
      });
    },
  });
}
