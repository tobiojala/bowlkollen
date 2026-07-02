-- "Your season" for the /schema page. Previously schema queried the legacy
-- matches table (1,296 rows, never bridged to real BITS data) with zero
-- scoping — round number isn't even a valid shared axis across divisions,
-- so an unscoped query mixes unrelated divisions into the same round group.
--
-- Team-follows can't be used to scope this: the existing Follow System only
-- ever followed the legacy teams table, which has no bridge column to
-- bits_teams/bits_matches anywhere (checked live, confirmed empty). So this
-- scopes by followed PLAYERS instead (already correctly wired to
-- bits_players.public_id) plus the user's own verified claim, deriving
-- divisions via their match appearances.

CREATE OR REPLACE FUNCTION get_user_season_matches()
RETURNS TABLE (
  bits_match_id   integer,
  match_date      date,
  round_id        integer,
  home_team_name  text,
  away_team_name  text,
  home_score      integer,
  away_score      integer,
  division_name   text,
  is_finished     boolean,
  hall_name       text
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
  )
  SELECT bm.bits_match_id, bm.match_date, bm.round_id, bm.home_team_name, bm.away_team_name,
         bm.home_score, bm.away_score, bm.division_name, bm.is_finished, bm.hall_name
  FROM bits_matches bm
  WHERE bm.bits_division_id IN (SELECT bits_division_id FROM my_divisions)
  ORDER BY bm.match_date;
$$;

-- Granted to anon too: auth.uid() is null for logged-out callers, which
-- naturally matches zero follows/claims and returns an empty list (the
-- same empty state shown to a logged-in user who follows nobody yet) —
-- safe, since nothing in the CTE depends on auth.uid() being non-null.
GRANT EXECUTE ON FUNCTION get_user_season_matches() TO anon, authenticated;
