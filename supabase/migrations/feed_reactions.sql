-- Likes + saves for feed posts. Posts aren't DB rows (they're derived feed items
-- — a match, a top-series, later a promo), so we key by the feed item's stable
-- `post_key` (e.g. 'm3301602', 's3301602-Emma Halttunen'). One generic table
-- serves every card kind.

create table if not exists public.feed_reactions (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  post_key   text not null,
  reaction   text not null check (reaction in ('like', 'save')),
  created_at timestamptz not null default now(),
  primary key (user_id, post_key, reaction)
);

alter table public.feed_reactions enable row level security;

-- Each user only ever sees/creates/removes their OWN reactions (saves are
-- private; public like counts come from the SECURITY DEFINER function below).
drop policy if exists "feed_reactions own select" on public.feed_reactions;
create policy "feed_reactions own select" on public.feed_reactions
  for select using (auth.uid() = user_id);

drop policy if exists "feed_reactions own insert" on public.feed_reactions;
create policy "feed_reactions own insert" on public.feed_reactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "feed_reactions own delete" on public.feed_reactions;
create policy "feed_reactions own delete" on public.feed_reactions
  for delete using (auth.uid() = user_id);

create index if not exists feed_reactions_like_key_idx
  on public.feed_reactions (post_key) where reaction = 'like';

-- Per-post public like count + the caller's own liked/saved state, for a batch of
-- post keys. SECURITY DEFINER so it can aggregate likes across all users without
-- exposing who liked what; auth.uid() still resolves to the caller.
create or replace function public.get_feed_reactions(p_post_keys text[])
returns table (post_key text, likes bigint, liked boolean, saved boolean)
language sql
security definer
set search_path = public
as $$
  select
    k.post_key,
    coalesce(l.cnt, 0) as likes,
    exists (
      select 1 from public.feed_reactions r
      where r.post_key = k.post_key and r.reaction = 'like' and r.user_id = auth.uid()
    ) as liked,
    exists (
      select 1 from public.feed_reactions r
      where r.post_key = k.post_key and r.reaction = 'save' and r.user_id = auth.uid()
    ) as saved
  from unnest(p_post_keys) as k(post_key)
  left join (
    select post_key, count(*) as cnt
    from public.feed_reactions
    where reaction = 'like'
    group by post_key
  ) l on l.post_key = k.post_key;
$$;

grant execute on function public.get_feed_reactions(text[]) to authenticated, anon;
