-- ─── BITS competitions (tävlingar) + per-player results ──────────────────────
-- Ingests the federation's OPEN/CUP competitions and their per-player standings
-- from BITS (competition/GetClosedCompetitions + competition/GetCompetitionResult).
-- This is public federation data (published on bits.swebowl.se/tavlingsresultat),
-- so RLS allows anon SELECT; writes go only through the service-role sync.
--
-- resultLicNbr links each result row to bits_players.lic_nbr → a player's real
-- competition history + a competition-basis average, distinct from the league
-- seriesnitt and from BITS' official licence snitt.

CREATE TABLE IF NOT EXISTS public.bits_competitions (
  bits_competition_id integer PRIMARY KEY,
  season_id           integer NOT NULL,
  name                text NOT NULL,
  hall                text,
  hall_city           text,
  hall_id             integer,
  club                text,
  start_date          date,
  end_date            date,
  final_date          date,
  status              integer,               -- competitionStatus (3 = finished)
  results_synced      boolean NOT NULL DEFAULT false,
  synced_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bits_competitions_season_idx ON public.bits_competitions (season_id, start_date DESC);
CREATE INDEX IF NOT EXISTS bits_competitions_pending_idx ON public.bits_competitions (results_synced) WHERE results_synced = false;

CREATE TABLE IF NOT EXISTS public.bits_competition_results (
  bits_competition_id integer NOT NULL REFERENCES public.bits_competitions(bits_competition_id) ON DELETE CASCADE,
  result_row_nbr      integer NOT NULL,      -- class index within the competition
  result_sort_order   integer NOT NULL,      -- unique row order within the class
  lic_nbr             text,                  -- → bits_players.lic_nbr (null for team rows)
  player_name         text,
  club_name           text,
  place               integer,
  rank_points         numeric,               -- integer ranking points awarded
  strength_points     numeric,               -- fractional resultRankPoint
  hcp                 integer,
  total_pins          integer NOT NULL DEFAULT 0,
  total_games         integer NOT NULL DEFAULT 0,
  class_rounds        integer,
  class_hcp           integer,
  class_desperado     boolean,
  synced_at           timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bits_competition_id, result_row_nbr, result_sort_order)
);
CREATE INDEX IF NOT EXISTS bits_comp_results_player_idx ON public.bits_competition_results (lic_nbr) WHERE lic_nbr IS NOT NULL;
CREATE INDEX IF NOT EXISTS bits_comp_results_comp_idx ON public.bits_competition_results (bits_competition_id, result_row_nbr, place);

ALTER TABLE public.bits_competitions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bits_competition_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bits_competitions_read ON public.bits_competitions;
CREATE POLICY bits_competitions_read ON public.bits_competitions FOR SELECT USING (true);
DROP POLICY IF EXISTS bits_competition_results_read ON public.bits_competition_results;
CREATE POLICY bits_competition_results_read ON public.bits_competition_results FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policies: only the service-role sync (which bypasses
-- RLS) writes. Public/anon and authenticated clients get read-only access.
