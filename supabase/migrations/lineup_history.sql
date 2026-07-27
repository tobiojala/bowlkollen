-- Layer 4 (learning): the team's past published lineups + how the match went, so a
-- captain can look back at what they picked and the result. Team-private.

CREATE OR REPLACE FUNCTION public.get_team_lineup_history(p_bits_team_id integer)
RETURNS TABLE (
  bits_match_id integer,
  match_date    text,
  opponent      text,
  ours          integer,
  theirs        integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.bits_match_id,
    bm.match_date::text,
    CASE WHEN bm.home_bits_team_id = p_bits_team_id THEN bm.away_team_name ELSE bm.home_team_name END AS opponent,
    (CASE WHEN bm.home_bits_team_id = p_bits_team_id THEN bm.home_result ELSE bm.away_result END)::int AS ours,
    (CASE WHEN bm.home_bits_team_id = p_bits_team_id THEN bm.away_result ELSE bm.home_result END)::int AS theirs
  FROM team_lineups l
  JOIN bits_matches bm ON bm.bits_match_id = l.bits_match_id
  WHERE l.bits_team_id = p_bits_team_id
    AND l.status = 'published'
    AND bm.is_finished = true
    AND EXISTS (
      SELECT 1 FROM team_claims me
      WHERE me.user_id = auth.uid() AND me.bits_team_id = p_bits_team_id AND me.status = 'verified'
    )
  ORDER BY bm.match_date DESC
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_lineup_history(integer) TO authenticated;
