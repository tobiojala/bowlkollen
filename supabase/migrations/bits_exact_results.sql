-- Replaces the name/club/agreement-heuristic player resolution with BITS' own
-- authoritative source: matchResult/GetMatchResults. Given a matchSchemeId
-- (already returned by the bulk Match endpoint we sync — no extra API call),
-- it returns every player's exact license number + full name + per-serie
-- line, already split home/away. Zero ambiguity, unlike GetMatchScores which
-- only gives BITS' abbreviated display names.
--
-- bits_match_scores / the name-resolution pipeline (bits_players.abbr_name,
-- resolve_bits_player_lic_nbrs*) stay in place as a fallback for the rare
-- case this endpoint is unavailable, but are no longer the primary path.

ALTER TABLE bits_matches
  ADD COLUMN IF NOT EXISTS match_scheme_id        text,
  ADD COLUMN IF NOT EXISTS exact_results_synced    boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS bits_match_player_results (
  id            bigserial   PRIMARY KEY,
  bits_match_id integer     NOT NULL REFERENCES bits_matches(bits_match_id) ON DELETE CASCADE,
  lic_nbr       text        NOT NULL,
  player_name   text        NOT NULL,
  is_home_team  boolean     NOT NULL,
  series        integer[]   NOT NULL,
  total_result  integer     NOT NULL,
  synced_at     timestamptz DEFAULT now(),
  UNIQUE (bits_match_id, lic_nbr)
);

CREATE INDEX IF NOT EXISTS bits_match_player_results_match ON bits_match_player_results (bits_match_id);
CREATE INDEX IF NOT EXISTS bits_match_player_results_lic   ON bits_match_player_results (lic_nbr);

ALTER TABLE bits_match_player_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON bits_match_player_results FOR SELECT USING (true);
