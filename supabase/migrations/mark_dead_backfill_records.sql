-- After the 2008–2020 history backfill, two pools of historical records keep the
-- 3-hourly sync reporting ok=false even though the live sync (divisions/matches/
-- scores) is perfectly healthy:
--   1. ~52 ancient (pre-2021) matches that BITS's own GetMatchResults 500s on
--      permanently — unrecoverable, but retried every run.
--   2. The old-season delmatch (2v2 bord) backlog, which we deliberately chose
--      NOT to backfill — old matches flake on GetMatchScores.
-- Mark them "processed" so they leave the pending pools: the cron then only
-- maintains recent seasons (fast, clean ok=true) and health monitoring is
-- meaningful. Recent-season backfill is unaffected (scoped to season_id < 2021).

-- 1. Dead exact-results records (the 52). Scoped pre-2021 so no recent pending
--    match is ever marked without actually syncing.
update bits_matches
set exact_results_synced = true
where is_finished = true and exact_results_synced = false and season_id < 2021;

-- 2. Old-season delmatch backlog. Comment this out if you'd rather KEEP the old
--    2v2 data as pending and drain it deliberately later (scripts/drain-backfill.mjs
--    delmatch) — leaving it pending just means the cron logs ok=false until drained.
update bits_matches
set delmatch_synced = true
where is_finished = true and delmatch_synced = false and season_id < 2021;

-- Verify both pools are now just recent-season (should be small / zero):
--   select season_id, count(*) from bits_matches
--   where is_finished and (exact_results_synced = false or delmatch_synced = false)
--   group by season_id order by season_id desc;
