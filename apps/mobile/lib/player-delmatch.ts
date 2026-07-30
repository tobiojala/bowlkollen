import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { computePlayerDelmatchRecord, type DelmatchRow, type PlayerDelmatchRecord } from '@/lib/delmatch';
import { STALE } from '@/lib/query';
import { supabase } from '@/lib/supabase';

type RawCell = {
  bits_match_id: number;
  match_date: string | null;
  serie: number;
  table_no: number;
  is_home_team: boolean;
  player_order: number;
  public_id: string | null;
  player_name: string;
  score: number;
};

// A player's whole delmatch (bord) career — duel record, rivalries, partnerships,
// milestones. The RPC returns the raw cell rows; the tested pure engine aggregates.
export function usePlayerDelmatchRecord(publicId: string) {
  return useQuery({
    queryKey: ['player-delmatch', publicId],
    staleTime: STALE.LONG, // historical, essentially static
    queryFn: async (): Promise<PlayerDelmatchRecord> => {
      // get_player_delmatch isn't in the generated types yet — cast (see AGENTS.md).
      const db = supabase as unknown as SupabaseClient;
      const { data, error } = await db.rpc('get_player_delmatch', { p_public_id: publicId });
      if (error) throw error;
      const rows: DelmatchRow[] = ((data ?? []) as RawCell[]).map((r) => ({
        matchId: r.bits_match_id,
        date: r.match_date,
        serie: r.serie,
        tableNo: r.table_no,
        order: r.player_order,
        isHomeTeam: r.is_home_team,
        publicId: r.public_id,
        playerName: r.player_name,
        score: r.score,
      }));
      return computePlayerDelmatchRecord(rows, publicId);
    },
  });
}
