import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

// redeem_team_invite isn't in the generated types (run team_invite_redemption.sql).
const db = supabase as unknown as SupabaseClient;

export type RedeemResult = { teamId: number; role: 'player' | 'captain' };

// Shareable universal link for an invite code. Opens the app (once association files
// are hosted on the domain); otherwise falls back to the web. Domain: confirm.
export const INVITE_LINK_BASE = 'https://bowlkollen.se/invite';
export const inviteLink = (code: string) => `${INVITE_LINK_BASE}?code=${encodeURIComponent(code)}`;

// Map the RPC's raised exceptions to something a bowler can read.
const MESSAGES: Record<string, string> = {
  invalid_code: 'Koden gäller inte (eller har dragits tillbaka).',
  code_exhausted: 'Koden är redan använd.',
  not_authenticated: 'Du måste vara inloggad.',
};

export function messageForRedeemError(err: unknown): string {
  const raw = (err as { message?: string })?.message ?? '';
  for (const key of Object.keys(MESSAGES)) if (raw.includes(key)) return MESSAGES[key];
  return 'Något gick fel. Kontrollera koden och försök igen.';
}

// Redeem a team invite → become a verified member (or captain) of the code's team.
export function useRedeemInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<RedeemResult> => {
      const { data, error } = await db.rpc('redeem_team_invite', { p_code: code.trim() });
      if (error) throw error;
      const r = data as { bits_team_id: number; role: 'player' | 'captain' };
      return { teamId: r.bits_team_id, role: r.role };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-team-role'] });
      qc.invalidateQueries({ queryKey: ['my-teams'] });
    },
  });
}
