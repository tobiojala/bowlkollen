-- Email subscribers for the landing page waitlist
create table if not exists email_subscribers (
  id          bigint generated always as identity primary key,
  email       text not null unique,
  source      text not null default 'landing',
  created_at  timestamptz not null default now()
);

-- Only service role can insert/read (no public access)
alter table email_subscribers enable row level security;

-- No RLS policies needed — service role bypasses RLS by default
-- The subscribe API uses SUPABASE_SERVICE_ROLE_KEY, so inserts work fine
