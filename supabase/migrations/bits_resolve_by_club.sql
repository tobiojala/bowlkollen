-- Second-pass player resolution: when an abbreviated name alone is ambiguous
-- (e.g. "L. Andersson" matches 150+ players nationally), narrow the candidate
-- pool using the player's club — derived from which team they played for in
-- that specific match (home_bits_team_id/away_bits_team_id → bits_teams.club_name).
-- Only resolves when exactly one bits_players row matches BOTH the abbreviated
-- name and the club. Safe to re-run — only fills NULLs, never overwrites.

CREATE OR REPLACE FUNCTION resolve_bits_player_lic_nbrs_by_club()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  WITH candidates AS (
    SELECT
      ms.id          AS score_id,
      p.lic_nbr      AS lic_nbr,
      COUNT(*) OVER (PARTITION BY ms.id) AS match_count
    FROM bits_match_scores ms
    JOIN bits_matches m
      ON m.bits_match_id = ms.bits_match_id
    JOIN bits_teams t
      ON t.bits_team_id = (CASE WHEN ms.is_home_team THEN m.home_bits_team_id ELSE m.away_bits_team_id END)
    JOIN bits_players p
      ON  p.abbr_name = ms.player_name
      AND btrim(p.club_name) = btrim(t.club_name)
    WHERE ms.bits_lic_nbr IS NULL
  )
  UPDATE bits_match_scores ms
  SET    bits_lic_nbr = c.lic_nbr
  FROM   candidates c
  WHERE  ms.id = c.score_id
  AND    c.match_count = 1;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
