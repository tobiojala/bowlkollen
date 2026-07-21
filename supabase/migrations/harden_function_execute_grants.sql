-- Fix: anon_security_definer_function_executable + function_search_path_mutable (WARN)
--
-- Postgres grants EXECUTE to PUBLIC (incl. anon) by default, and the migrations
-- that created these functions only ADDED `GRANT ... TO authenticated` without
-- revoking the default PUBLIC grant. So privileged claim/captain/admin functions
-- were callable by anon over /rest/v1/rpc — exposing claim PII (emails + licence
-- numbers via get_pending_*) and reaching captain-granting logic without auth.
--
-- Verified before locking down: all 14 privileged functions are called only from
-- authenticated client contexts (admin/claims page, profile page, React Query
-- hooks) — never via createPublicSupabase (anon). So revoking anon+PUBLIC is safe.
--
-- Deliberately UNCHANGED: the public-read functions (get_player_identity,
-- get_team_roster, get_division_rivals, get_nearby_teams, get_player_match_history,
-- etc.) stay anon-callable — they power public pages. Their advisor warnings are
-- expected/intentional.
--
-- NOTE (tracked follow-up): these functions are still gated on "logged in", NOT
-- real admin status. A proper admin model + in-body admin checks is the next
-- security task (same gap as the unguarded /admin route).

-- 1. Privileged, authenticated-only: revoke anon + PUBLIC (keep authenticated).
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(array[
        'get_pending_claims','get_pending_team_claims','get_pending_captain_requests',
        'admin_bootstrap_captain','admin_create_bootstrap_code',
        'update_claim_status','update_team_claim_status','request_captain',
        'create_team_invite_code','transfer_captain','set_team_role',
        'save_team_lineup','submit_player_claim','submit_team_claim'
      ])
  loop
    execute format('revoke execute on function %s from anon', r.sig);
    execute format('revoke execute on function %s from public', r.sig);
  end loop;
end $$;

-- 2. Trigger / internal-maintenance functions: never legitimate RPCs — revoke all.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(array[
        'handle_new_user','notify_team_followers','enforce_junior_follow_guard',
        'fix_bits_home_team_assignment','resolve_bits_player_lic_nbrs',
        'resolve_bits_player_lic_nbrs_by_club','resolve_bits_player_lic_nbrs_by_agreement',
        'bits_player_is_junior'
      ])
  loop
    execute format('revoke execute on function %s from anon', r.sig);
    execute format('revoke execute on function %s from authenticated', r.sig);
    execute format('revoke execute on function %s from public', r.sig);
  end loop;
end $$;

-- 3. Pin an explicit search_path on the functions flagged as mutable
--    (closes the search_path-hijack vector on SECURITY DEFINER code).
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(array[
        'handle_new_user','fix_bits_home_team_assignment','notify_team_followers',
        'resolve_bits_player_lic_nbrs','resolve_bits_player_lic_nbrs_by_club',
        'resolve_bits_player_lic_nbrs_by_agreement','bits_player_is_junior'
      ])
  loop
    execute format('alter function %s set search_path = public, extensions', r.sig);
  end loop;
end $$;
