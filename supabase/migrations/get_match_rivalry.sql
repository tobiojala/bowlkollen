-- "Kvällens hetaste bord" — the marquee rivalry in a finished match.
--
-- For a match, find every opponent pair that met at a bord, then for the pair with
-- the most CAREER history (across all of BITS), return their all-time head-to-head
-- plus how tonight went. Only genuine rivalries surface (met >= 3 times total);
-- otherwise no row -> no callout. Player a is always the lexically-smaller licence,
-- so the two sides are stable; the client phrases "leads / tied / tonight" from the counts.

CREATE OR REPLACE FUNCTION get_match_rivalry(p_match_id int)
RETURNS TABLE (
  a_public_id    uuid,
  a_name         text,
  b_public_id    uuid,
  b_name         text,
  a_wins         int,   -- career, incl. tonight
  b_wins         int,
  ties           int,
  meetings       int,
  a_tonight_wins int,   -- delmatcher a won vs b in THIS match
  b_tonight_wins int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH pairs AS (  -- unordered opponent licence pairs that met at a bord in THIS match
    SELECT DISTINCT
      LEAST(h.lic_nbr, aw.lic_nbr)    AS l1,
      GREATEST(h.lic_nbr, aw.lic_nbr) AS l2
    FROM bits_match_delmatch h
    JOIN bits_match_delmatch aw
      ON  aw.bits_match_id = h.bits_match_id
      AND aw.serie         = h.serie
      AND aw.table_no      = h.table_no
      AND aw.is_home_team  = false
    WHERE h.bits_match_id = p_match_id
      AND h.is_home_team  = true
      AND h.lic_nbr IS NOT NULL
      AND aw.lic_nbr IS NOT NULL
  ),
  duels AS (  -- every historical cell where the pair were on opposite sides, with side totals
    SELECT
      p.l1, p.l2,
      d1.bits_match_id,
      d1.is_home_team AS l1_home,
      ct.home_total, ct.away_total,
      (d1.bits_match_id = p_match_id) AS tonight
    FROM pairs p
    JOIN bits_match_delmatch d1 ON d1.lic_nbr = p.l1
    JOIN bits_match_delmatch d2
      ON  d2.lic_nbr       = p.l2
      AND d2.bits_match_id = d1.bits_match_id
      AND d2.serie         = d1.serie
      AND d2.table_no      = d1.table_no
      AND d2.is_home_team <> d1.is_home_team
    JOIN LATERAL (
      SELECT
        sum(score) FILTER (WHERE is_home_team)     AS home_total,
        sum(score) FILTER (WHERE NOT is_home_team) AS away_total
      FROM bits_match_delmatch c
      WHERE c.bits_match_id = d1.bits_match_id
        AND c.serie         = d1.serie
        AND c.table_no      = d1.table_no
    ) ct ON true
  ),
  scored AS (
    SELECT l1, l2, tonight,
      CASE
        WHEN home_total = away_total THEN 0
        WHEN (l1_home AND home_total > away_total)
          OR (NOT l1_home AND away_total > home_total) THEN 1   -- l1 won this cell
        ELSE -1                                                  -- l2 won this cell
      END AS l1_result
    FROM duels
  ),
  agg AS (
    SELECT l1, l2,
      count(*)                                                    AS meetings,
      count(*) FILTER (WHERE l1_result =  1)                      AS l1_wins,
      count(*) FILTER (WHERE l1_result = -1)                      AS l2_wins,
      count(*) FILTER (WHERE l1_result =  0)                      AS ties,
      count(*) FILTER (WHERE tonight AND l1_result =  1)          AS l1_tonight,
      count(*) FILTER (WHERE tonight AND l1_result = -1)          AS l2_tonight
    FROM scored
    GROUP BY l1, l2
  ),
  best AS (
    SELECT * FROM agg
    WHERE meetings >= 3
    ORDER BY meetings DESC, (l1_wins + l2_wins) DESC, abs(l1_wins - l2_wins) ASC
    LIMIT 1
  )
  SELECT
    p1.public_id,
    COALESCE(NULLIF(TRIM(p1.first_name || ' ' || p1.sur_name), ''), b.l1),
    p2.public_id,
    COALESCE(NULLIF(TRIM(p2.first_name || ' ' || p2.sur_name), ''), b.l2),
    b.l1_wins, b.l2_wins, b.ties, b.meetings,
    b.l1_tonight, b.l2_tonight
  FROM best b
  LEFT JOIN bits_players p1 ON p1.lic_nbr = b.l1
  LEFT JOIN bits_players p2 ON p2.lic_nbr = b.l2;
$$;

GRANT EXECUTE ON FUNCTION get_match_rivalry(int) TO anon, authenticated;
