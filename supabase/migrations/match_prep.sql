-- Match-level prep meta the player records for a fixture — today just the oil
-- pattern (the lane condition that day). One row per (user, match). Keeping the
-- pattern here (not on each note/ball) makes it the single source of truth, so we
-- can recall "what worked on this pattern" across ANY center, not just this hall.
--
-- PRIVATE, RLS own-rows.

create table if not exists public.match_prep (
  user_id       uuid not null references auth.users(id) on delete cascade,
  bits_match_id bigint not null,
  oil_pattern   text,
  hall_name     text,
  updated_at    timestamptz not null default now(),
  primary key (user_id, bits_match_id)
);

create index if not exists match_prep_user_pattern_idx on public.match_prep (user_id, oil_pattern);

alter table public.match_prep enable row level security;
drop policy if exists "match_prep_own" on public.match_prep;
create policy "match_prep_own" on public.match_prep
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
