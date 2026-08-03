-- Direct delmatch head-to-head between two players, for the Compare screen.
-- Returns player A's record vs player B (wins/losses from A's side), meetings, and
-- A's last-five trend. Same per-cell winner basis as the rivalry engine. A row is
-- always returned (zeros when they've never met at a bord).

CREATE OR REPLACE FUNCTION get_h2h(p_a uuid, p_b uuid)
RETURNS TABLE (
  a_wins   int,
  b_wins   int,
  ties     int,
  meetings int,
  recent   int[]   -- last 5 from A's side: 1 win, -1 loss, 0 tie
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH la AS (SELECT lic_nbr FROM bits_players WHERE public_id = p_a),
       lb AS (SELECT lic_nbr FROM bits_players WHERE public_id = p_b),
  duels AS (
    SELECT d1.is_home_team AS a_home, m.match_date, ct.home_total, ct.away_total
    FROM la
    JOIN bits_match_delmatch d1 ON d1.lic_nbr = la.lic_nbr
    JOIN bits_match_delmatch d2
      ON  d2.bits_match_id = d1.bits_match_id
      AND d2.serie         = d1.serie
      AND d2.table_no      = d1.table_no
      AND d2.is_home_team <> d1.is_home_team
    JOIN lb ON lb.lic_nbr = d2.lic_nbr
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
    SELECT match_date,
      CASE
        WHEN home_total = away_total THEN 0
        WHEN (a_home AND home_total > away_total)
          OR (NOT a_home AND away_total > home_total) THEN 1
        ELSE -1
      END AS a_res
    FROM duels
  )
  SELECT
    count(*) FILTER (WHERE a_res =  1)::int,
    count(*) FILTER (WHERE a_res = -1)::int,
    count(*) FILTER (WHERE a_res =  0)::int,
    count(*)::int,
    (array_agg(a_res ORDER BY match_date DESC))[1:5]
  FROM scored;
$$;

GRANT EXECUTE ON FUNCTION get_h2h(uuid, uuid) TO anon, authenticated;
