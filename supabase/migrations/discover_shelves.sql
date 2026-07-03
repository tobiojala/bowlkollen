-- Discover's curated shelves. Recency alone isn't curation — these two RPCs
-- give the page real hooks: the week's best series and the most-followed
-- players. Both exclude unverified juniors, same guard as
-- get_discover_recent_players.

-- ── Veckans serier — best total_result per player in the last p_days ─────────
CREATE OR REPLACE FUNCTION get_discover_top_series(p_days integer DEFAULT 7, p_limit integer DEFAULT 6)
RETURNS TABLE (
  public_id   uuid,
  name        text,
  club_name   text,
  total       integer,
  match_date  date,
  hall_name   text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public_id, name, club_name, total, match_date, hall_name
  FROM (
    SELECT DISTINCT ON (bp.public_id)
      bp.public_id,
      CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name
           ELSE bp.first_name || ' ' || bp.sur_name END AS name,
      bp.club_name,
      bmpr.total_result AS total,
      bm.match_date,
      bm.hall_name
    FROM bits_match_player_results bmpr
    JOIN bits_matches bm ON bm.bits_match_id = bmpr.bits_match_id
    JOIN bits_players bp ON bp.lic_nbr = bmpr.lic_nbr
    WHERE bm.match_date >= current_date - p_days
      AND bmpr.total_result IS NOT NULL
      AND NOT bits_player_is_junior(bp.lic_nbr)
    ORDER BY bp.public_id, bmpr.total_result DESC
  ) best
  ORDER BY total DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_discover_top_series(integer, integer) TO anon, authenticated;

-- ── Mest följda — players ranked by follower count ────────────────────────────
CREATE OR REPLACE FUNCTION get_discover_most_followed(p_limit integer DEFAULT 8)
RETURNS TABLE (
  public_id      uuid,
  name           text,
  club_name      text,
  follower_count bigint
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
    fc.follower_count
  FROM follow_counts fc
  JOIN bits_players bp ON bp.public_id::text = fc.entity_id
  WHERE fc.entity_type = 'player'
    AND NOT bits_player_is_junior(bp.lic_nbr)
  ORDER BY fc.follower_count DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_discover_most_followed(integer) TO anon, authenticated;
