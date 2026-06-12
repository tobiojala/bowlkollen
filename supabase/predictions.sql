-- Pre-match predictions
-- Run in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS match_predictions (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id     uuid        NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction   text        NOT NULL CHECK (prediction IN ('W', 'D', 'L')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_id)
);

ALTER TABLE match_predictions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'match_predictions' AND policyname = 'public read predictions'
  ) THEN
    CREATE POLICY "public read predictions"
      ON match_predictions FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'match_predictions' AND policyname = 'auth write predictions'
  ) THEN
    CREATE POLICY "auth write predictions"
      ON match_predictions FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_match_predictions_match
  ON match_predictions (match_id);
