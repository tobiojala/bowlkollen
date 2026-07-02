-- bits_players: resolved player identities from SvBF BITS /Player API
-- lic_nbr is the internal SvBF license number — NEVER shown in any UI.
-- abbr_name is a computed column for fast score-to-player lookups.

CREATE TABLE IF NOT EXISTS bits_players (
  lic_nbr           text        PRIMARY KEY,                -- e.g. "SE001234" — internal only
  first_name        text        NOT NULL DEFAULT '',
  sur_name          text        NOT NULL DEFAULT '',
  abbr_name         text GENERATED ALWAYS AS (
                      CASE
                        WHEN first_name IS NULL OR first_name = '' THEN sur_name
                        ELSE LEFT(first_name, 1) || '. ' || sur_name
                      END
                    ) STORED,
  club_name         text,
  licence_average   integer,
  licence_skill_lvl integer,
  lic_type_name     text,
  synced_at         timestamptz DEFAULT now()
);

-- Fast lookups: "find all players whose abbr_name = 'L. Andersson'"
CREATE INDEX IF NOT EXISTS bits_players_abbr ON bits_players (abbr_name);
CREATE INDEX IF NOT EXISTS bits_players_sur  ON bits_players (sur_name);

-- RLS: anonymous read, service role writes
ALTER TABLE bits_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON bits_players FOR SELECT USING (true);

-- Add resolved license column to match scores (nullable until name resolution runs)
ALTER TABLE bits_match_scores
  ADD COLUMN IF NOT EXISTS bits_lic_nbr text REFERENCES bits_players(lic_nbr) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bits_match_scores_lic ON bits_match_scores (bits_lic_nbr);

-- ─── resolve_bits_player_lic_nbrs ────────────────────────────────────────────
-- Updates bits_match_scores.bits_lic_nbr for any row whose player_name maps
-- unambiguously to exactly one player in bits_players (via abbr_name).
-- Rows where the abbreviated name is ambiguous (>1 player) are left NULL.
-- Returns the number of rows updated.

CREATE OR REPLACE FUNCTION resolve_bits_player_lic_nbrs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Build a set of unambiguous abbreviated names (exactly one player per name).
  -- Join that against unresolved score rows and update in bulk.
  UPDATE bits_match_scores ms
  SET    bits_lic_nbr = uniq.lic_nbr
  FROM (
    SELECT abbr_name, MIN(lic_nbr) AS lic_nbr
    FROM   bits_players
    GROUP  BY abbr_name
    HAVING COUNT(*) = 1
  ) uniq
  WHERE  ms.player_name    = uniq.abbr_name
  AND    ms.bits_lic_nbr   IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
