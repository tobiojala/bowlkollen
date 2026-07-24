-- The player's ball arsenal (bowling diary, Phase 2). Two tables:
--
--   bowling_balls  — our OWN reference catalog of ball models. Facts only (brand,
--                    model, specs), so it's ours to compile — like bits_* is ours.
--                    NOT a mirror of any third-party database. image_url is filled
--                    only from sources we have rights to (manufacturer media, a
--                    licence, or a partnership feed); null until then, and the app
--                    renders a generated ball visual in the meantime.
--
--   player_balls   — which balls a user has in their bag, plus the per-player facts
--                    a catalog can't hold (weight drilled, current surface, layout,
--                    personal notes). PRIVATE, RLS own-rows.

-- ---------------------------------------------------------------- reference catalog
create table if not exists public.bowling_balls (
  id            uuid primary key default gen_random_uuid(),
  brand         text not null,
  name          text not null,
  coverstock    text,
  core          text,
  rg            numeric(4,2),   -- radius of gyration
  differential  numeric(4,3),
  release_year  int,
  image_url     text,           -- only ever a source we have rights to; null → generated visual
  created_at    timestamptz not null default now(),
  unique (brand, name)
);

-- Reference data: readable by everyone, writable only server-side (seed/admin).
alter table public.bowling_balls enable row level security;
drop policy if exists "bowling_balls_read" on public.bowling_balls;
create policy "bowling_balls_read" on public.bowling_balls for select using (true);
grant select on public.bowling_balls to anon, authenticated;

-- ------------------------------------------------------------------- the user's bag
create table if not exists public.player_balls (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  ball_id      uuid references public.bowling_balls(id) on delete set null, -- null = free-entry
  custom_name  text,          -- used when the ball isn't in the catalog yet
  brand        text,          -- denormalised for free-entry balls / display
  weight       int check (weight is null or weight between 6 and 16), -- lbs
  surface      text,          -- current surface/grit (players re-surface)
  layout       text,
  notes        text check (notes is null or char_length(notes) <= 2000),
  in_bag       boolean not null default true,   -- false = retired from the bag
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- a ball must be identifiable: either a catalog ball or a free-entry name
  constraint player_balls_identified check (ball_id is not null or custom_name is not null)
);

create index if not exists player_balls_user_idx on public.player_balls (user_id, in_bag, sort_order);

alter table public.player_balls enable row level security;
drop policy if exists "player_balls_own" on public.player_balls;
create policy "player_balls_own" on public.player_balls
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists player_balls_touch on public.player_balls;
create trigger player_balls_touch
  before update on public.player_balls
  for each row execute function public.touch_updated_at();
