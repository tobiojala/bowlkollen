-- After backfilling BITS history to 2008 (2026-09-07), get_user_season_matches
-- started returning ALL 19 seasons at once. Root cause: bits_division_id is
-- REUSED across seasons (Elitserien Herrar = 1, Damer = 36 every year), and this
-- function joined bits_matches by division_id ONLY — never by season. With just
-- 2021–26 present it looked fine; with 2008–26 it returns everything oldest-first
-- (ORDER BY match_date), so /schema showed 2008/09 at the top and buried the
-- current season ("Elitserien Damer latest 20/21, Herrar 16/17").
--
-- Fix: scope every bits_matches touch to the current bowling season (Jul→Jun;
-- season_id = starting calendar year). Also season-scopes my_divisions so "your
-- divisions" means the ones your follows are in THIS season, not any past one.

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
  WITH season_pick AS (
    SELECT CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 7
                THEN EXTRACT(YEAR FROM CURRENT_DATE)::int
                ELSE EXTRACT(YEAR FROM CURRENT_DATE)::int - 1 END AS s
  ),
  my_divisions AS (
    SELECT DISTINCT bm.bits_division_id
    FROM follows f
    JOIN bits_players bp ON bp.public_id = f.entity_id::uuid
    JOIN bits_match_player_results bmpr ON bmpr.lic_nbr = bp.lic_nbr
    JOIN bits_matches bm ON bm.bits_match_id = bmpr.bits_match_id
    WHERE f.user_id = auth.uid() AND f.entity_type = 'player'
      AND bm.season_id = (SELECT s FROM season_pick)
    UNION
    SELECT DISTINCT bm.bits_division_id
    FROM player_claims pc
    JOIN bits_players bp ON bp.public_id = pc.player_id
    JOIN bits_match_player_results bmpr ON bmpr.lic_nbr = bp.lic_nbr
    JOIN bits_matches bm ON bm.bits_match_id = bmpr.bits_match_id
    WHERE pc.user_id = auth.uid() AND pc.status = 'verified'
      AND bm.season_id = (SELECT s FROM season_pick)
    UNION
    SELECT DISTINCT bm.bits_division_id
    FROM follows f
    JOIN bits_matches bm ON (
      bm.home_bits_team_id::text = f.entity_id OR bm.away_bits_team_id::text = f.entity_id
    )
    WHERE f.user_id = auth.uid() AND f.entity_type = 'team'
      AND bm.season_id = (SELECT s FROM season_pick)
  ),
  chosen AS (
    SELECT bits_division_id, true AS is_personalized FROM my_divisions
    UNION ALL
    SELECT bd.bits_division_id, false
    FROM bits_divisions bd
    WHERE bd.name IN ('Elitserien Herrar', 'Elitserien Damer')
      AND bd.season_id = (SELECT s FROM season_pick)
      AND NOT EXISTS (SELECT 1 FROM my_divisions)
  )
  SELECT bm.bits_match_id, bm.match_date, bm.round_id, bm.home_team_name, bm.away_team_name,
         bm.home_score, bm.away_score, bm.division_name, bm.is_finished, bm.hall_name,
         c.is_personalized
  FROM bits_matches bm
  JOIN chosen c ON c.bits_division_id = bm.bits_division_id
  WHERE bm.season_id = (SELECT s FROM season_pick)
  ORDER BY bm.match_date;
$$;

GRANT EXECUTE ON FUNCTION get_user_season_matches() TO anon, authenticated;
