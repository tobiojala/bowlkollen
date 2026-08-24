-- A player's BITS competition history, keyed by the public_id (never the internal
-- lic_nbr — same privacy contract as get_player_identity / get_player_match_history).
-- Joins bits_players → bits_competition_results → bits_competitions server-side.
-- Public federation data; granted to anon + authenticated.
CREATE OR REPLACE FUNCTION public.get_player_competition_results(p_public_id uuid)
RETURNS TABLE (
  bits_competition_id integer,
  competition_name    text,
  start_date          date,
  place               integer,
  total_pins          integer,
  total_games         integer,
  rank_points         numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.bits_competition_id, c.name, c.start_date, r.place, r.total_pins, r.total_games, r.rank_points
  FROM bits_players p
  JOIN bits_competition_results r ON r.lic_nbr = p.lic_nbr
  JOIN bits_competitions c        ON c.bits_competition_id = r.bits_competition_id
  WHERE p.public_id = p_public_id
  ORDER BY c.start_date DESC NULLS LAST, c.bits_competition_id DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_player_competition_results(uuid) TO anon, authenticated;
