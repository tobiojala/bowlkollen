-- ─── REVIVE the BITS sync scheduler ─────────────────────────────────────────
-- The nightly sync stopped after 2026-08-16 (no sync_runs since). The route
-- itself is healthy — a manual `Bearer $CRON_SECRET` POST returns 200 and syncs —
-- so the break is in the pg_cron → pg_net → endpoint path, NOT the app code.
--
-- Run these blocks IN ORDER in the Supabase SQL editor. STEP 1 diagnoses; the
-- rest fix. Everything is idempotent and safe to re-run.
-- =============================================================================

-- ── STEP 1 · DIAGNOSE — run these four selects first, read the output ────────

-- 1a. Does the job still exist, and is it active?
--     Expected: one row, active = true. If NO ROW → job was dropped (go to STEP 3).
--     If active = false → it was disabled (STEP 3 re-creates it active).
select jobid, schedule, jobname, active
from cron.job where jobname = 'bits-sync';

-- 1b. What actually happened on recent fires? This is the key diagnostic.
--     status 'succeeded' = pg_cron ran the command; 'failed' = SQL/net error.
--     If the newest start_time is ~2026-08-16 → the job STOPPED firing (STEP 3).
--     If it's firing recently but the sync is still stale → it's reaching the
--     endpoint but getting rejected — check 1c for the HTTP status.
select status, return_message, start_time, end_time
from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'bits-sync')
order by start_time desc limit 20;

-- 1c. What HTTP status did the POSTs get back? (pg_net logs every response.)
--     200 = the sync ran (good). 401 = Vault secret ≠ app CRON_SECRET (STEP 2).
--     timeout / error_msg set = network/timeout problem.
select id, status_code, error_msg, created
from net._http_response order by created desc limit 10;

-- 1d. Are the Vault secrets present and correct?
--     Two rows expected. Compare bits_sync_secret to the web app's CRON_SECRET
--     env var in Vercel — they MUST be identical, or every POST 401s.
select name, decrypted_secret
from vault.decrypted_secrets where name in ('bits_sync_url', 'bits_sync_secret');


-- ── STEP 2 · FIX SECRETS ─────────────────────────────────────────────────────
-- ROOT CAUSE of the 2026-08-16 stall (found 2026-09-07): bits_sync_url pointed at
-- the old vanity host `https://bowlkollen-brain.vercel.app/...`, which now
-- 308-REDIRECTS to bowlkollen.se. pg_net does NOT follow redirects, so every POST
-- hit the 308 and stopped — no sync ever ran. ALWAYS use the production custom
-- domain (bowlkollen.se) here, never the .vercel.app alias.
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'bits_sync_url'),
--     'https://bowlkollen.se/api/cron/bits-sync');
--
-- Secret mismatch (only if 1c shows 401): set bits_sync_secret = Vercel CRON_SECRET.
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'bits_sync_secret'),
--     '<CRON_SECRET>');
-- Create if a row is missing entirely:
--   select vault.create_secret('https://bowlkollen.se/api/cron/bits-sync', 'bits_sync_url');
--   select vault.create_secret('<CRON_SECRET>',                            'bits_sync_secret');


-- ── STEP 3 · RE-ARM the job (idempotent: drops any old copy, reschedules) ────
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname = 'bits-sync';

select cron.schedule(
  'bits-sync',
  '7 */3 * * *',                       -- :07 past the hour, every 3 hours
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


-- ── STEP 4 · FIRE ONCE NOW to prove the whole path end-to-end ────────────────
-- Runs the exact command the schedule runs. Returns a pg_net request id.
select net.http_post(
  url     := (select decrypted_secret from vault.decrypted_secrets where name = 'bits_sync_url'),
  headers := jsonb_build_object(
    'Content-Type',  'application/json',
    'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'bits_sync_secret')
  ),
  body    := '{}'::jsonb,
  timeout_milliseconds := 280000
) as request_id;

-- Wait ~60s (the sync takes ~55s), then confirm both sides succeeded:
--   select id, status_code, error_msg, created from net._http_response order by created desc limit 3;   -- want status_code 200
--   select ran_at, ok, summary from sync_runs order by ran_at desc limit 3;                             -- want a fresh row, ok = true
