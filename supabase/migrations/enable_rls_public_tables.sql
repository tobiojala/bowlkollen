-- Fix: rls_disabled_in_public (Supabase security advisor, CRITICAL)
--
-- 7 legacy public tables had Row-Level Security DISABLED, so the anon key
-- (public, embedded in the web + mobile bundles) could read, write, AND delete
-- every row. All 7 are public competition/reference data, written only by the
-- service-role sync scripts (which bypass RLS). The fix: enable RLS with a
-- read-only public SELECT policy — no anon writes.
--
-- INTENTIONAL BREAKAGE: the legacy admin scoring panel (app/admin/page.tsx) and
-- the team-edit components wrote to these via the ANON client and only worked
-- because RLS was off (i.e. they were open to anyone on the internet). They must
-- be rebuilt behind an authorized path — a SECURITY DEFINER RPC or a service-role
-- API route that verifies an admin/owner — before those features work again.
-- The /admin route also has no access guard; that is a separate follow-up.
--
-- Re-runnable: drops all existing (inert) policies on these tables first, then
-- recreates a single clean read policy and enables RLS (both idempotent).

do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in (
        'leagues','league_teams','seasons',
        'matches','match_results','match_lineups','teams'
      )
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'leagues','league_teams','seasons',
    'matches','match_results','match_lineups','teams'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for select using (true)',
      t || '_public_read', t
    );
  end loop;
end $$;
