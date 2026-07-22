-- The home feed showed PINFALL (home_score/away_score, e.g. 6623-6444) as the
-- match score. The league's actual match score is the MATCH POINTS
-- (home_result/away_result, e.g. 14-6). Add the result columns to the feed RPC
-- so the UI can show match points in rows; pinfall stays for match detail.
--
-- Same DROP+recreate + fallback-to-Elitserien logic as schema_fallback_division.sql,
-- only the RETURNS TABLE + final SELECT gain home_result/away_result.

DROP FUNCTION IF EXISTS get_user_season_matches();

CREATE FUNCTION get_user_season_matches()
RETURNS TABLE (
  bits_match_id    integer,
  match_date       date,
  round_id         integer,
  home_team_name   text,
  away_team_name   text,
  home_score       integer,
  away_score       integer,
  home_result      integer,
  away_result      integer,
  division_name    text,
  is_finished      boolean,
  hall_name        text,
  is_personalized  boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my_divisions AS (
    SELECT DISTINCT bm.bits_division_id
    FROM follows f
    JOIN bits_players bp ON bp.public_id = f.entity_id::uuid
    JOIN bits_match_player_results bmpr ON bmpr.lic_nbr = bp.lic_nbr
    JOIN bits_matches bm ON bm.bits_match_id = bmpr.bits_match_id
    WHERE f.user_id = auth.uid() AND f.entity_type = 'player'
    UNION
    SELECT DISTINCT bm.bits_division_id
    FROM player_claims pc
    JOIN bits_players bp ON bp.public_id = pc.player_id
    JOIN bits_match_player_results bmpr ON bmpr.lic_nbr = bp.lic_nbr
    JOIN bits_matches bm ON bm.bits_match_id = bmpr.bits_match_id
    WHERE pc.user_id = auth.uid() AND pc.status = 'verified'
    UNION
    SELECT DISTINCT bm.bits_division_id
    FROM follows f
    JOIN bits_matches bm ON (
      bm.home_bits_team_id::text = f.entity_id OR bm.away_bits_team_id::text = f.entity_id
    )
    WHERE f.user_id = auth.uid() AND f.entity_type = 'team'
  ),
  chosen AS (
    SELECT bits_division_id, true AS is_personalized FROM my_divisions
    UNION ALL
    SELECT bd.bits_division_id, false
    FROM bits_divisions bd
    WHERE bd.name IN ('Elitserien Herrar', 'Elitserien Damer')
      AND NOT EXISTS (SELECT 1 FROM my_divisions)
  )
  SELECT bm.bits_match_id, bm.match_date, bm.round_id, bm.home_team_name, bm.away_team_name,
         bm.home_score, bm.away_score, bm.home_result, bm.away_result,
         bm.division_name, bm.is_finished, bm.hall_name,
         c.is_personalized
  FROM bits_matches bm
  JOIN chosen c ON c.bits_division_id = bm.bits_division_id
  ORDER BY bm.match_date;
$$;

GRANT EXECUTE ON FUNCTION get_user_season_matches() TO anon, authenticated;
