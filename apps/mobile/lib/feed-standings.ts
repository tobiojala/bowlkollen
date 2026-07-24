import { computeStandings } from '@bowlkollen/core';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

const CURRENT_SEASON = 2026;
const PREVIOUS_SEASON = 2025;
const FEATURED = '%Elitserien%'; // the marquee divisions to snapshot in the feed
const STANDING_COLS =
  'bits_match_id, home_bits_team_id, away_bits_team_id, home_team_name, away_team_name, home_result, away_result, is_finished, match_date, round_id, hall_name';

export type FeedStanding = {
  divisionId: number;
  division: string;
  historical: boolean;
  rows: { teamId: number; teamName: string; points: number; played: number }[];
};

async function seasonMatches(divisionId: number, season: number) {
  const { data } = await supabase
    .from('bits_matches')
    .select(STANDING_COLS)
    .eq('bits_division_id', divisionId)
    .eq('season_id', season);
  return data ?? [];
}

// Top-4 snapshot for the featured (Elitserien) divisions, with the same
// pre-season fallback as the division page. Drives the feed's TABELL cards.
export function useFeedStandings() {
  return useQuery({
    queryKey: ['feed-standings'],
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<FeedStanding[]> => {
      const { data: divs } = await supabase
        .from('bits_divisions')
        .select('bits_division_id, name')
        .eq('season_id', CURRENT_SEASON)
        .ilike('name', FEATURED)
        .limit(2);

      const out: FeedStanding[] = [];
      for (const d of divs ?? []) {
        let matches = await seasonMatches(d.bits_division_id, CURRENT_SEASON);
        let historical = false;
        if (!matches.some((m) => m.is_finished)) {
          const prev = await seasonMatches(d.bits_division_id, PREVIOUS_SEASON);
          if (prev.some((m) => m.is_finished)) {
            matches = prev;
            historical = true;
          }
        }
        const table = computeStandings(matches);
        if (table.length === 0) continue;
        out.push({
          divisionId: d.bits_division_id,
          division: d.name,
          historical,
          rows: table.slice(0, 4).map((s) => ({ teamId: s.teamId, teamName: s.teamName, points: s.points, played: s.played })),
        });
      }
      return out;
    },
  });
}
