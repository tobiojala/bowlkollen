-- Hitta's default view (get_discover_recent_players) computed each non-junior
-- player's latest result with DISTINCT ON over a FULL scan + sort of the entire
-- bits_match_player_results table (hundreds of thousands of rows), running a
-- per-row junior check — on EVERY page open. That is the page's main slowness.
--
-- Precompute it once into a materialized view, refreshed nightly by the bits-sync
-- cron, so the RPC becomes a cheap indexed SELECT ... LIMIT. Behaviour is
-- identical; only the cost moves from every-request to once-a-day.

CREATE MATERIALIZED VIEW IF NOT EXISTS discover_recent_players AS
  SELECT DISTINCT ON (bp.public_id)
    bp.public_id,
    CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name
         ELSE bp.first_name || ' ' || bp.sur_name END AS name,
    bp.club_name,
    bmpr.total_result AS last_total,
    bm.match_date     AS last_date,
    bm.hall_name
  FROM bits_match_player_results bmpr
  JOIN bits_matches bm ON bm.bits_match_id = bmpr.bits_match_id
  JOIN bits_players bp ON bp.lic_nbr = bmpr.lic_nbr
  WHERE NOT bits_player_is_junior(bp.lic_nbr)
  ORDER BY bp.public_id, bm.match_date DESC;

-- Unique index → lets us REFRESH ... CONCURRENTLY (no read lock during refresh).
CREATE UNIQUE INDEX IF NOT EXISTS discover_recent_players_pk
  ON discover_recent_players (public_id);
-- The RPC's sort key.
CREATE INDEX IF NOT EXISTS discover_recent_players_last_date
  ON discover_recent_players (last_date DESC);

-- Same signature/return as before — now reads the precomputed view. SECURITY
-- DEFINER means anon/authenticated never need direct SELECT on the matview.
CREATE OR REPLACE FUNCTION get_discover_recent_players(p_limit integer DEFAULT 40)
RETURNS TABLE (
  public_id   uuid,
  name        text,
  club_name   text,
  last_total  integer,
  last_date   date,
  hall_name   text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public_id, name, club_name, last_total, last_date, hall_name
  FROM discover_recent_players
  ORDER BY last_date DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_discover_recent_players(integer) TO anon, authenticated;

-- Called by the bits-sync cron (daily) once fresh players/matches are in.
-- SECURITY DEFINER so the cron's service role can refresh regardless of owner.
CREATE OR REPLACE FUNCTION refresh_discover_recent_players()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY discover_recent_players;
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_discover_recent_players() TO service_role, authenticated;
