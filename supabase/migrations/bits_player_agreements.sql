-- Some players hold a dual club registration in BITS ("spelaravtal"/agreement):
-- a primary club (already stored in club_name) and a secondary club they're
-- contracted/loaned to play for (e.g. a women's elite team recruiting guest
-- players). The bulk /Player registry endpoint does not expose this — only
-- the per-player player/PlayerProfileDetail endpoint does, via
-- agreementSecondClubName/agreementSecondClubId.
--
-- Confirmed example: Ottilia Gunnarsson (K070501OTT01) — primary club
-- "BK Femtionian", agreementSecondClubName "Team X-Calibur BK". Her score rows
-- under "Team X-Calibur BK" failed club-based resolution because her primary
-- club didn't match the team she was actually playing for that match.
--
-- agreement_synced_at tracks progress since this is fetched one license at a
-- time (no bulk endpoint exists) — only for players who are candidates for a
-- currently-unresolved score row, not the full ~55k registry.

ALTER TABLE bits_players
  ADD COLUMN IF NOT EXISTS agreement_club_id   integer,
  ADD COLUMN IF NOT EXISTS agreement_club_name text,
  ADD COLUMN IF NOT EXISTS agreement_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS bits_players_agreement_club ON bits_players (agreement_club_name);

-- Third-pass resolution: same as resolve_bits_player_lic_nbrs_by_club, but also
-- accepts a match on the player's secondary (agreement) club, not just their
-- primary club. Safe to re-run — only fills NULLs.
CREATE OR REPLACE FUNCTION resolve_bits_player_lic_nbrs_by_agreement()
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
      AND p.agreement_club_name IS NOT NULL
      AND btrim(p.agreement_club_name) = btrim(t.club_name)
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
