-- ─── Match kickoff time ──────────────────────────────────────────────────────
-- BITS returns matchDateTime (real wall-clock start, e.g. 2025-09-13T10:00:00)
-- alongside matchDate (always midnight). We used to keep only the date; this
-- column stores the scheduled kickoff so the app can show "lör 13 sep · 10:00".
--
-- Stored as `timestamp` (WITHOUT time zone): the source is naive Swedish local
-- wall-clock, so we keep it verbatim and format HH:mm directly — no tz maths,
-- no off-by-one-hour bugs. NULL until re-synced / backfilled.
alter table public.bits_matches
  add column if not exists match_datetime timestamp without time zone;
