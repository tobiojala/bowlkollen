-- Allow following a division (Schema browse → Följ). The follows table
-- previously only permitted 'player' | 'team'. Everything else about the
-- follow system (RLS, unique constraint, indexes) already generalises.
alter table public.follows drop constraint if exists follows_entity_type_check;
alter table public.follows add constraint follows_entity_type_check
  check (entity_type in ('player', 'team', 'division'));
