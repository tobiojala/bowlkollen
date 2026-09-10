-- A player's current BITS national ranking, looked up by public_id. Joins to
-- bits_player_ranking through lic_nbr SERVER-SIDE and never returns lic_nbr
-- (findable identifier — kept private, same as get_player_identity). Public data,
-- so anon may call it. Returns the newest season's row, or no rows if unranked.
create or replace function get_player_ranking(p_public_id uuid)
returns table (
  place_male    int,
  place_female  int,
  rank_points   numeric,
  average       numeric,
  total_rounds  int,
  skill_level   numeric,
  gender        text,
  season_id     int
)
language sql
stable
security definer
set search_path = public
as $$
  select r.place_male, r.place_female, r.rank_points, r.average,
         r.total_rounds, r.skill_level, r.gender, r.season_id
  from bits_players p
  join bits_player_ranking r on r.lic_nbr = p.lic_nbr
  where p.public_id = p_public_id
  order by r.season_id desc
  limit 1;
$$;

grant execute on function get_player_ranking(uuid) to anon, authenticated;
