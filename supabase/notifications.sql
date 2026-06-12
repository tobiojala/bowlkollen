-- In-app follow notifications
-- When a team_event is inserted, all followers of that team get a notification row.
-- Run in Supabase SQL editor.

-- ─── notifications table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id      uuid        NOT NULL REFERENCES teams(id)      ON DELETE CASCADE,
  event_id     uuid        REFERENCES team_events(id)         ON DELETE CASCADE,
  event_type   text        NOT NULL,
  title        text        NOT NULL,
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'owner read notifications'
  ) THEN
    CREATE POLICY "owner read notifications"
      ON notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'owner update notifications'
  ) THEN
    CREATE POLICY "owner update notifications"
      ON notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

-- ─── trigger: fan-out on team_event insert ────────────────────────────────────
-- Only fires for event types worth notifying about (not match_preview — too noisy).

CREATE OR REPLACE FUNCTION notify_team_followers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.event_type NOT IN (
    'match_result', 'win_streak', 'personal_best', 'player_milestone',
    'captain_post', 'lineup_announced', 'revenge_win', 'giant_killer',
    'promotion_clinched', 'division_climbed'
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, team_id, event_id, event_type, title)
  SELECT f.user_id, NEW.team_id, NEW.id, NEW.event_type, NEW.title
  FROM   favorites f
  WHERE  f.team_id = NEW.team_id
    AND  f.type    = 'team'
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_team_event_notify ON team_events;

CREATE TRIGGER on_team_event_notify
  AFTER INSERT ON team_events
  FOR EACH ROW EXECUTE FUNCTION notify_team_followers();
