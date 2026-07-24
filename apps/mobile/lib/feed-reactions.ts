import type { SupabaseClient } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { supabase } from '@/lib/supabase';

// feed_reactions + get_feed_reactions aren't in the generated types yet (run
// supabase/migrations/feed_reactions.sql) — reach them through an untyped view.
const db = supabase as unknown as SupabaseClient;

type ReactionRow = { post_key: string; likes: number; liked: boolean; saved: boolean };

export type ReactionState = { likes: number; liked: boolean; saved: boolean };
export type ReactionMap = Map<string, ReactionState>;

const EMPTY: ReactionState = { likes: 0, liked: false, saved: false };
const KEY = 'feed-reactions';

// Batch like-count + the caller's liked/saved for the feed's post keys, in one
// RPC. Real, persisted, counted.
export function useFeedReactions(postKeys: string[]) {
  return useQuery({
    queryKey: [KEY, postKeys.join('|')],
    enabled: postKeys.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<ReactionMap> => {
      const { data, error } = await db.rpc('get_feed_reactions', { p_post_keys: postKeys });
      if (error) throw error;
      const map: ReactionMap = new Map();
      for (const r of (data ?? []) as ReactionRow[]) {
        map.set(r.post_key, { likes: Number(r.likes), liked: r.liked, saved: r.saved });
      }
      return map;
    },
  });
}

// Optimistic like/save. Updates every active reactions cache immediately, then
// writes to the DB (reverting on failure).
export function useReactionActions() {
  const qc = useQueryClient();

  const patch = useCallback(
    (key: string, fn: (s: ReactionState) => ReactionState) => {
      qc.setQueriesData<ReactionMap>({ queryKey: [KEY] }, (old) => {
        if (!(old instanceof Map)) return old;
        const next = new Map(old);
        next.set(key, fn(next.get(key) ?? EMPTY));
        return next;
      });
    },
    [qc],
  );

  const toggleLike = useCallback(
    (key: string, currentlyLiked: boolean) => {
      patch(key, (s) => ({ ...s, liked: !currentlyLiked, likes: Math.max(0, s.likes + (currentlyLiked ? -1 : 1)) }));
      const op = currentlyLiked
        ? db.from('feed_reactions').delete().eq('post_key', key).eq('reaction', 'like')
        : db.from('feed_reactions').insert({ post_key: key, reaction: 'like' });
      Promise.resolve(op).then(({ error }) => {
        if (error) patch(key, (s) => ({ ...s, liked: currentlyLiked, likes: Math.max(0, s.likes + (currentlyLiked ? 1 : -1)) }));
      });
    },
    [patch],
  );

  const toggleSave = useCallback(
    (key: string, currentlySaved: boolean) => {
      patch(key, (s) => ({ ...s, saved: !currentlySaved }));
      const op = currentlySaved
        ? db.from('feed_reactions').delete().eq('post_key', key).eq('reaction', 'save')
        : db.from('feed_reactions').insert({ post_key: key, reaction: 'save' });
      Promise.resolve(op).then(({ error }) => {
        if (error) patch(key, (s) => ({ ...s, saved: currentlySaved }));
      });
    },
    [patch],
  );

  return { toggleLike, toggleSave };
}
