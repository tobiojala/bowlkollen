-- Konstellation optimizer — historical partnership records among a set of players.
--
-- Given the lineup candidates (public_ids), return every pair's record as a
-- 2-man konstellation: how often they sat on the SAME side of a bord and how that
-- side did. Powers the captain's "bästa konstellationer" suggestions in laguttagning.
-- Win/loss is by the konstellation's pair total vs the opposing pair, same as the
-- delmatch engine. Client ranks by win-rate over a minimum sample.

CREATE OR REPLACE FUNCTION get_konstellationer(p_public_ids uuid[])
RETURNS TABLE (
  a_public_id uuid,
  b_public_id uuid,
  wins        int,
  losses      int,
  ties        int,
  together    int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH lics AS (
    SELECT public_id, lic_nbr
    FROM bits_players
    WHERE public_id = ANY(p_public_ids) AND lic_nbr IS NOT NULL
  ),
  cot AS (  -- both players on the SAME side of the same bord = a konstellation
    SELECT
      d1.bits_match_id, d1.serie, d1.table_no, d1.is_home_team,
      l1.public_id AS pa, l2.public_id AS pb
    FROM bits_match_delmatch d1
    JOIN lics l1 ON l1.lic_nbr = d1.lic_nbr
    JOIN bits_match_delmatch d2
      ON  d2.bits_match_id = d1.bits_match_id
      AND d2.serie         = d1.serie
      AND d2.table_no      = d1.table_no
      AND d2.is_home_team  = d1.is_home_team
      AND d2.lic_nbr      <> d1.lic_nbr
    JOIN lics l2 ON l2.lic_nbr = d2.lic_nbr
    WHERE l1.public_id < l2.public_id   -- unordered pair, no duplicate
  ),
  scored AS (
    SELECT c.pa, c.pb, c.is_home_team, ct.home_total, ct.away_total
    FROM cot c
    JOIN LATERAL (
      SELECT
        sum(score) FILTER (WHERE is_home_team)     AS home_total,
        sum(score) FILTER (WHERE NOT is_home_team) AS away_total
      FROM bits_match_delmatch x
      WHERE x.bits_match_id = c.bits_match_id
        AND x.serie         = c.serie
        AND x.table_no      = c.table_no
    ) ct ON true
  )
  SELECT
    pa, pb,
    count(*) FILTER (WHERE (is_home_team AND home_total > away_total)
                        OR (NOT is_home_team AND away_total > home_total)) AS wins,
    count(*) FILTER (WHERE (is_home_team AND home_total < away_total)
                        OR (NOT is_home_team AND away_total < home_total)) AS losses,
    count(*) FILTER (WHERE home_total = away_total)                        AS ties,
    count(*)                                                               AS together
  FROM scored
  GROUP BY pa, pb;
$$;

GRANT EXECUTE ON FUNCTION get_konstellationer(uuid[]) TO anon, authenticated;
