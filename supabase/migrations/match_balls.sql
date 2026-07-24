-- "What I threw here" — the balls a player used at a given match. Closes the diary
-- loop: keyed by hall_name too, so next time you're booked at the same center the
-- prep sheet can recall not just your notes but the balls that worked.
--
-- PRIVATE, RLS own-rows. References the player's own bag entry; retiring a ball
-- (in_bag=false) keeps the history, only a hard delete removes it.

create table if not exists public.match_balls (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  bits_match_id  bigint not null,
  player_ball_id uuid not null references public.player_balls(id) on delete cascade,
  hall_name      text,               -- denormalised: the center, for cross-visit recall
  created_at     timestamptz not null default now(),
  unique (user_id, bits_match_id, player_ball_id)
);

create index if not exists match_balls_user_match_idx on public.match_balls (user_id, bits_match_id);
create index if not exists match_balls_user_hall_idx  on public.match_balls (user_id, hall_name);

alter table public.match_balls enable row level security;
drop policy if exists "match_balls_own" on public.match_balls;
create policy "match_balls_own" on public.match_balls
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
