-- Feed our bowling_balls catalog from the bowwwl.com API (Aaron granted access,
-- 2026-09-14 — sanctioned public API, attribution required; NOT scraping). We keep
-- bowling_balls as the catalog (player_balls still references it by uuid, so the
-- arsenal wiring is untouched) and add the fields the bowwwl feed carries. Upserts
-- key on bowwwl_id so re-syncs preserve each row's uuid → player_balls refs stay valid.
--
-- Terminology (locked): the ball = KLOT; kärna = CORE; coverstock = COVER. "yta" is
-- reserved for the player's own surface work (sanding/polish), never the factory cover.

ALTER TABLE public.bowling_balls
  ADD COLUMN IF NOT EXISTS bowwwl_id       text UNIQUE,
  ADD COLUMN IF NOT EXISTS core_type       text,          -- Symmetric / Asymmetric
  ADD COLUMN IF NOT EXISTS int_diff        numeric(5,3),  -- intermediate differential (asym only)
  ADD COLUMN IF NOT EXISTS coverstock_type text,          -- Solid / Pearl / Hybrid Reactive …
  ADD COLUMN IF NOT EXISTS factory_finish  text,
  ADD COLUMN IF NOT EXISTS thumbnail_url   text,
  ADD COLUMN IF NOT EXISTS availability    text,          -- Available / Discontinued …
  ADD COLUMN IF NOT EXISTS release_date    date,
  ADD COLUMN IF NOT EXISTS spec_weight     int,           -- lb the specs are for (default 15)
  ADD COLUMN IF NOT EXISTS source          text,          -- 'bowwwl' for API rows
  ADD COLUMN IF NOT EXISTS synced_at       timestamptz;

CREATE INDEX IF NOT EXISTS bowling_balls_brand_idx ON public.bowling_balls (brand);
CREATE INDEX IF NOT EXISTS bowling_balls_availability_idx ON public.bowling_balls (availability);

-- bowling_balls already has RLS + a public read policy (ball_arsenal.sql). Writes stay
-- service-role only (the balls-sync cron uses the service key). No policy change needed.
