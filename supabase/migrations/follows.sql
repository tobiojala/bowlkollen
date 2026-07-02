-- follows: one row per (user, entity).
-- entity_type: 'player' | 'team'
-- entity_id:   the player.id or team.id (text, matches existing PKs)

create table if not exists public.follows (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('player', 'team')),
  entity_id   text not null,
  created_at  timestamptz not null default now(),

  unique (user_id, entity_type, entity_id)
);

-- Index for "give me all follows for this user"
create index if not exists follows_user_idx on public.follows (user_id);

-- Index for "how many followers does this entity have"
create index if not exists follows_entity_idx on public.follows (entity_type, entity_id);

-- RLS
alter table public.follows enable row level security;

-- Users can read their own follows (client-side join queries)
create policy "follows: read own"
  on public.follows for select
  using (auth.uid() = user_id);

-- Users can follow
create policy "follows: insert own"
  on public.follows for insert
  with check (auth.uid() = user_id);

-- Users can unfollow
create policy "follows: delete own"
  on public.follows for delete
  using (auth.uid() = user_id);

-- Aggregate view: follower counts per entity (readable by all)
create or replace view public.follow_counts as
  select entity_type, entity_id, count(*) as follower_count
  from public.follows
  group by entity_type, entity_id;
