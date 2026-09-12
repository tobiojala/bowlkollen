import { useQuery } from '@tanstack/react-query';

// Native polls the SAME server route as web (bowlkollen.se/api/live/[matchId]) —
// it fetches GetMatchScores server-side, so the app never touches BITS directly.
const WEB_BASE = 'https://bowlkollen.se';

export type LiveScores = {
  series: { teamA: number[]; teamB: number[] };
  players: { name: string; games: number[]; total: number; isHomeTeam: boolean }[];
  updatedAt: string;
};

export function useLiveMatch(matchId: number, enabled: boolean) {
  return useQuery<LiveScores>({
    queryKey: ['live-match', matchId],
    enabled,
    refetchInterval: enabled ? 45_000 : false,
    queryFn: async () => {
      const r = await fetch(`${WEB_BASE}/api/live/${matchId}`);
      if (!r.ok) throw new Error('live fetch failed');
      return r.json() as Promise<LiveScores>;
    },
  });
}
