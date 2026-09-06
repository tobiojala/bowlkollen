-- Logbook: a diary entry can now carry scored games (a practice / competition /
-- match session filled in on the scoreboard). games is a jsonb array of
--   { rolls: int[], total: int }
-- null for a plain note. The session total/average derive from it in the app.

alter table public.player_notes
  add column if not exists games jsonb;
