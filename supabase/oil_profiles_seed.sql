-- Seed the shared oil_profiles table with the official SvBF (Swedish federation)
-- oil profiles — the actual patterns used across Swedish league play. Source:
-- swebowl.se regulatory page (same legitimate basis as our BITS data). This is the
-- SQL twin of the web scripts/seed-oil-profiles.ts, so the table can be seeded from
-- the Supabase editor without the service-role scraper.
--
-- Run after supabase/oil_profiles.sql (which creates the table + public-read RLS).

create unique index if not exists oil_profiles_name_key on public.oil_profiles (name);

insert into public.oil_profiles (name, length_ft, ratio, category, season, description) values
  -- EA — Elitserien Herrar + Allsvenskan Herrar + Elitserien Damer
  ('EA 36 2025', 36, 2.65, 'elite', '2025/2026', 'Elitserien Herrar, Allsvenskan Herrar, Elitserien Damer'),
  ('EA 38 B 2025', 38, 3.65, 'elite', '2025/2026', 'Elitserien Herrar, Allsvenskan Herrar, Elitserien Damer'),
  ('EA 40 2025', 40, 3.03, 'elite', '2025/2026', 'Elitserien Herrar, Allsvenskan Herrar, Elitserien Damer'),
  ('EA 42 2025', 42, 3.00, 'elite', '2025/2026', 'Elitserien Herrar, Allsvenskan Herrar, Elitserien Damer'),
  ('EA 44 2025', 44, 2.88, 'elite', '2025/2026', 'Elitserien Herrar, Allsvenskan Herrar, Elitserien Damer'),
  ('EA 46 2025', 46, 3.00, 'elite', '2025/2026', 'Elitserien Herrar, Allsvenskan Herrar, Elitserien Damer'),
  -- DE — Elitserien Damer (extra)
  ('DE 39 2025', 39, 3.85, 'elite_damer', '2025/2026', 'Elitserien Damer (extra)'),
  ('DE 44 2025', 44, 3.24, 'elite_damer', '2025/2026', 'Elitserien Damer (extra)'),
  -- BDA — Allsvenskan Damer + Division 1–3
  ('BDA 38 2025', 38, 4.04, 'bredare', '2025/2026', 'Allsvenskan Damer, Division 1–3'),
  ('BDA 39 2024', 39, 4.32, 'bredare', '2025/2026', 'Allsvenskan Damer, Division 1–3'),
  ('BDA 40 2025', 40, 5.23, 'bredare', '2025/2026', 'Allsvenskan Damer, Division 1–3'),
  ('BDA 41 2023', 41, 5.59, 'bredare', '2025/2026', 'Allsvenskan Damer, Division 1–3'),
  ('BDA 42 2025', 42, 4.40, 'bredare', '2025/2026', 'Allsvenskan Damer, Division 1–3'),
  -- Sammandrag (compilation events)
  ('Sammandrag 38 2025-27', 38, 5.50, 'sammandrag', '2025/2027', 'Sammandrag'),
  ('Sammandrag 39 2025-27', 39, 3.57, 'sammandrag', '2025/2027', 'Sammandrag'),
  ('Sammandrag 40 2025-27', 40, 3.89, 'sammandrag', '2025/2027', 'Sammandrag'),
  ('Sammandrag 41 2025-27', 41, 5.24, 'sammandrag', '2025/2027', 'Sammandrag'),
  ('Sammandrag 42 2025-27', 42, 4.60, 'sammandrag', '2025/2027', 'Sammandrag'),
  ('Sammandrag 43 DE 2026', 43, 3.67, 'sammandrag', '2025/2026', 'Sammandrag Damer'),
  ('Sammandrag Elitserien Herrar 2026', 43, 2.95, 'sammandrag', '2025/2026', 'Sammandrag Elitserien Herrar'),
  -- Kvalprofiler 2026
  ('Kval Allsvenskan–Div 2 2026', 40, 3.45, 'kval', '2026', 'Kval till Allsvenskan och Division 2'),
  ('Kval Elitserien Dam och Herr 2026', 37, 2.07, 'kval', '2026', 'Kval till Elitserien Dam och Herr'),
  ('Elitserien Slutspelskval Herrar 2026', 40, 2.80, 'kval', '2026', 'Elitserien Slutspelskval Herrar'),
  -- SM Slutspel 2026
  ('Dam SM Slutspel 2026 – Glendert', 39, 2.64, 'sm', '2026', 'Dam SM Slutspel 2026'),
  ('Dam SM Slutspel 2026 – Flack', 44, 2.76, 'sm', '2026', 'Dam SM Slutspel 2026'),
  ('Herr SM Slutspel 2026 – Linus', 39, 1.75, 'sm', '2026', 'Herr SM Slutspel 2026'),
  ('Herr SM Slutspel 2026 – Backe', 43, 1.46, 'sm', '2026', 'Herr SM Slutspel 2026')
on conflict (name) do update set
  length_ft = excluded.length_ft,
  ratio = excluded.ratio,
  category = excluded.category,
  season = excluded.season,
  description = excluded.description;
