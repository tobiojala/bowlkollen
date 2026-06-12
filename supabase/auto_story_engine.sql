-- Auto-Story Engine — Phase 1 migration
-- Run in Supabase SQL editor.
-- Safe to re-run: all statements use IF NOT EXISTS / DO NOTHING patterns.

-- ─── team_events ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_events (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id             uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_type          text        NOT NULL,
  event_date          date        NOT NULL,   -- explicit date for dedup; set to match date or today
  title               text        NOT NULL,
  body                text,
  payload             jsonb       NOT NULL DEFAULT '{}',
  featured_player_id  uuid        REFERENCES players(id),
  match_id            uuid        REFERENCES matches(id),
  captain_note        text        CHECK (char_length(captain_note) <= 140),
  is_pinned           boolean     NOT NULL DEFAULT false,
  is_hidden           boolean     NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),

  -- One event per type per match (e.g. one match_result per match)
  CONSTRAINT uq_team_event_per_match
    UNIQUE (team_id, event_type, match_id),

  -- One player-scoped event per type per day (e.g. personal_best, form_rising)
  CONSTRAINT uq_team_event_per_player_per_day
    UNIQUE (team_id, event_type, featured_player_id, event_date)
);

ALTER TABLE team_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'team_events' AND policyname = 'public read team_events'
  ) THEN
    CREATE POLICY "public read team_events"
      ON team_events FOR SELECT USING (NOT is_hidden);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'team_events' AND policyname = 'admin write team_events'
  ) THEN
    CREATE POLICY "admin write team_events"
      ON team_events FOR ALL USING (
        EXISTS (
          SELECT 1 FROM club_claims
          WHERE user_id = auth.uid() AND team_id = team_events.team_id
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_team_events_team_date
  ON team_events (team_id, event_date DESC);

-- ─── team_event_reactions ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_event_reactions (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id     uuid NOT NULL REFERENCES team_events(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction     text NOT NULL CHECK (reaction IN ('fire', 'heart', 'clap', 'sad')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE team_event_reactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'team_event_reactions' AND policyname = 'public read reactions'
  ) THEN
    CREATE POLICY "public read reactions"
      ON team_event_reactions FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'team_event_reactions' AND policyname = 'auth write reactions'
  ) THEN
    CREATE POLICY "auth write reactions"
      ON team_event_reactions FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ─── team_sponsors ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_sponsors (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id       uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name          text NOT NULL,
  logo_url      text,
  website       text,
  tagline       text,
  tier          text NOT NULL DEFAULT 'partner'
                  CHECK (tier IN ('main', 'gold', 'silver', 'partner')),
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE team_sponsors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'team_sponsors' AND policyname = 'public read team_sponsors'
  ) THEN
    CREATE POLICY "public read team_sponsors"
      ON team_sponsors FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'team_sponsors' AND policyname = 'admin write team_sponsors'
  ) THEN
    CREATE POLICY "admin write team_sponsors"
      ON team_sponsors FOR ALL USING (
        EXISTS (
          SELECT 1 FROM club_claims
          WHERE user_id = auth.uid() AND team_id = team_sponsors.team_id
        )
      );
  END IF;
END $$;

-- ─── teams — add accepting_sponsors column ────────────────────────────────────

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS accepting_sponsors boolean NOT NULL DEFAULT false;
