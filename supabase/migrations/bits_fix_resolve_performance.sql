-- Fixes a query-planner trap that caused "Lös spelar-ID" (resolve_bits_player_lic_nbrs)
-- to time out. Root cause, found via EXPLAIN ANALYZE on a realistic-scale benchmark:
--
--   1. bits_match_scores had no index on player_name, the join column used by
--      both resolve_bits_player_lic_nbrs and resolve_bits_player_lic_nbrs_by_club.
--   2. The abbr_name generated column was just dropped and recreated (bits_fix_abbr_name.sql),
--      which rewrites the whole bits_players table — invalidating planner statistics
--      for that column. With stale stats the planner badly underestimated how many
--      rows the GROUP BY ... HAVING COUNT(*) = 1 subquery returns (estimated 1,
--      actual ~44,000) and picked a Nested Loop join instead of a Hash Join: every
--      one of the ~44,000 unique-name groups triggered a full re-scan of the
--      unresolved score rows — ~256 million comparisons, 151.7s in benchmark.
--
-- After adding the index and re-analyzing, the same query plans as a Hash Join
-- and completes in ~170ms at the same data scale (verified in a disposable
-- Postgres 16 container seeded with 55k players / 35k scores).

CREATE INDEX IF NOT EXISTS bits_match_scores_player_name ON bits_match_scores (player_name);

ANALYZE bits_players;
ANALYZE bits_match_scores;
