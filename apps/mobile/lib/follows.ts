import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type FollowEntityType = 'player' | 'team';

// Whether the current user follows a given entity (for follow-button state).
export function useIsFollowing(entityType: FollowEntityType, entityId: string) {
  return useQuery({
    queryKey: ['is-following', entityType, entityId],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return false;
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .maybeSingle();
      return !!data;
    },
  });
}

// Public follower count for an entity (Instagram-style) via the count-only RPC.
export function useFollowCount(entityType: FollowEntityType, entityId: string) {
  return useQuery({
    queryKey: ['follow-count', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_follow_count', {
        p_entity_type: entityType,
        p_entity_id: entityId,
      });
      if (error) throw error;
      return data ?? 0;
    },
  });
}

// How many entities the current user follows (own rows — readable via RLS).
export function useMyFollowCount() {
  return useQuery({
    queryKey: ['my-follow-count'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return 0;
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      return count ?? 0;
    },
  });
}

// Toggle a follow (mirrors the web useToggleFollow): insert if absent, delete if
// present. Team follows use String(bits_team_id) as entity_id (the bits-id bridge).
export function useToggleFollow(entityType: FollowEntityType, entityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('not_authenticated');
      const uid = session.user.id;

      const { data: existing } = await supabase
        .from('follows')
        .select('id')
        .eq('user_id', uid)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .maybeSingle();

      if (existing) {
        await supabase.from('follows').delete().eq('id', existing.id);
        return false;
      }
      await supabase
        .from('follows')
        .insert({ user_id: uid, entity_type: entityType, entity_id: entityId });
      return true;
    },
    onSuccess: () =>
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey[0];
          return (
            k === 'follows' ||
            k === 'is-following' ||
            k === 'follow-count' ||
            k === 'my-follow-count'
          );
        },
      }),
  });
}
