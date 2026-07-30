-- Career delmatch (bord) data for one player, for the profile "Delmatch" section.
-- Returns every slot row in the delmatch cells the player took part in — i.e. the
-- player plus their partner(s) and opponents — with co-players already resolved to
-- public_id + full name + match date. The client runs the tested pure engine
-- (computePlayerDelmatchRecord) over these rows, so the W-L / rivalry / partnership
-- logic lives in exactly one place. Efficient: only the player's own cells, not
-- every row of every match they appeared in.

CREATE OR REPLACE FUNCTION get_player_delmatch(p_public_id uuid)
RETURNS TABLE (
  bits_match_id int,
  match_date    text,
  serie         smallint,
  table_no      smallint,
  is_home_team  boolean,
  player_order  smallint,
  public_id     uuid,
  player_name   text,
  score         int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT lic_nbr FROM bits_players WHERE public_id = p_public_id
  ),
  cells AS (
    SELECT DISTINCT d.bits_match_id, d.serie, d.table_no
    FROM bits_match_delmatch d
    JOIN me ON me.lic_nbr = d.lic_nbr
  )
  SELECT
    d.bits_match_id,
    m.match_date::text,
    d.serie,
    d.table_no,
    d.is_home_team,
    d.player_order,
    p.public_id,
    COALESCE(NULLIF(TRIM(p.first_name || ' ' || p.sur_name), ''), d.player_name) AS player_name,
    d.score
  FROM bits_match_delmatch d
  JOIN cells c
    ON c.bits_match_id = d.bits_match_id AND c.serie = d.serie AND c.table_no = d.table_no
  JOIN bits_matches m ON m.bits_match_id = d.bits_match_id
  LEFT JOIN bits_players p ON p.lic_nbr = d.lic_nbr;
$$;

GRANT EXECUTE ON FUNCTION get_player_delmatch(uuid) TO anon, authenticated;
