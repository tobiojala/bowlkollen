-- Defense-in-depth for the "Public Can Execute SECURITY DEFINER Function"
-- advisor warnings. These functions ALREADY reject unauthorized callers
-- internally (auth.uid()/role checks), so anon calling them just throws — not a
-- hole. But anon has no legitimate reason to reach them, so revoke anon EXECUTE
-- and grant to authenticated only. This also clears those warnings.
--
-- Read functions that power PUBLIC pages (get_player_*, get_team_roster,
-- get_discover_*, stats, invite validation, anon view-tracking) are deliberately
-- left anon-callable and are NOT in this list.
do $$
declare
  r record;
  auth_only text[] := array[
    -- team writes (captain/board-verified inside)
    'create_team_post','create_team_poll','save_team_lineup',
    'submit_availability_response','submit_team_claim','set_team_role',
    'set_member_role','request_captain','transfer_captain',
    'create_team_invite_code','set_team_color',
    -- admin (admin-verified inside)
    'admin_create_member_invite','admin_bulk_member_invites',
    -- account (acts on auth.uid() only)
    'delete_my_account','release_player_claim',
    -- "my" reads (auth.uid()-scoped — meaningless for anon)
    'get_my_selections','get_my_unread_posts','get_user_season_matches'
  ];
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(auth_only)
  loop
    execute format('revoke execute on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated', r.sig);
  end loop;
end $$;
