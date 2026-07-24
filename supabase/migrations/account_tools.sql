-- Self-service account tools: release your player claim, and delete your account.
-- Both act only on the caller (auth.uid()), so no client can touch anyone else.

-- Release (unclaim) the caller's player profile.
create or replace function public.release_player_claim()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.player_claims where user_id = auth.uid();
$$;

grant execute on function public.release_player_claim() to authenticated;

-- Delete the caller's account. Removing the auth.users row cascades to every
-- table that references it ON DELETE CASCADE (player_claims, team_claims,
-- follows, feed_reactions, …). Required for App Store in-app account deletion.
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = public, auth
as $$
  delete from auth.users where id = auth.uid();
$$;

grant execute on function public.delete_my_account() to authenticated;
