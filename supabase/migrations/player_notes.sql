-- The player's private bowling diary. Notes are keyed to a center (hall_name) so
-- they resurface the next time the player is booked to play there, and optionally
-- to the specific match they were written for. Columns for oil_pattern and (later)
-- ball links are here now so the schema doesn't need to churn as the diary grows.
--
-- PRIVATE BY DEFAULT: RLS scopes every row to its owner. No one else can read a
-- player's notes. Any future community aggregate must be a separate, opt-in,
-- anonymized pathway — never a relaxation of these policies.

create table if not exists public.player_notes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  bits_match_id bigint,       -- the match it was written for; null = general note about the center
  hall_name     text,         -- the center — how a note is recalled next time you play here
  oil_pattern   text,         -- future: recall by oil pattern, not just venue
  body          text not null check (char_length(body) between 1 and 4000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists player_notes_user_hall_idx on public.player_notes (user_id, hall_name);
create index if not exists player_notes_user_match_idx on public.player_notes (user_id, bits_match_id);

alter table public.player_notes enable row level security;

-- Own rows only — read, write, update, delete all gated on the caller being the owner.
drop policy if exists "player_notes_own" on public.player_notes;
create policy "player_notes_own" on public.player_notes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at honest.
create or replace function public.touch_player_notes()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists player_notes_touch on public.player_notes;
create trigger player_notes_touch
  before update on public.player_notes
  for each row execute function public.touch_player_notes();
