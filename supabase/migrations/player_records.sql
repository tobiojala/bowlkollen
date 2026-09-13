-- Persistent per-player career records — so the story engine can honestly claim a
-- "personbästa" again (not just a season best). Two records per licence: the highest
-- single game, and the best serie (a match total). Keyed by UPPER(lic_nbr) so it lines
-- up with how the engine and candidate queries normalise licences; no FK to bits_players
-- (licence casing drifts between the registry and result rows, which would break a FK).
--
-- Flow: backfill once from ALL per-game history we hold, then syncBitsTeamEvents maintains
-- it forward — when a synced game/serie beats the stored record it bumps the row AND emits
-- the personbästa / bästa-serie story. Because the baseline already includes everything
-- synced at backfill time, the first run can't flood; only genuinely new peaks fire.
-- Caveat: "career" = highest we've RECORDED (league per-game data; competitions feed in
-- later via the tävling ingestion). Copy is phrased so that's honest.

CREATE TABLE IF NOT EXISTS player_records (
  lic_nbr             text PRIMARY KEY,
  best_game           integer,
  best_game_date      date,
  best_game_match_id  integer,
  best_serie          integer,
  best_serie_date     date,
  best_serie_match_id integer,
  first_tracked_at    timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Public achievements: anyone may read; writes are service-role only (no write policy).
ALTER TABLE player_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS player_records_read ON player_records;
CREATE POLICY player_records_read ON player_records FOR SELECT USING (true);

-- ── one-time backfill (safe to re-run: only raises a record, never lowers) ─────
WITH per_game AS (
  SELECT upper(r.lic_nbr) AS lic, g.pins, bm.match_date::date AS d, r.bits_match_id AS mid
  FROM bits_match_player_results r
  JOIN bits_matches bm ON bm.bits_match_id = r.bits_match_id
  CROSS JOIN LATERAL unnest(r.series) AS g(pins)
  WHERE r.lic_nbr IS NOT NULL AND g.pins > 0
),
best_game AS (
  SELECT DISTINCT ON (lic) lic, pins AS best_game, d AS bg_date, mid AS bg_match
  FROM per_game ORDER BY lic, pins DESC, d DESC
),
best_serie AS (
  SELECT DISTINCT ON (upper(r.lic_nbr)) upper(r.lic_nbr) AS lic,
         r.total_result AS best_serie, bm.match_date::date AS bs_date, r.bits_match_id AS bs_match
  FROM bits_match_player_results r
  JOIN bits_matches bm ON bm.bits_match_id = r.bits_match_id
  WHERE r.lic_nbr IS NOT NULL AND r.total_result > 0
  ORDER BY upper(r.lic_nbr), r.total_result DESC, bm.match_date DESC
)
INSERT INTO player_records (lic_nbr, best_game, best_game_date, best_game_match_id, best_serie, best_serie_date, best_serie_match_id)
SELECT COALESCE(bg.lic, bs.lic),
       bg.best_game, bg.bg_date, bg.bg_match,
       bs.best_serie, bs.bs_date, bs.bs_match
FROM best_game bg
FULL OUTER JOIN best_serie bs ON bs.lic = bg.lic
ON CONFLICT (lic_nbr) DO UPDATE SET
  best_game           = GREATEST(COALESCE(player_records.best_game, 0),  COALESCE(excluded.best_game, 0)),
  best_game_date      = CASE WHEN COALESCE(excluded.best_game, 0)  > COALESCE(player_records.best_game, 0)  THEN excluded.best_game_date      ELSE player_records.best_game_date      END,
  best_game_match_id  = CASE WHEN COALESCE(excluded.best_game, 0)  > COALESCE(player_records.best_game, 0)  THEN excluded.best_game_match_id  ELSE player_records.best_game_match_id  END,
  best_serie          = GREATEST(COALESCE(player_records.best_serie, 0), COALESCE(excluded.best_serie, 0)),
  best_serie_date     = CASE WHEN COALESCE(excluded.best_serie, 0) > COALESCE(player_records.best_serie, 0) THEN excluded.best_serie_date     ELSE player_records.best_serie_date     END,
  best_serie_match_id = CASE WHEN COALESCE(excluded.best_serie, 0) > COALESCE(player_records.best_serie, 0) THEN excluded.best_serie_match_id ELSE player_records.best_serie_match_id END,
  updated_at          = now();
