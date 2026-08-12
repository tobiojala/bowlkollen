-- ─── BITS sync scheduler (in-database, reliable) ─────────────────────────────
-- Runs the nightly-style BITS sync on a pg_cron schedule so match / score /
-- exact-result / delmatch data stays fresh WITHOUT depending on a hand-set
-- dashboard cron (which isn't version-controlled and can silently disappear —
-- that's why the last sync stalled at 2026-07-29).
--
-- Cadence: every 3 hours (8×/day). Match-night results land within a few hours,
-- and off-season runs are cheap no-ops (the sync only processes pending work).
--
-- ── ONE-TIME SETUP ──────────────────────────────────────────────────────────
-- Store the endpoint + secret in Supabase Vault ONCE (never commit the values):
--   select vault.create_secret('https://bowlkollen.se/api/cron/bits-sync', 'bits_sync_url');
--   select vault.create_secret('<CRON_SECRET>',                            'bits_sync_secret');
-- CRON_SECRET must equal the web app's CRON_SECRET env var. To rotate the URL/
-- secret later, use vault.update_secret(); no need to touch this job.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Idempotent: drop any previous version of this job before (re)scheduling.
select cron.unschedule(jobid) from cron.job where jobname = 'bits-sync';

select cron.schedule(
  'bits-sync',
  '7 */3 * * *', -- :07 past the hour, every 3 hours (offset off the hour)
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'bits_sync_url'),
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'bits_sync_secret')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 280000
  );
  $$
);

-- Verify:      select jobid, schedule, jobname, active from cron.job where jobname = 'bits-sync';
-- Run history: select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname='bits-sync') order by start_time desc limit 10;
