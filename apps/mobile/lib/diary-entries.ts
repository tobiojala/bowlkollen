import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Game } from '@bowlkollen/core';
export type { Game };

// The diary data model — split out of diary.ts to keep that file within budget.
// player_notes isn't in the generated types (run supabase/migrations/player_notes.sql).
const db = supabase as unknown as SupabaseClient;

export type DiaryType = 'traning' | 'tavling' | 'match' | 'ovrigt';
export type Note = {
  id: string; matchId: number | null; hall: string | null; body: string; createdAt: string;
  entryType: DiaryType | null; entryDate: string | null; games: Game[] | null;
  oilPattern: string | null; ballIds: string[];
};

export const mapNote = (r: Record<string, unknown>): Note => ({
  id: r.id as string,
  matchId: (r.bits_match_id as number | null) ?? null,
  hall: (r.hall_name as string | null) ?? null,
  body: r.body as string,
  createdAt: r.created_at as string,
  entryType: (r.entry_type as DiaryType | null) ?? null,
  entryDate: (r.entry_date as string | null) ?? null,
  games: (r.games as Game[] | null) ?? null,
  oilPattern: (r.oil_pattern as string | null) ?? null,
  ballIds: (r.ball_ids as string[] | null) ?? [],
});
export const noteDate = (n: Note): string => n.entryDate ?? n.createdAt.slice(0, 10);
export const noteType = (n: Note): DiaryType => n.entryType ?? (n.matchId != null ? 'match' : 'ovrigt');
export const entrySeries = (n: Note): number[] => (n.games ?? []).map((g) => g.total);
export const entryTotal = (n: Note): number => entrySeries(n).reduce((a, b) => a + b, 0);
export const entryAvg = (n: Note): number | null => { const s = entrySeries(n); return s.length ? Math.round(entryTotal(n) / s.length) : null; };

export const NOTE_COLS = 'id, bits_match_id, hall_name, body, created_at, entry_type, entry_date, games, oil_pattern, ball_ids';

// The whole diary — every entry newest-first: match-prep notes + standalone entries.
export function useDiaryEntries() {
  const { session } = useAuth();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ['diary-entries', uid],
    enabled: !!uid,
    queryFn: async (): Promise<Note[]> => {
      const { data } = await db.from('player_notes').select(NOTE_COLS).eq('user_id', uid!);
      return ((data ?? []) as Record<string, unknown>[]).map(mapNote).sort((a, b) => noteDate(b).localeCompare(noteDate(a)));
    },
  });
}

// Add a standalone diary entry (training / competition outside league) — bits_match_id stays null.
export function useSaveDiaryEntry() {
  const { session } = useAuth();
  const uid = session?.user?.id;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { body: string; hall: string | null; type: DiaryType; date: string; games?: Game[]; oilPattern?: string | null; ballIds?: string[] }) => {
      const { error } = await db.from('player_notes').insert({ user_id: uid, bits_match_id: null, hall_name: input.hall, body: input.body.trim(), entry_type: input.type, entry_date: input.date, games: input.games?.length ? input.games : null, oil_pattern: input.oilPattern?.trim() || null, ball_ids: input.ballIds?.length ? input.ballIds : null });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['diary-entries', uid] });
      qc.invalidateQueries({ queryKey: ['hall-notes', uid, v.hall] });
    },
  });
}
