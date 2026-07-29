-- § D 306 spärr resolver: the SIGNALS the eligibility engine (lib/eligibility.ts) needs,
-- for seating candidates into a (farm) team for a specific match. Team-private.
--
-- Pre-match, results for the round don't exist yet, so the real signal is whether a player
-- is nominated to a HIGHER-ranked club team for the same serieomgång — i.e. in that team's
-- PUBLISHED lineup (team_lineups). We also fold in actual results (for a round already
-- played). If no higher club team has a published lineup OR results for the round, we
-- can't tell (has_higher_data = false) → the engine returns 'unknown', never a false ok.
--
-- Club team rank from the name suffix: A-lag (no F) = 0, "…F" = 1, "…F2" = 2, …

CREATE OR REPLACE FUNCTION public.get_lineup_eligibility(p_bits_team_id integer, p_bits_match_id integer)
RETURNS TABLE (
  target_is_farm    boolean,
  is_final_rounds   boolean,
  has_higher_data   boolean,
  higher_player_ids uuid[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT t.name, t.bits_club_id, bm.round_id, bm.season_id, bm.bits_division_id
    FROM bits_teams t
    JOIN bits_matches bm ON bm.bits_match_id = p_bits_match_id
    WHERE t.bits_team_id = p_bits_team_id
  ),
  rank_of AS (  -- rank helper as a lateral over club teams
    SELECT t.bits_team_id, t.name,
      CASE WHEN t.name !~* '\sF\d*$' THEN 0
           WHEN substring(t.name FROM '\sF(\d*)$') = '' THEN 1
           ELSE substring(t.name FROM '\sF(\d*)$')::int END AS rank
    FROM bits_teams t
    WHERE t.bits_club_id = (SELECT bits_club_id FROM me)
  ),
  my_rank AS (
    SELECT CASE WHEN name !~* '\sF\d*$' THEN 0
                WHEN substring(name FROM '\sF(\d*)$') = '' THEN 1
                ELSE substring(name FROM '\sF(\d*)$')::int END AS rank
    FROM me
  ),
  higher_teams AS (
    SELECT bits_team_id FROM rank_of WHERE rank < (SELECT rank FROM my_rank)
  ),
  -- higher club teams' matches in THIS round + season
  higher_matches AS (
    SELECT bm.bits_match_id
    FROM bits_matches bm
    WHERE bm.season_id = (SELECT season_id FROM me)
      AND bm.round_id IS NOT DISTINCT FROM (SELECT round_id FROM me)
      AND (bm.home_bits_team_id IN (SELECT bits_team_id FROM higher_teams)
        OR bm.away_bits_team_id IN (SELECT bits_team_id FROM higher_teams))
  ),
  -- players nominated to a higher team this round: via published lineup OR via results.
  from_lineup AS (
    SELECT s.public_id
    FROM team_lineups l
    JOIN team_lineup_slots s ON s.lineup_id = l.id
    WHERE l.status = 'published' AND l.bits_match_id IN (SELECT bits_match_id FROM higher_matches)
      AND l.bits_team_id IN (SELECT bits_team_id FROM higher_teams)
  ),
  from_results AS (
    SELECT bp.public_id
    FROM bits_match_player_results r
    JOIN bits_matches bm ON bm.bits_match_id = r.bits_match_id
    JOIN bits_players bp ON upper(bp.lic_nbr) = upper(r.lic_nbr)
    WHERE r.bits_match_id IN (SELECT bits_match_id FROM higher_matches)
      AND ((r.is_home_team AND bm.home_bits_team_id IN (SELECT bits_team_id FROM higher_teams))
        OR (NOT r.is_home_team AND bm.away_bits_team_id IN (SELECT bits_team_id FROM higher_teams)))
  ),
  higher_players AS (
    SELECT public_id FROM from_lineup UNION SELECT public_id FROM from_results
  ),
  -- last two grundserie rounds of this division/season, by latest match date
  final_rounds AS (
    SELECT round_id FROM bits_matches
    WHERE bits_division_id = (SELECT bits_division_id FROM me) AND season_id = (SELECT season_id FROM me)
      AND round_id IS NOT NULL
    GROUP BY round_id ORDER BY max(match_date) DESC LIMIT 2
  )
  SELECT
    ((SELECT rank FROM my_rank) > 0 AND EXISTS (SELECT 1 FROM higher_teams)) AS target_is_farm,
    (SELECT round_id FROM me) IN (SELECT round_id FROM final_rounds) AS is_final_rounds,
    (EXISTS (SELECT 1 FROM from_lineup) OR EXISTS (SELECT 1 FROM from_results)) AS has_higher_data,
    COALESCE((SELECT array_agg(DISTINCT public_id) FROM higher_players), '{}'::uuid[]) AS higher_player_ids
  WHERE EXISTS (
    SELECT 1 FROM team_claims me2 WHERE me2.user_id = auth.uid() AND me2.bits_team_id = p_bits_team_id AND me2.status = 'verified'
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_lineup_eligibility(integer, integer) TO authenticated;
