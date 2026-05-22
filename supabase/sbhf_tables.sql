-- Run this in the Supabase SQL editor before running scripts/import-sbhf.ts

-- ─── Bowling centers ────────────────────────────────────────────────────────

create table if not exists bowling_centers (
  id                 integer primary key,   -- SBHF id
  name               text    not null,
  city               text,
  street_address     text,
  postal_code        text,
  phone              text,
  email              text,
  website            text,
  region             text,
  lanes              integer,
  machine_type       text,
  lane_type          text,
  oil_machine        text,
  online_scoring     boolean default false,
  online_scoring_url text,
  online_booking     boolean default false,
  online_booking_url text,
  accepts_gift_cards boolean default false,
  inspection_status  text,
  inspection_date    text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- Public read, no write from client
alter table bowling_centers enable row level security;
create policy "public read bowling_centers"
  on bowling_centers for select using (true);

-- ─── Pro shops ───────────────────────────────────────────────────────────────

create table if not exists pro_shops (
  id                 integer primary key,   -- SBHF id
  name               text    not null,
  city               text,
  street_address     text,
  postal_code        text,
  phone              text,
  mobile             text,
  email              text,
  website            text,
  ibpsia_certified   boolean default false,
  accepts_gift_cards boolean default false,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

alter table pro_shops enable row level security;
create policy "public read pro_shops"
  on pro_shops for select using (true);
