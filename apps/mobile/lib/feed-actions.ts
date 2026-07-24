// Lightweight in-memory store for like/save state, keyed by a post key. Survives
// FlatList card recycling within a session (cards read it on mount). It is NOT
// persisted across app restarts or devices — that needs a backend table
// (post_likes / post_saves) which is the next step to make likes real + counted.
const liked = new Set<string>();
const saved = new Set<string>();

export const isLiked = (key: string) => liked.has(key);
export const isSaved = (key: string) => saved.has(key);

export function toggleLike(key: string): boolean {
  if (liked.has(key)) liked.delete(key);
  else liked.add(key);
  return liked.has(key);
}

export function toggleSave(key: string): boolean {
  if (saved.has(key)) saved.delete(key);
  else saved.add(key);
  return saved.has(key);
}
