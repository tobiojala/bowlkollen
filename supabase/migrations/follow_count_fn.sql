-- Public follower counts (Instagram-style) without exposing who follows whom.
--
-- The `follows` table RLS is private (users read only their own rows), and the
-- old follow_counts view was dropped in the security cleanup. This aggregate-only
-- SECURITY DEFINER function returns just a count for an entity — safe to expose
-- to everyone (no row data leaks), unlike a definer view over the whole table.

create or replace function public.get_follow_count(p_entity_type text, p_entity_id text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.follows
  where entity_type = p_entity_type and entity_id = p_entity_id;
$$;

revoke execute on function public.get_follow_count(text, text) from public;
grant execute on function public.get_follow_count(text, text) to anon, authenticated;
