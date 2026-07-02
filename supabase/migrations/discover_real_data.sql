-- Discover's default view queried bits_match_player_results-adjacent legacy
-- tables (match_results/players/teams) — not wrong-looking, just wrong: a
-- small mostly-fake dataset standing in for the real ~56k-player BITS data.
-- This is the one piece that needs a server-side join (no FK exists from
-- bits_match_player_results.lic_nbr to bits_players.lic_nbr, so PostgREST
-- can't nest-select it) — search itself stays a plain client-side query
-- against bits_players/bits_teams directly, same pattern as the existing
-- claim-flow search in profile/page.tsx.

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
  FROM (
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
    ORDER BY bp.public_id, bm.match_date DESC
  ) recent
  ORDER BY last_date DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_discover_recent_players(integer) TO anon, authenticated;
