import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// team_posts RPCs aren't in the generated types (run supabase/migrations/team_posts.sql).
const db = supabase as unknown as SupabaseClient;

export const POST_MAX = 4000; // ~500 words

export type PollOption = { id: string; label: string; votes: number; mine: boolean };
export type TeamPost = {
  id: string;
  kind: 'message' | 'poll';
  title: string | null;
  body: string;
  createdAt: string;
  authorName: string;
  isMine: boolean;
  options: PollOption[];
};

export function useTeamPosts(teamId: number) {
  return useQuery({
    queryKey: ['team-posts', teamId],
    enabled: teamId > 0,
    queryFn: async (): Promise<TeamPost[]> => {
      const { data, error } = await db.rpc('get_team_posts', { p_bits_team_id: teamId });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        kind: ((r.kind as string | null) ?? 'message') as 'message' | 'poll',
        title: (r.title as string | null) ?? null,
        body: r.body as string,
        createdAt: r.created_at as string,
        authorName: (r.author_name as string | null) ?? 'Lagledning',
        isMine: (r.is_mine as boolean | null) ?? false,
        options: ((r.options as PollOption[] | null) ?? []),
      }));
    },
  });
}

export function useCreateTeamPost(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { title: string; body: string }) => {
      const { error } = await db.rpc('create_team_post', {
        p_bits_team_id: teamId,
        p_title: v.title,
        p_body: v.body,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-posts', teamId] }),
  });
}

export function useCreateTeamPoll(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { title: string; body: string; options: string[] }) => {
      const { error } = await db.rpc('create_team_poll', {
        p_bits_team_id: teamId,
        p_title: v.title,
        p_body: v.body,
        p_options: v.options.map((o) => o.trim()).filter(Boolean),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-posts', teamId] }),
  });
}

export function useVotePost(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { postId: string; optionId: string }) => {
      const { error } = await db.rpc('vote_team_post', { p_post_id: v.postId, p_option_id: v.optionId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-posts', teamId] }),
  });
}

// Mark the board read (clears the unread badge for this team).
export function useMarkPostsSeen(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await db.rpc('mark_team_posts_seen', { p_bits_team_id: teamId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-unread-posts'] }),
  });
}

// Per-team unread counts → the badge on Profil / Mitt lag.
export function useMyUnread() {
  const { session } = useAuth();
  const uid = session?.user?.id;
  return useQuery({
    queryKey: ['my-unread-posts', uid],
    enabled: !!uid,
    queryFn: async (): Promise<Map<number, number>> => {
      const { data, error } = await db.rpc('get_my_unread_posts');
      if (error) throw error;
      const map = new Map<number, number>();
      for (const r of (data ?? []) as Record<string, unknown>[]) {
        map.set(r.bits_team_id as number, (r.unread as number) ?? 0);
      }
      return map;
    },
  });
}
