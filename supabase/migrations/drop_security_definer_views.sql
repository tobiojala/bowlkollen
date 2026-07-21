-- Fix: security_definer_view (Supabase security advisor, ERROR)
--
-- Two views ran with SECURITY DEFINER (no security_invoker), so they bypassed
-- the querying user's RLS on their underlying tables:
--   * public.standings      — legacy standings view; the app computes standings
--                             from bits_matches (division-standings.ts) instead.
--   * public.follow_counts   — aggregate over the private `follows` table; was
--                             deliberately definer so counts could be public,
--                             but it is unused (grep: zero references in web/mobile).
--
-- Both are dead code. Dropping them removes the finding and the RLS-bypass
-- surface. If public follower counts are wanted later, build them properly —
-- a trigger-maintained counts table (public SELECT RLS) or a SECURITY DEFINER
-- function — not a definer view.

drop view if exists public.standings;
drop view if exists public.follow_counts;
