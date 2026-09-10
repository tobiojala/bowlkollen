-- BITS national player ranking (rankingpoäng) — the authoritative figure BITS
-- shows, which we can't recompute (§K 10 point tables are internal to BITS), so
-- we INGEST it. Source: POST bits.swebowl.se/MiscFrontApiConnector/GetPlayerRanking
-- (site connector, session cookie) → rows keyed by licenseNumber → our lic_nbr.
-- It's the current rolling ranking (no season param); we stamp the current
-- bowling season_id as the snapshot label. One row per (season, player).

create table if not exists bits_player_ranking (
  season_id             int   not null,
  lic_nbr               text  not null,
  player_name           text,
  club_name             text,
  place_male            int,
  place_female          int,
  rank_points           numeric,
  average               numeric,
  average_bonus_points  numeric,
  total_rounds          int,
  skill_level           numeric,
  skill_level_average   numeric,
  hcp                   numeric,
  gender                text,
  in_active             boolean,
  synced_at             timestamptz default now(),
  primary key (season_id, lic_nbr)
);

-- Public federation data → public read; writes only via service role (RLS blocks
-- anon/authenticated writes, service role bypasses RLS).
alter table bits_player_ranking enable row level security;

drop policy if exists "public read bits_player_ranking" on bits_player_ranking;
create policy "public read bits_player_ranking" on bits_player_ranking
  for select using (true);

-- Join path is by licence number (→ bits_players.lic_nbr → public_id).
create index if not exists idx_bits_player_ranking_lic on bits_player_ranking (lic_nbr);
