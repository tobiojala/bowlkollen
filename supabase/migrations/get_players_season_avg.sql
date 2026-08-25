-- Each player's season serie-average — the baseline the match page compares
-- every serie against (snitt-deltas, höjdpunkter, prognos all derive from it).
-- Keyed by public_id (never lic_nbr); public federation data → anon + authenticated.
-- avg_serie = mean of all the player's individual serie scores that season.
CREATE OR REPLACE FUNCTION public.get_players_season_avg(p_public_ids uuid[], p_season_id integer)
RETURNS TABLE (
  public_id uuid,
  avg_serie integer,
  games     integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.public_id, round(avg(s.score))::int AS avg_serie, count(*)::int AS games
  FROM bits_players p
  JOIN bits_match_player_results r ON r.lic_nbr = p.lic_nbr
  JOIN bits_matches m              ON m.bits_match_id = r.bits_match_id AND m.season_id = p_season_id
  CROSS JOIN LATERAL unnest(r.series) AS s(score)
  WHERE p.public_id = ANY(p_public_ids) AND s.score > 0
  GROUP BY p.public_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_players_season_avg(uuid[], integer) TO anon, authenticated;
