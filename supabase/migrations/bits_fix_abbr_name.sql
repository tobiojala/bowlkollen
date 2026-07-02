-- Fixes abbr_name generation for hyphenated first names.
-- BITS abbreviates "Lars-Olof" as "L-O." (one letter per hyphen part), not "L."
-- — our generated column only took the first letter of the whole first_name,
-- so every hyphenated-first-name player (Lars-Olof, Karl-Åke, Per-Gunnar, …)
-- had zero candidates during name resolution. Confirmed via real unresolved
-- score rows: "L-O. Strömberg", "K-Å. Claesson", "B-G. Persson", etc.
--
-- Postgres can't alter a generated column's expression in place, so the
-- column is dropped and re-added. The dependent index is recreated after.

DROP INDEX IF EXISTS bits_players_abbr;

ALTER TABLE bits_players DROP COLUMN abbr_name;

ALTER TABLE bits_players ADD COLUMN abbr_name text GENERATED ALWAYS AS (
  CASE
    WHEN first_name IS NULL OR first_name = '' THEN sur_name
    -- Collapse each hyphen-separated word in first_name down to its first
    -- letter (generated columns can't contain subqueries, so no unnest/array
    -- here — regexp_replace runs entirely on the row's own text value).
    -- "Lars-Olof" -> "L-O", "Karl-Åke" -> "K-Å", "Lars" -> "L".
    ELSE regexp_replace(first_name, '([[:alpha:]])[[:alpha:]]*', '\1', 'g') || '. ' || sur_name
  END
) STORED;

CREATE INDEX IF NOT EXISTS bits_players_abbr ON bits_players (abbr_name);

-- The DROP/ADD COLUMN above rewrites the whole table, which invalidates the
-- planner's statistics for it. Without this, the next resolve_bits_player_lic_nbrs
-- run can pick a catastrophic join plan — see bits_fix_resolve_performance.sql.
ANALYZE bits_players;
