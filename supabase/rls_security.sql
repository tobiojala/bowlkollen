-- Security hardening (run in Supabase SQL editor)
-- Complements app-level checks in src/proxy.ts and src/lib/app-admin.ts
--
-- BEFORE running: remove any policies that allow unrestricted INSERT/UPDATE/DELETE
-- on matches, match_lineups, and match_results for all authenticated users.

-- ─── App admins ─────────────────────────────────────────────────────────────
create table if not exists app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table app_admins enable row level security;

drop policy if exists "app_admins read own" on app_admins;
create policy "app_admins read own"
  on app_admins for select
  using (auth.uid() = user_id);

-- Insert/delete app_admins via service role or Supabase dashboard only.

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean is true,
    exists (select 1 from public.app_admins a where a.user_id = auth.uid())
  );
$$;

revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated, anon;

-- ─── Live scoring tables (example policies — adjust names if you already have policies) ─
-- drop policy if exists "your_old_open_write_policy" on matches;

drop policy if exists "app admins insert matches" on matches;
drop policy if exists "app admins update matches" on matches;
drop policy if exists "app admins delete matches" on matches;
create policy "app admins insert matches"
  on matches for insert with check (public.is_app_admin());
create policy "app admins update matches"
  on matches for update using (public.is_app_admin()) with check (public.is_app_admin());
create policy "app admins delete matches"
  on matches for delete using (public.is_app_admin());

drop policy if exists "app admins insert match_lineups" on match_lineups;
drop policy if exists "app admins update match_lineups" on match_lineups;
drop policy if exists "app admins delete match_lineups" on match_lineups;
create policy "app admins insert match_lineups"
  on match_lineups for insert with check (public.is_app_admin());
create policy "app admins update match_lineups"
  on match_lineups for update using (public.is_app_admin()) with check (public.is_app_admin());
create policy "app admins delete match_lineups"
  on match_lineups for delete using (public.is_app_admin());

drop policy if exists "app admins insert match_results" on match_results;
drop policy if exists "app admins update match_results" on match_results;
drop policy if exists "app admins delete match_results" on match_results;
create policy "app admins insert match_results"
  on match_results for insert with check (public.is_app_admin());
create policy "app admins update match_results"
  on match_results for update using (public.is_app_admin()) with check (public.is_app_admin());
create policy "app admins delete match_results"
  on match_results for delete using (public.is_app_admin());

-- ─── Profiles: limit email exposure ───────────────────────────────────────────
-- Users read/update their own row; teammates see display fields only via a view.

create or replace view public.profiles_team_display
with (security_invoker = true) as
  select id, full_name, avatar_url
  from public.profiles;

grant select on public.profiles_team_display to authenticated;

-- Optional: revoke direct SELECT on profiles.email for authenticated role in dashboard
-- GRANT SELECT (id, full_name, avatar_url) ON profiles TO authenticated;
