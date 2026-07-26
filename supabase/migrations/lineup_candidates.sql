-- Laguttagning intelligence: for a given match, rank the team's candidates by how
-- they actually perform IN THAT CONTEXT — their average at that center and in that
-- division — folded together with the availability answers. Players hop between
-- squads/divisions, so a season average hides where someone is actually strong.
--
-- Data: every finished game lives in bits_match_player_results.series, and each
-- result joins bits_matches for hall_name + division_name. So per-player splits by
-- venue and division are real, computed from actual games (not the licence average).
--
-- Team-private (verified members only). Ranking: available first (yes > maybe >
-- unknown > no), then "fit here" = venue avg (if enough games) → division avg → overall.

CREATE OR REPLACE FUNCTION public.get_lineup_candidates(p_bits_team_id integer, p_bits_match_id integer)
RETURNS TABLE (
  public_id      uuid,
  player_name    text,
  overall_avg    integer,
  overall_games  integer,
  venue_avg      integer,
  venue_games    integer,
  division_avg   integer,
  division_games integer,
  availability   text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH m AS (
    SELECT hall_name, division_name FROM bits_matches WHERE bits_match_id = p_bits_match_id
  ),
  -- Candidates: everyone who has played for this team, plus verified app members
  -- (so a newly-joined teammate appears even before their first game).
  cand AS (
    SELECT DISTINCT upper(r.lic_nbr) AS lic
    FROM bits_match_player_results r
    JOIN bits_matches bm ON bm.bits_match_id = r.bits_match_id
    WHERE (bm.home_bits_team_id = p_bits_team_id AND r.is_home_team)
       OR (bm.away_bits_team_id = p_bits_team_id AND NOT r.is_home_team)
    UNION
    SELECT upper(bp.lic_nbr)
    FROM team_claims tc
    JOIN bits_players bp ON bp.public_id = tc.matched_public_id
    WHERE tc.bits_team_id = p_bits_team_id AND tc.status = 'verified' AND bp.lic_nbr IS NOT NULL
  ),
  -- Every game each candidate has ever bowled, with its venue + division.
  games AS (
    SELECT upper(r.lic_nbr) AS lic, g.pins, bm.hall_name, bm.division_name
    FROM bits_match_player_results r
    JOIN bits_matches bm ON bm.bits_match_id = r.bits_match_id
    JOIN cand c ON c.lic = upper(r.lic_nbr)
    CROSS JOIN LATERAL unnest(r.series) AS g(pins)
    WHERE bm.is_finished = true AND g.pins > 0
  ),
  agg AS (
    SELECT
      lic,
      round(avg(pins))                                                               AS overall_avg,
      count(*)                                                                        AS overall_games,
      round(avg(pins) FILTER (WHERE hall_name     = (SELECT hall_name FROM m)))       AS venue_avg,
      count(*)        FILTER (WHERE hall_name     = (SELECT hall_name FROM m))        AS venue_games,
      round(avg(pins) FILTER (WHERE division_name = (SELECT division_name FROM m)))   AS division_avg,
      count(*)        FILTER (WHERE division_name = (SELECT division_name FROM m))    AS division_games
    FROM games GROUP BY lic
  )
  SELECT
    bp.public_id,
    CASE WHEN bp.first_name IS NULL OR bp.first_name = '' THEN bp.sur_name
         ELSE bp.first_name || ' ' || bp.sur_name END AS player_name,
    a.overall_avg::int, COALESCE(a.overall_games, 0)::int,
    a.venue_avg::int,   COALESCE(a.venue_games, 0)::int,
    a.division_avg::int, COALESCE(a.division_games, 0)::int,
    av.response AS availability
  FROM cand c
  JOIN bits_players bp ON upper(bp.lic_nbr) = c.lic
  LEFT JOIN agg a ON a.lic = c.lic
  LEFT JOIN team_claims tc ON tc.matched_public_id = bp.public_id
        AND tc.bits_team_id = p_bits_team_id AND tc.status = 'verified'
  LEFT JOIN team_match_availability av ON av.user_id = tc.user_id
        AND av.bits_team_id = p_bits_team_id AND av.bits_match_id = p_bits_match_id
  WHERE EXISTS (
    SELECT 1 FROM team_claims me
    WHERE me.user_id = auth.uid() AND me.bits_team_id = p_bits_team_id AND me.status = 'verified'
  )
  ORDER BY
    CASE av.response WHEN 'yes' THEN 0 WHEN 'maybe' THEN 1 WHEN 'no' THEN 3 ELSE 2 END,
    COALESCE(
      CASE WHEN COALESCE(a.venue_games, 0)    >= 3 THEN a.venue_avg END,
      CASE WHEN COALESCE(a.division_games, 0) >= 3 THEN a.division_avg END,
      a.overall_avg, 0
    ) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_lineup_candidates(integer, integer) TO authenticated;
