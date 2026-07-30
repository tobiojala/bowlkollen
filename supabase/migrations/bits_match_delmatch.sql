-- 2v2 (and 1v1) bord/delmatch reconstruction from BITS history.
--
-- BITS' matchResult/GetMatchScores returns every score tagged with
-- scoreId = "lblSerie{S}Table{T}Order{O}". Table = the physical bord, Order =
-- the player's slot in the konstellation. Grouping a match's scores by
-- (serie, table) yields the delmatch exactly as it was bowled — 2 home + 2 away
-- for 8-man national league (8M*), 1v1 for 4-man (4M*). The delmatch winner and
-- banpoäng (Blåboken Kap D §1: won delmatch = 1 banpoäng, + 1 to the highest
-- serie pinfall, max 5/serie) are computed from these slot rows.
--
-- This is separate from bits_match_player_results (per-player aggregate) — that
-- endpoint has no table/serie breakdown. One row per (match, serie, table, side, order).

ALTER TABLE bits_matches
  ADD COLUMN IF NOT EXISTS delmatch_synced boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS bits_match_delmatch (
  id            bigserial   PRIMARY KEY,
  bits_match_id integer     NOT NULL REFERENCES bits_matches(bits_match_id) ON DELETE CASCADE,
  serie         smallint    NOT NULL,   -- 1-based
  table_no      smallint    NOT NULL,   -- physical bord, 1-based
  player_order  smallint    NOT NULL,   -- slot within the konstellation, 1-based
  is_home_team  boolean     NOT NULL,
  player_name   text        NOT NULL,   -- abbreviated as BITS gives it ("A. Molander")
  lic_nbr       text,                   -- resolved best-effort from the match's GetMatchResults; may be null
  score         integer     NOT NULL,
  synced_at     timestamptz DEFAULT now(),
  UNIQUE (bits_match_id, serie, table_no, is_home_team, player_order)
);

CREATE INDEX IF NOT EXISTS bits_match_delmatch_match ON bits_match_delmatch (bits_match_id);
CREATE INDEX IF NOT EXISTS bits_match_delmatch_lic   ON bits_match_delmatch (lic_nbr);

-- Official result data — public read, no writes from clients (service-role only).
ALTER TABLE bits_match_delmatch ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON bits_match_delmatch FOR SELECT USING (true);
