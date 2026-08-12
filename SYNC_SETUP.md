# BITS sync — go-live setup

How to get the BITS data sync running reliably (≥ several times/day) before launch,
plus a health check that auto-alerts if it ever stalls.

All the code is already committed. This file is the **deploy + configure** checklist.

- Web app: `apps/web` (Next.js, deployed on Vercel → `bowlkollen.vercel.app`)
- Sync route: `POST|GET /api/cron/bits-sync`  (auth: `Bearer $CRON_SECRET`)
- Health route: `GET /api/health/sync?token=$CRON_SECRET`  (200 = ok, 503 = stale)
- Migrations: `supabase/migrations/bits_sync_cron.sql`, `supabase/migrations/sync_runs.sql`

---

## Will deploying break the landing / old web build?

**No.** The two routes are new files under `app/api/` — they don't touch the landing
page or any existing page. They're purely additive.

The only caveat with redeploying `apps/web` after a long gap is that *some other*
accumulated change might fail the build. So before deploying:

```bash
cd apps/web
npm run build      # must be green
```

If the build passes, the deploy is safe — the landing keeps working and you just gain
two new API endpoints.

---

## Step 1 — Deploy `apps/web` to Vercel with a CRON_SECRET

1. Generate a secret:
   ```bash
   openssl rand -hex 32
   ```
2. Vercel → project → **Settings → Environment Variables** → add:
   - `CRON_SECRET` = the value from step 1 (Production).
   - (Confirm the Supabase env vars the app already needs are set: `SUPABASE_URL`,
     `SUPABASE_SERVICE_ROLE_KEY`, etc.)
3. Deploy (push to the deployed branch, or "Redeploy" in Vercel).

The web app must be publicly reachable for the sync to run.

---

## Step 2 — Run the migrations (Supabase → SQL Editor)

Run both:
- `supabase/migrations/sync_runs.sql`      (run-log table)
- `supabase/migrations/bits_sync_cron.sql` (only needed for the pg_cron option below)

---

## Step 3 — Pick a scheduler

### Option A — Vercel Cron  (simplest; **needs Vercel Pro** for >1×/day)

Add `apps/web/vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/bits-sync", "schedule": "7 */3 * * *" }
  ]
}
```

- Vercel automatically sends `Authorization: Bearer $CRON_SECRET` for cron calls, so no
  Vault needed.
- **Hobby plan limit:** cron jobs run at most **once per day**. If you're on Hobby and
  want several times a day, either upgrade to Pro or use Option B.
- Redeploy after adding `vercel.json`.

### Option B — Supabase pg_cron  (every 3h on any Vercel plan)

Runs the schedule from inside Postgres, so it's not limited by the Vercel plan.

1. Run `bits_sync_cron.sql` (Step 2 already, if you skipped it).
2. Store two secrets in **Supabase Vault** (Dashboard → SQL Editor). Argument order is
   **value first, name second**:
   ```sql
   select vault.create_secret('https://bowlkollen.vercel.app/api/cron/bits-sync', 'bits_sync_url');
   select vault.create_secret('PASTE-YOUR-CRON_SECRET-HERE',                      'bits_sync_secret');
   ```
   `bits_sync_secret` **must exactly match** the `CRON_SECRET` env var on Vercel.

   Update later with:
   ```sql
   select vault.update_secret((select id from vault.secrets where name='bits_sync_url'),
                              'https://new-url/api/cron/bits-sync');
   ```

> Don't run BOTH options at once, or the sync double-runs (harmless but wasteful).
> Recommended: **Option B** unless you're on Vercel Pro.

---

## Step 4 — Verify

Force one run now (Supabase → SQL Editor):

```sql
select net.http_post(
  url     := (select decrypted_secret from vault.decrypted_secrets where name='bits_sync_url'),
  headers := jsonb_build_object('Content-Type','application/json',
             'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='bits_sync_secret')),
  body    := '{}'::jsonb
);
```

A few seconds later, check it recorded a run:

```sql
select ran_at, ok from sync_runs order by ran_at desc limit 3;
```

And open the health endpoint in a browser:

```
https://bowlkollen.vercel.app/api/health/sync?token=YOUR-CRON_SECRET
```

Expect `"status":"ok"` and HTTP 200. A fresh `sync_runs` row = wired up correctly.

pg_cron run history (Option B):

```sql
select * from cron.job_run_details
where jobid = (select jobid from cron.job where jobname='bits-sync')
order by start_time desc limit 10;
```

---

## Step 5 — Uptime monitor (the "never silently dies" safety net)

Point any uptime service (UptimeRobot, Better Stack, Cronitor…) at:

```
https://bowlkollen.vercel.app/api/health/sync?token=YOUR-CRON_SECRET
```

The endpoint returns **503 when the sync is stale** (no successful run in ~8h) or the last
run failed, so the monitor alerts you automatically. Check every 15–30 min.

---

## Caveats / notes

- **Function timeout.** The route is capped at `maxDuration = 60s`. The scores/exact/
  delmatch batches are bounded and fit easily. The **daily player-list sync** (runs only
  in the 00:00–03:00 UTC window) paginates the whole national list and can be slow — on a
  short-timeout plan it may not finish. If players don't refresh, bump `maxDuration`
  (Vercel Pro allows up to 300s) or run the player sync from the admin sync page manually.
- **Cadence** is `7 */3 * * *` = every 3 hours at :07. Change in `vercel.json` (Option A)
  or `bits_sync_cron.sql` (Option B).
- **Old dashboard cron / edge function.** If a `bits-nightly` schedule exists in the
  Supabase dashboard, remove it once this is live (avoids double-runs). The
  `supabase/functions/bits-nightly` edge function is now unused.

---

## Quick launch checklist

- [ ] `npm run build` green in `apps/web`
- [ ] `CRON_SECRET` set on Vercel + web redeployed
- [ ] `sync_runs.sql` run
- [ ] Scheduler set (Vercel Cron **or** pg_cron + Vault secrets)
- [ ] Forced run recorded a `sync_runs` row
- [ ] Health URL returns `"status":"ok"`
- [ ] Uptime monitor pointed at the health URL
- [ ] Old `bits-nightly` dashboard cron removed (if any)
