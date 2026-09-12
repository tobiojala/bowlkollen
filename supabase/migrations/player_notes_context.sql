-- Mina spel / loggbok context: a log entry can now carry the oil pattern it was
-- played on and the ball(s) used, alongside its scored games. Both nullable —
-- a plain note leaves them empty.
--   oil_pattern : free text or an oil_profiles.name
--   ball_ids    : jsonb array of player_balls.id (the bowler's own arsenal)
alter table public.player_notes
  add column if not exists oil_pattern text,
  add column if not exists ball_ids jsonb;
