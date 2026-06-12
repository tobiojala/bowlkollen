-- Player cheers on DNA helix
-- Fans tap a player node → cheer lasts 24h. Upsert refreshes the window.

CREATE TABLE IF NOT EXISTS player_cheers (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id    uuid        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id      uuid        NOT NULL REFERENCES teams(id)   ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, user_id)
);

ALTER TABLE player_cheers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'player_cheers' AND policyname = 'public read cheers'
  ) THEN
    CREATE POLICY "public read cheers"
      ON player_cheers FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'player_cheers' AND policyname = 'auth write cheers'
  ) THEN
    CREATE POLICY "auth write cheers"
      ON player_cheers FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_player_cheers_team ON player_cheers (team_id, created_at DESC);
