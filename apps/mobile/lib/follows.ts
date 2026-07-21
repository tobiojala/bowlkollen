import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type FollowEntityType = 'player' | 'team';

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follows'] }),
  });
}
