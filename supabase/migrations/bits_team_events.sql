-- Auto-Story Engine → BITS. Attach team_events to bits_teams so the story engine
-- can run on the live BITS data model (bits_matches / bits_match_scores) instead
-- of the deprecated legacy matches/teams tables.
--
-- Additive + safe: legacy team_id events keep working untouched; new BITS events
-- set bits_team_id (team_id null). team_id becomes nullable to allow that.
alter table public.team_events add column if not exists bits_team_id integer;
alter table public.team_events alter column team_id drop not null;
create index if not exists team_events_bits_team_idx on public.team_events (bits_team_id, event_date desc);

-- Feed reads team_events for followed teams; events are public feed content.
-- Ensure a public read path for bits-keyed events (write stays service-role only).
drop policy if exists team_events_read_bits on public.team_events;
create policy team_events_read_bits on public.team_events
  for select using (bits_team_id is not null and is_hidden = false);
