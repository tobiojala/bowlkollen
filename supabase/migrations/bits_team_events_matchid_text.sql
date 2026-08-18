-- Auto-Story Engine → BITS, fix #2: let team_events.match_id hold a bits_match_id.
--
-- The BITS story engine writes match_id = String(bits_match_id) (e.g. "3290233").
-- But match_id was `uuid REFERENCES matches(id)` (legacy model), so every BITS
-- insert failed with `invalid input syntax for type uuid: "3290233" (22P02)` —
-- silently, because the sync swallowed the insert error. Result: events were
-- counted but never written, so the home feed showed nothing for followed teams.
--
-- Fix: drop the legacy FK (bits ids reference bits_matches, not matches) and
-- widen match_id to text. Legacy uuid values cast cleanly to text, and
-- FeedCard already routes by bits_team_id (/matcher/:id vs /matches/:id), so
-- both id shapes coexist. Additive + safe; legacy rows keep working.
alter table public.team_events drop constraint if exists team_events_match_id_fkey;
alter table public.team_events alter column match_id type text using match_id::text;

-- Idempotent re-assert (in case the earlier migration's half didn't take).
alter table public.team_events alter column team_id drop not null;
