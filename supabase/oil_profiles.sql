-- Run in Supabase SQL editor

create table if not exists oil_profiles (
  id          serial primary key,
  name        text not null,
  length_ft   integer,
  ratio       numeric(5,2),
  category    text,   -- 'elite', 'elite_damer', 'bredare', 'sammandrag', 'kval', 'sm'
  season      text,
  description text,   -- human-readable usage description
  pdf_url     text,
  kosi_url    text,
  dat_url     text,
  pat_url     text,
  created_at  timestamptz default now()
);

alter table oil_profiles enable row level security;
create policy "public read oil_profiles"
  on oil_profiles for select using (true);
