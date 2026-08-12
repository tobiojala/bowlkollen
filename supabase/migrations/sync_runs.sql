-- ─── sync_runs: observability for the BITS sync ─────────────────────────────
-- The cron route writes one row per run so we always know when the sync last ran
-- (and whether it was ok). /api/health/sync reads the latest row and returns 503
-- when it's stale, so any uptime monitor alerts automatically.
create table if not exists sync_runs (
  id      bigint generated always as identity primary key,
  ran_at  timestamptz not null default now(),
  kind    text        not null default 'bits',
  ok      boolean     not null,
  summary jsonb
);

create index if not exists sync_runs_ran_at_idx on sync_runs (ran_at desc);

-- Service-role only (writes from the cron route, reads from the health route).
-- No anon/authenticated policies → not exposed to clients.
alter table sync_runs enable row level security;
