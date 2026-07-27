-- "Du är uttagen": the published lineups (upcoming matches) where the signed-in user
-- is seated — the in-app half of the publish notification. Resolves the user's player
-- identity via their claimed player OR their team-claim roster match. Only published
-- lineups (drafts stay private), only future matches. Team-agnostic (all their teams).

CREATE OR REPLACE FUNCTION public.get_my_selections()
RETURNS TABLE (
  bits_team_id  integer,
  team_name     text,
  bits_match_id integer,
  match_date    text,
  opponent      text,
  bord          integer,
  pos           integer,
  is_reserve    boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me_players AS (
    SELECT pc.player_id AS public_id
    FROM player_claims pc
    WHERE pc.user_id = auth.uid() AND pc.status = 'verified'
    UNION
    SELECT tc.matched_public_id
    FROM team_claims tc
    WHERE tc.user_id = auth.uid() AND tc.status = 'verified' AND tc.matched_public_id IS NOT NULL
  )
  SELECT
    l.bits_team_id,
    bt.name AS team_name,
    l.bits_match_id,
    bm.match_date::text,
    CASE WHEN bm.home_bits_team_id = l.bits_team_id THEN bm.away_team_name ELSE bm.home_team_name END AS opponent,
    s.bord, s.pos, s.is_reserve
  FROM team_lineups l
  JOIN team_lineup_slots s ON s.lineup_id = l.id
  JOIN me_players mp ON mp.public_id = s.public_id
  JOIN bits_matches bm ON bm.bits_match_id = l.bits_match_id
  JOIN bits_teams bt ON bt.bits_team_id = l.bits_team_id
  WHERE l.status = 'published'
    AND bm.is_finished = false
    AND bm.match_date::text >= current_date::text
  ORDER BY bm.match_date ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_selections() TO authenticated;
