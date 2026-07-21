-- Admin model: a real "is this caller an admin?" gate.
--
-- Until now the admin claim/captain functions were gated on "logged in" only
-- (their own comments said so) — so any authenticated user could read pending
-- claims (emails, licence nrs) or bootstrap captain. This adds a proper admin
-- primitive and enforces it inside every admin function.
--
-- Design: a dedicated `admins` table with NO write policies, so admin status
-- can only be granted via SQL/dashboard (never self-granted through the API).
-- `is_admin()` is SECURITY DEFINER so it can read `admins` regardless of the
-- caller's RLS. Read functions gain `AND is_admin()` (non-admins get zero rows,
-- no PII leak); action functions raise `not_admin`.

-- ─── admins table ────────────────────────────────────────────────────────────
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- Read your OWN admin status; nobody can INSERT/UPDATE/DELETE via the API
-- (no such policies) — admins are added only via SQL/dashboard.
drop policy if exists "admins: read own" on public.admins;
create policy "admins: read own" on public.admins
  for select using (auth.uid() = user_id);

-- ─── is_admin() helper ───────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ─── seed the first admin (by email) ─────────────────────────────────────────
-- Requires that this account has logged in at least once (so the auth.users row
-- exists). If it inserts 0 rows, log in once then re-run just this statement.
insert into public.admins (user_id)
select id from auth.users where email = 'tobias.bergmark@gmail.com'
on conflict (user_id) do nothing;

-- ─── read functions: append `AND is_admin()` (non-admins get zero rows) ──────
create or replace function get_pending_claims()
returns table (claim_id uuid, public_id uuid, player_name text, club_name text, claimed_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select pc.id, bp.public_id,
    case when bp.first_name is null or bp.first_name = '' then bp.sur_name
         else bp.first_name || ' ' || bp.sur_name end,
    bp.club_name, pc.claimed_at
  from player_claims pc
  join bits_players bp on bp.public_id = pc.player_id
  where pc.status = 'pending' and public.is_admin()
  order by pc.claimed_at asc;
$$;

create or replace function get_pending_team_claims()
returns table (claim_id uuid, bits_team_id integer, team_name text, club_name text, user_email text, claimed_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select tc.id, tc.bits_team_id, bt.name, bt.club_name, u.email::text, tc.claimed_at
  from team_claims tc
  left join bits_teams bt on bt.bits_team_id = tc.bits_team_id
  left join auth.users u on u.id = tc.user_id
  where tc.status = 'pending' and public.is_admin()
  order by tc.claimed_at asc;
$$;

create or replace function get_pending_captain_requests()
returns table (claim_id uuid, bits_team_id integer, team_name text, club_name text, user_email text, captain_requested_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select tc.id, tc.bits_team_id, bt.name, bt.club_name, u.email::text, tc.captain_requested_at
  from team_claims tc
  left join bits_teams bt on bt.bits_team_id = tc.bits_team_id
  left join auth.users u on u.id = tc.user_id
  where tc.status = 'verified' and tc.captain_requested_at is not null
    and public.is_admin()
    and not exists (
      select 1 from team_claims c2
      where c2.bits_team_id = tc.bits_team_id and c2.status = 'verified' and c2.role = 'captain'
    )
  order by tc.captain_requested_at asc;
$$;

-- ─── action functions: raise not_admin ───────────────────────────────────────
create or replace function update_claim_status(p_claim_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if p_status not in ('verified', 'rejected') then
    raise exception 'invalid status: %', p_status;
  end if;
  update player_claims
  set status = p_status, verified_at = case when p_status = 'verified' then now() else verified_at end
  where id = p_claim_id;
end;
$$;

create or replace function update_team_claim_status(p_claim_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if p_status not in ('verified', 'rejected') then
    raise exception 'invalid status: %', p_status;
  end if;
  update team_claims
  set status = p_status, verified_at = case when p_status = 'verified' then now() else verified_at end
  where id = p_claim_id;
end;
$$;

create or replace function admin_bootstrap_captain(p_claim_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  update team_claims
  set role = 'captain', vouched = true, captain_requested_at = null
  where id = p_claim_id and status = 'verified';
  if not found then raise exception 'not_verified_member'; end if;
end;
$$;

create or replace function admin_create_bootstrap_code(p_bits_team_id integer)
returns text language plpgsql security definer set search_path = public, extensions
as $$
declare v_code text;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  v_code := encode(gen_random_bytes(9), 'base64');
  v_code := replace(replace(replace(v_code, '/', '_'), '+', '-'), '=', '');
  insert into invite_codes (code, code_type, scope_bits_team_id, issued_by)
  values (v_code, 'new_team_bootstrap', p_bits_team_id, auth.uid());
  return v_code;
end;
$$;

-- ─── grants: authenticated only, never anon/PUBLIC (order-independent) ────────
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(array[
        'get_pending_claims','get_pending_team_claims','get_pending_captain_requests',
        'update_claim_status','update_team_claim_status',
        'admin_bootstrap_captain','admin_create_bootstrap_code'
      ])
  loop
    execute format('revoke execute on function %s from anon', r.sig);
    execute format('revoke execute on function %s from public', r.sig);
    execute format('grant execute on function %s to authenticated', r.sig);
  end loop;
end $$;
