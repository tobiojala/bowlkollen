-- Player profile photos — owner-uploaded, admin-reviewed before they go public.
-- The photo lives on the player's verified claim; it's shown everywhere that
-- player's avatar renders (via get_approved_avatars) once an admin approves it.
-- Juniors can never set a public photo (senior/child-safety policy).

alter table player_claims
  add column if not exists avatar_url text,
  add column if not exists avatar_status text
    check (avatar_status in ('pending', 'approved', 'rejected'));

-- Owner sets/replaces their own photo → always returns to 'pending' for review.
-- Blocks juniors and requires a verified claim.
create or replace function set_my_player_avatar(p_avatar_url text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_is_junior boolean;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select bp.is_junior into v_is_junior
  from player_claims pc
  join bits_players bp on bp.public_id = pc.player_id
  where pc.user_id = v_uid and pc.status = 'verified'
  limit 1;

  if not found then raise exception 'no verified player claim'; end if;
  if v_is_junior then raise exception 'junior profiles cannot set a public photo'; end if;

  update player_claims
    set avatar_url = p_avatar_url, avatar_status = 'pending'
    where user_id = v_uid and status = 'verified';
  return 'pending';
end;
$$;

-- Admin approves / rejects a pending photo.
create or replace function moderate_player_avatar(p_public_id uuid, p_decision text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'bad decision'; end if;
  update player_claims set avatar_status = p_decision where player_id = p_public_id;
end;
$$;

-- Public, safe subset: only approved photos, only (public_id → url).
create or replace function get_approved_avatars()
returns table(public_id uuid, avatar_url text)
language sql
stable
security definer
set search_path = public
as $$
  select player_id, avatar_url
  from player_claims
  where avatar_status = 'approved' and avatar_url is not null;
$$;

-- Admin review queue.
create or replace function get_pending_avatars()
returns table(public_id uuid, avatar_url text, player_name text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  return query
    select pc.player_id, pc.avatar_url, bp.name
    from player_claims pc
    join bits_players bp on bp.public_id = pc.player_id
    where pc.avatar_status = 'pending' and pc.avatar_url is not null;
end;
$$;

grant execute on function set_my_player_avatar(text)          to authenticated;
grant execute on function moderate_player_avatar(uuid, text)  to authenticated;
grant execute on function get_approved_avatars()              to anon, authenticated;
grant execute on function get_pending_avatars()               to authenticated;

-- ── Storage bucket ────────────────────────────────────────────────────────────
-- Create the public `avatars` bucket and let a signed-in user write ONLY inside
-- their own uid-prefixed folder; everyone can read (public identity).
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars owner write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
