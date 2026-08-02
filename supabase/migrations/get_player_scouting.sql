-- "Inför matchen" scouting — a player's career head-to-head vs the opponent's roster.
--
-- Given the viewer (public_id) and the opponent team, return every opponent-roster
-- player the viewer has faced at a bord, with the viewer's all-time record and their
-- last-five trend (recent-first). The client ranks bogeys first and tags them.
-- Reuses the same delmatch head-to-head basis as the rivalry callout.

CREATE OR REPLACE FUNCTION get_player_scouting(p_public_id uuid, p_opponent_team_id int)
RETURNS TABLE (
  opp_public_id uuid,
  opp_name      text,
  my_wins       int,
  my_losses     int,
  ties          int,
  meetings      int,
  recent        int[]   -- last 5 outcomes from the viewer's side: 1 win, -1 loss, 0 tie
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT lic_nbr FROM bits_players WHERE public_id = p_public_id
  ),
  opp_roster AS (  -- lics who played on the opponent team's side in its matches
    SELECT DISTINCT r.lic_nbr
    FROM bits_match_player_results r
    JOIN bits_matches m ON m.bits_match_id = r.bits_match_id
    WHERE (m.home_bits_team_id = p_opponent_team_id AND r.is_home_team)
       OR (m.away_bits_team_id = p_opponent_team_id AND NOT r.is_home_team)
  ),
  duels AS (  -- every cell where the viewer faced an opponent-roster player
    SELECT
      d2.lic_nbr AS opp_lic,
      d1.is_home_team AS me_home,
      m.match_date,
      ct.home_total, ct.away_total
    FROM me
    JOIN bits_match_delmatch d1 ON d1.lic_nbr = me.lic_nbr
    JOIN bits_match_delmatch d2
      ON  d2.bits_match_id = d1.bits_match_id
      AND d2.serie         = d1.serie
      AND d2.table_no      = d1.table_no
      AND d2.is_home_team <> d1.is_home_team
    JOIN opp_roster o ON o.lic_nbr = d2.lic_nbr
    JOIN bits_matches m ON m.bits_match_id = d1.bits_match_id
    JOIN LATERAL (
      SELECT
        sum(score) FILTER (WHERE is_home_team)     AS home_total,
        sum(score) FILTER (WHERE NOT is_home_team) AS away_total
      FROM bits_match_delmatch x
      WHERE x.bits_match_id = d1.bits_match_id
        AND x.serie         = d1.serie
        AND x.table_no      = d1.table_no
    ) ct ON true
  ),
  scored AS (
    SELECT opp_lic, match_date,
      CASE
        WHEN home_total = away_total THEN 0
        WHEN (me_home AND home_total > away_total)
          OR (NOT me_home AND away_total > home_total) THEN 1
        ELSE -1
      END AS me_result
    FROM duels
  )
  SELECT
    p.public_id,
    COALESCE(NULLIF(TRIM(p.first_name || ' ' || p.sur_name), ''), s.opp_lic),
    count(*) FILTER (WHERE me_result =  1)::int,
    count(*) FILTER (WHERE me_result = -1)::int,
    count(*) FILTER (WHERE me_result =  0)::int,
    count(*)::int,
    (array_agg(me_result ORDER BY match_date DESC))[1:5]
  FROM scored s
  LEFT JOIN bits_players p ON p.lic_nbr = s.opp_lic
  GROUP BY p.public_id, p.first_name, p.sur_name, s.opp_lic
  ORDER BY count(*) DESC;
$$;

GRANT EXECUTE ON FUNCTION get_player_scouting(uuid, int) TO anon, authenticated;
