-- BITS external data tables
-- Synced from the SvBF BITS API (api.swebowl.se / bits.swebowl.se)

CREATE TABLE IF NOT EXISTS bits_divisions (
  bits_division_id  integer     NOT NULL,
  season_id         integer     NOT NULL,
  name              text        NOT NULL,
  synced_at         timestamptz DEFAULT now(),
  PRIMARY KEY (bits_division_id, season_id)
);

CREATE TABLE IF NOT EXISTS bits_matches (
  bits_match_id       integer     PRIMARY KEY,
  season_id           integer     NOT NULL,
  bits_division_id    integer,
  division_name       text,
  match_date          date        NOT NULL,
  home_bits_team_id   integer     NOT NULL,
  away_bits_team_id   integer     NOT NULL,
  home_team_name      text        NOT NULL,
  away_team_name      text        NOT NULL,
  home_score          integer,
  away_score          integer,
  home_result         integer,
  away_result         integer,
  round_id            integer,
  hall_name           text,
  hall_city           text,
  oil_pattern         text,
  is_finished         boolean     DEFAULT false,
  scores_synced       boolean     DEFAULT false,
  supabase_match_id   uuid        REFERENCES matches(id) ON DELETE SET NULL,
  synced_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bits_matches_season_div ON bits_matches (season_id, bits_division_id);
CREATE INDEX IF NOT EXISTS bits_matches_home_team  ON bits_matches (home_bits_team_id);
CREATE INDEX IF NOT EXISTS bits_matches_away_team  ON bits_matches (away_bits_team_id);
CREATE INDEX IF NOT EXISTS bits_matches_date       ON bits_matches (match_date);

CREATE TABLE IF NOT EXISTS bits_match_scores (
  id              bigserial   PRIMARY KEY,
  bits_match_id   integer     NOT NULL REFERENCES bits_matches(bits_match_id) ON DELETE CASCADE,
  player_name     text        NOT NULL,
  serie           integer     NOT NULL,
  board           integer     NOT NULL,
  score           integer     NOT NULL,
  order_index     integer     NOT NULL,
  is_home_team    boolean,
  synced_at       timestamptz DEFAULT now(),
  UNIQUE (bits_match_id, player_name, serie, board)
);

CREATE INDEX IF NOT EXISTS bits_match_scores_match ON bits_match_scores (bits_match_id);
