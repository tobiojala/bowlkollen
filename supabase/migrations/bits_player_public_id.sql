-- Gives every synced BITS player a real profile page. Until now /players/[id]
-- ran on a 32-row demo `players` table disconnected from the real sync
-- (55k+ rows in bits_players, 120k+ in bits_match_player_results). This adds
-- a public, non-PII id for routing, plus read functions that join through
-- lic_nbr server-side so the internal license number never has to be
-- selected directly by new app code (see bits_players.sql:2 — lic_nbr is
-- never shown in any UI; these functions keep it out of the response shape
-- entirely, not just out of the rendered text).

ALTER TABLE bits_players
  ADD COLUMN IF NOT EXISTS public_id uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS bits_players_public_id_idx ON bits_players (public_id);

-- ─── get_player_identity ──────────────────────────────────────────────────
-- Name/club/average for the profile header. No lic_nbr in the result.
CREATE OR REPLACE FUNCTION get_player_identity(p_public_id uuid)
RETURNS TABLE (
  public_id         uuid,
  name              text,
  club_name         text,
  licence_average   integer,
  licence_skill_lvl integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bp.public_id,
    CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name
         ELSE bp.first_name || ' ' || bp.sur_name END AS name,
    bp.club_name,
    bp.licence_average,
    bp.licence_skill_lvl
  FROM bits_players bp
  WHERE bp.public_id = p_public_id;
$$;

-- ─── get_player_match_history ─────────────────────────────────────────────
-- One row per match the player has results for, returned ascending by date.
-- Feeds bitsRowsToProfileMatches() in src/lib/profile-adapter.ts.
-- home_points/away_points are board points (bits_matches.home_result /
-- away_result, 0-8) — the W/L/D-deciding number, not the raw pin total
-- (bits_matches.home_score/away_score), matching the existing "W 6–2"
-- result-string convention in resultsToProfileMatches().
CREATE OR REPLACE FUNCTION get_player_match_history(p_public_id uuid)
RETURNS TABLE (
  match_date     date,
  division_name  text,
  opponent_name  text,
  is_home_team   boolean,
  series         integer[],
  total_result   integer,
  home_points    integer,
  away_points    integer,
  season_id      integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bm.match_date,
    bm.division_name,
    CASE WHEN r.is_home_team THEN bm.away_team_name ELSE bm.home_team_name END AS opponent_name,
    r.is_home_team,
    r.series,
    r.total_result,
    bm.home_result,
    bm.away_result,
    bm.season_id
  FROM bits_match_player_results r
  JOIN bits_players bp ON bp.lic_nbr = r.lic_nbr
  JOIN bits_matches bm ON bm.bits_match_id = r.bits_match_id
  WHERE bp.public_id = p_public_id
  ORDER BY bm.match_date ASC;
$$;

-- ─── get_player_percentile ────────────────────────────────────────────────
-- Real "top X%" from BITS' own licence_average distribution across every
-- synced player with a known average. Replaces the simulated RATING_DIST
-- curve in src/lib/player-stats.ts (bkTopPercent) for players where this
-- resolves to non-null; callers fall back to the simulated curve otherwise
-- (e.g. licence_average not yet synced for that player).
CREATE OR REPLACE FUNCTION get_player_percentile(p_public_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_avg  integer;
  total_count integer;
  below_count integer;
BEGIN
  SELECT licence_average INTO target_avg FROM bits_players WHERE public_id = p_public_id;
  IF target_avg IS NULL OR target_avg <= 0 THEN
    RETURN NULL;
  END IF;

  SELECT count(*) INTO total_count FROM bits_players WHERE licence_average IS NOT NULL AND licence_average > 0;
  IF total_count = 0 THEN
    RETURN NULL;
  END IF;

  SELECT count(*) INTO below_count
  FROM bits_players
  WHERE licence_average IS NOT NULL AND licence_average > 0 AND licence_average < target_avg;

  RETURN GREATEST(1, ROUND((1 - below_count::numeric / total_count) * 100));
END;
$$;

GRANT EXECUTE ON FUNCTION get_player_identity(uuid)      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_player_match_history(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_player_percentile(uuid)    TO anon, authenticated;

-- ─── player_claims: repoint from the demo `players` table to real identity ─
-- player_claims.player_id used to FK to players.id (the 32-row demo table,
-- already uuid-typed, no type change needed). Repoint at
-- bits_players.public_id so claiming works against real players. There are
-- no existing claim rows in production (verified before writing this), so
-- nothing is orphaned by the swap.
ALTER TABLE player_claims DROP CONSTRAINT IF EXISTS player_claims_player_id_fkey;
ALTER TABLE player_claims
  ADD CONSTRAINT player_claims_player_id_fkey
    FOREIGN KEY (player_id) REFERENCES bits_players(public_id) ON DELETE SET NULL;
