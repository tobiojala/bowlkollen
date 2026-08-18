-- ─── Story-events sweep scheduler (in-database, reliable) ────────────────────
-- Runs the Auto-Story Engine sweep on a pg_cron schedule so followed teams'
-- feed events (match_result, win_streak, …) stay fresh — the reliable equivalent
-- of the Vercel Hobby cron (which is once/day + capped). Same pattern as
-- bits-sync: Vault-stored URL + shared secret, invoked via net.http_post.
--
-- Cadence: every 30 min. The route processes up to `limit` shuffled teams per
-- call (idempotent), so over the day it covers every team with recent matches
-- several times. Off-season it's a cheap no-op (no recently-finished matches).
--
-- ── ONE-TIME SETUP ──────────────────────────────────────────────────────────
-- Store the endpoint in Supabase Vault ONCE (auth reuses bits_sync_secret, which
-- already holds CRON_SECRET from the bits-sync setup — no new secret needed):
--   select vault.create_secret('https://bowlkollen.se/api/cron/story-events', 'story_events_url');

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Idempotent: drop any previous version of this job before (re)scheduling.
select cron.unschedule(jobid) from cron.job where jobname = 'story-events';

select cron.schedule(
  'story-events',
  '*/30 * * * *', -- every 30 minutes
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'story_events_url') || '?limit=60',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'bits_sync_secret')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);

-- Verify:      select jobid, schedule, jobname, active from cron.job where jobname = 'story-events';
-- Run history: select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname='story-events') order by start_time desc limit 10;
